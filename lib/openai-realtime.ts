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
  private sessionReady = false
  private hasAlexSpokenFirst = false // Track if Alex has spoken first

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
  async connect(instructions: string, existingAudioStream?: MediaStream) {
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
      // Reuse existing stream if provided, otherwise request new one
      if (existingAudioStream && existingAudioStream.getAudioTracks().length > 0) {
        // Clone the audio track from existing stream to avoid conflicts
        const audioTrack = existingAudioStream.getAudioTracks()[0]
        this.mediaStream = new MediaStream([audioTrack])
      } else {
        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
        } catch (mediaError) {
          if (mediaError instanceof DOMException) {
            if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
              throw new Error(
                'Microphone permission denied. Please:\n' +
                '1. Click the microphone icon in your browser\'s address bar\n' +
                '2. Select "Allow" for microphone access\n' +
                '3. Refresh the page and try again'
              )
            } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
              throw new Error('No microphone found. Please connect a microphone and try again.')
            } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
              throw new Error('Microphone is being used by another application. Please close other apps using the microphone and try again.')
            }
          }
          throw mediaError
        }
      }

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
      // Mute the microphone initially so user can't speak before Alex
      this.mediaStream.getTracks().forEach((track) => {
        if (track.kind === 'audio') {
          track.enabled = false // Mute microphone until Alex speaks first
        }
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

      // Wait for local description to be set
      if (this.pc.signalingState !== 'have-local-offer') {
        throw new Error('Failed to set local description: unexpected signaling state')
      }

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
      // Check signaling state before setting remote description
      if (!this.pc || this.pc.signalingState !== 'have-local-offer') {
        throw new Error(`Cannot set remote description: peer connection is in wrong state (${this.pc?.signalingState || 'null'})`)
      }

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
    this.sessionReady = false
    this.hasAlexSpokenFirst = false // Reset flag on disconnect

    if (this.dataChannel) {
      try {
        if (this.dataChannel.readyState !== 'closed') {
          this.dataChannel.close()
        }
      } catch {
        // ignore
      }
    }
    this.dataChannel = null

    if (this.pc) {
      try {
        // Remove all event listeners to prevent state changes during cleanup
        this.pc.ontrack = null
        this.pc.onconnectionstatechange = null
        this.pc.oniceconnectionstatechange = null
        
        // Close the connection properly
        if (this.pc.signalingState !== 'closed') {
          this.pc.close()
        }
      } catch {
        // ignore
      }
    }
    this.pc = null

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop()
      })
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
      console.log('Received remote audio track:', event, 'Streams:', event.streams.length)
      if (event.streams && event.streams.length > 0 && this.audioElement) {
        const stream = event.streams[0]
        console.log('Setting audio srcObject, tracks:', stream.getAudioTracks().length)
        this.audioElement.srcObject = stream
        
        // Listen for when audio is ready
        stream.getAudioTracks().forEach(track => {
          console.log('Audio track:', track.id, 'enabled:', track.enabled, 'readyState:', track.readyState)
          track.onended = () => console.log('Audio track ended')
          track.onmute = () => console.log('Audio track muted')
          track.onunmute = () => console.log('Audio track unmuted')
        })
        
        // Force play and log
        this.audioElement.play()
          .then(() => {
            console.log('Audio element playing successfully')
            console.log('Audio element volume:', this.audioElement?.volume)
            console.log('Audio element muted:', this.audioElement?.muted)
          })
          .catch(err => {
            console.error('Failed to play remote audio:', err)
          })
      } else {
        console.warn('No streams in track event or audio element missing')
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
      console.log('Session instructions length:', this.currentInstructions.length)
      console.log('Session instructions preview:', this.currentInstructions.substring(0, 200))
      this.sessionReady = false
      
      // Update session with instructions
      // IMPORTANT: Disable voice activity detection initially so user can't speak before Alex
      this.sendEvent({
        type: 'session.update',
        session: {
          type: 'realtime',
          instructions: this.currentInstructions,
          audio: {
            voice_activity_detection: {
              enabled: false, // Disabled until Alex speaks first
            },
          },
        },
      })
      console.log('Session update sent with instructions')
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

  private enableUserAudio() {
    if (this.hasAlexSpokenFirst) return // Already enabled

    this.hasAlexSpokenFirst = true
    console.log('Enabling user input (fallback or normal flow)')
    
    // Enable voice activity detection - preserve instructions
    this.sendEvent({
      type: 'session.update',
      session: {
        type: 'realtime',
        instructions: this.currentInstructions, // Preserve instructions
        audio: {
          voice_activity_detection: {
            enabled: true,
          },
        },
      },
    })
    
    // Unmute the microphone
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = true
      })
    }
  }

  private startConversation() {
    if (!this.sessionReady) {
      console.log('Session not ready yet, waiting for session.updated event')
      return
    }
    
    console.log('Starting conversation, sending response.create')
    console.log('Full session instructions length:', this.currentInstructions.length)
    // Create the first response - include full instructions to ensure they're applied
    // Both session-level and response-level instructions help ensure OpenAI gets the prompt
    this.sendEvent({
      type: 'response.create',
      response: {
        instructions: this.currentInstructions, // Use the full detailed instructions
        modalities: ['audio'], // Explicitly request audio output
      },
    })
    console.log('Response.create sent with full instructions')

    // Fallback: If Alex doesn't speak within 10 seconds, enable user input to prevent getting stuck
    setTimeout(() => {
      if (!this.hasAlexSpokenFirst) {
        console.warn('Alex took too long to speak. Enabling user input as fallback.')
        this.enableUserAudio()
      }
    }, 10000)
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
      
      // After Alex finishes speaking for the first time, enable user input
      if (!this.hasAlexSpokenFirst) {
        console.log('Alex has spoken first, now enabling user input')
        this.enableUserAudio()
      }
      
      this.activeResponse = ''
    }

    if (event.type === 'session.updated') {
      console.log('Session updated successfully, starting conversation')
      console.log('Session.updated event:', event)
      this.sessionReady = true
      // Small delay to ensure session is fully ready
      setTimeout(() => {
        this.startConversation()
      }, 100)
    }

    if (event.type === 'response.created') {
      console.log('Response created, waiting for audio...', event)
    }

    if (event.type === 'response.audio_transcript.delta') {
      console.log('Audio transcript delta:', event)
    }

    if (event.type === 'response.audio_transcript.done') {
      console.log('Audio transcript done:', event)
    }

    if (event.type === 'response.output_item.added') {
      console.log('Output item added:', event)
    }

    if (event.type === 'response.output_item.done') {
      console.log('Output item done:', event)
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


