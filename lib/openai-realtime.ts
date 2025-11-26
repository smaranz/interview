'use client'

/**
 * Lightweight WebRTC client for the OpenAI Realtime API.
 * Handles microphone capture, connection lifecycle, and event routing.
 */
export interface RealtimeConfig {
  model?: string
  voice?: string
  sessionEndpoint?: string
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting'

export class OpenAIRealtimeClient {
  private pc: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private mediaStream: MediaStream | null = null
  private audioElement: HTMLAudioElement | null = null
  private config: Required<Pick<RealtimeConfig, 'model' | 'voice'>> & {
    sessionEndpoint: string
  }
  private currentInstructions = ''
  private activeResponse = ''

  public onStatusChange?: (status: ConnectionStatus) => void
  public onTextData?: (text: string) => void
  public onError?: (error: Error) => void
  public onEvent?: (event: unknown) => void

  constructor(config: RealtimeConfig = {}) {
    this.config = {
      model: config.model || 'gpt-realtime-mini',
      voice: config.voice || 'marin',
      sessionEndpoint: config.sessionEndpoint || '/api/realtime/session',
    }
  }

  /**
   * Establishes a WebRTC session with OpenAI Realtime API.
   * Follows the pattern from OpenAI Realtime API documentation.
   */
  async connect(instructions: string) {
    this.currentInstructions = instructions

    if (!instructions.trim()) {
      throw new Error('Interview instructions are required.')
    }

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('This code must run in a browser environment')
    }

    // Check if RTCPeerConnection is available
    if (typeof RTCPeerConnection === 'undefined' || !window.RTCPeerConnection) {
      throw new Error('WebRTC is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.')
    }

    // Ensure previous resources are released before starting a new session
    this.disconnect(false)
    this.onStatusChange?.('connecting')

    try {
      // Step 1: Get local media stream FIRST (before creating peer connection)
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Step 2: Create peer connection
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })

      if (!this.pc) {
        throw new Error('Failed to create RTCPeerConnection')
      }

      // Step 3: Set up audio output (remote audio from OpenAI)
      this.setupAudioOutput()

      // Step 4: Add local audio track to peer connection
      this.mediaStream.getTracks().forEach((track) => {
        if (this.pc) {
          this.pc.addTrack(track, this.mediaStream as MediaStream)
        }
      })

      // Step 5: Set up data channel for events
      this.setupDataChannel()

      // Step 6: Set up connection state handlers
      this.setupPeerConnectionHandlers()

      // Step 7: Create offer and set local description
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      // Step 8: Send SDP offer to server
      const response = await fetch(this.config.sessionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp ?? '',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Failed to create realtime session (${response.status})`
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          // If not JSON, use the text or default message
          if (errorText) {
            errorMessage = errorText.length > 200 ? errorMessage : errorText
          }
        }
        throw new Error(errorMessage)
      }

      // Step 9: Set remote description from server response
      const answerSdp = await response.text()
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Realtime connection failed')
      console.error('OpenAI Realtime connection error:', err)
      this.onError?.(err)
      this.onStatusChange?.('disconnected')
      this.disconnect(false)
      throw err
    }
  }

  /**
   * Disconnects the session and releases resources.
   */
  disconnect(notify = true) {
    if (notify) {
      this.onStatusChange?.('disconnected')
    }

    this.activeResponse = ''

    if (this.dataChannel) {
      try {
        this.dataChannel.close()
      } catch {
        // ignore
      }
    }
    this.dataChannel = null

    if (this.pc) {
      try {
        this.pc.close()
      } catch {
        // ignore
      }
    }
    this.pc = null

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
    }
    this.mediaStream = null

    if (this.audioElement) {
      this.audioElement.srcObject = null
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement)
      }
    }
    this.audioElement = null
  }

  /**
   * Sends a JSON event through the data channel if it is open.
   */
  private sendEvent(event: Record<string, unknown>) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(event))
    }
  }

  private setupAudioOutput() {
    if (!this.audioElement) {
      this.audioElement = document.createElement('audio')
      this.audioElement.autoplay = true
      this.audioElement.style.display = 'none'
      this.audioElement.setAttribute('playsinline', 'true')
      document.body.appendChild(this.audioElement)
      
      // Ensure audio plays
      this.audioElement.addEventListener('loadedmetadata', () => {
        this.audioElement?.play().catch(err => {
          console.error('Failed to play audio:', err)
        })
      })
    }
  }

  private setupPeerConnectionHandlers() {
    if (!this.pc) return

    // Handle remote audio tracks from OpenAI
    this.pc.ontrack = (event) => {
      console.log('Received remote audio track:', event)
      if (this.audioElement && event.streams[0]) {
        this.audioElement.srcObject = event.streams[0]
        // Force play
        this.audioElement.play().catch(err => {
          console.error('Failed to play remote audio:', err)
        })
      }
    }

    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      if (!this.pc) return
      if (this.pc.connectionState === 'connected') {
        this.onStatusChange?.('connected')
      } else if (
        this.pc.connectionState === 'disconnected' ||
        this.pc.connectionState === 'failed' ||
        this.pc.connectionState === 'closed'
      ) {
        this.onStatusChange?.('disconnected')
      }
    }

    // Handle ICE connection state changes
    this.pc.oniceconnectionstatechange = () => {
      if (!this.pc) return
      if (this.pc.iceConnectionState === 'failed') {
        this.onError?.(new Error('ICE connection failed'))
      }
    }
  }

  private setupDataChannel() {
    if (!this.pc) {
      throw new Error('RTCPeerConnection is not initialized for data channel')
    }

    this.dataChannel = this.pc.createDataChannel('oai-events')

    this.dataChannel.onopen = () => {
      console.log('Data channel opened, sending session update')
      
      // Update session with instructions
      this.sendEvent({
        type: 'session.update',
        session: {
          type: 'realtime',
          instructions: this.currentInstructions,
        },
      })

      // Wait a bit for session to be ready, then start conversation
      setTimeout(() => {
        this.startConversation()
      }, 500)
    }

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleServerEvent(data)
      } catch (err) {
        console.error('Failed to parse realtime event:', err)
      }
    }

    this.dataChannel.onerror = () => {
      this.onError?.(new Error('Realtime data channel error'))
    }
  }

  private startConversation() {
    console.log('Starting conversation, sending response.create')
    this.sendEvent({
      type: 'response.create',
      response: {
        instructions:
          'Begin the interview by introducing yourself briefly and asking the first question based on the provided job description.',
      },
    })
  }

  private handleServerEvent(event: any) {
    console.log('Received server event:', event.type, event)
    this.onEvent?.(event)

    if (event.type === 'response.output_text.delta') {
      const delta = Array.isArray(event.delta) ? event.delta.join('') : event.delta
      if (typeof delta === 'string') {
        this.activeResponse += delta
      }
    }

    if (event.type === 'response.completed') {
      if (this.activeResponse.trim().length > 0) {
        this.onTextData?.(this.activeResponse.trim())
      }
      this.activeResponse = ''
    }

    if (event.type === 'session.updated') {
      console.log('Session updated successfully')
    }

    if (event.type === 'response.created') {
      console.log('Response created, waiting for audio...')
    }

    if (event.type === 'response.audio_transcript.delta' || event.type === 'response.audio_transcript.done') {
      console.log('Audio transcript event:', event)
    }

    if (typeof event.type === 'string' && event.type.endsWith('.error')) {
      const message = event.error?.message || 'Realtime session error'
      console.error('Server error event:', event)
      this.onError?.(new Error(message))
    }
  }
}


