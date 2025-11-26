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
   */
  async connect(instructions: string) {
    this.currentInstructions = instructions

    if (!instructions.trim()) {
      throw new Error('Interview instructions are required.')
    }

    // Ensure previous resources are released before starting a new session
    this.disconnect(false)
    this.onStatusChange?.('connecting')

    try {
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })

      this.setupPeerConnectionHandlers()
      await this.setupLocalMedia()
      this.setupDataChannel()

      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      const response = await fetch(this.config.sessionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp ?? '',
      })

      if (!response.ok) {
        throw new Error(`Failed to create realtime session (${response.status})`)
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

  private setupPeerConnectionHandlers() {
    if (!this.pc) return

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

    this.pc.oniceconnectionstatechange = () => {
      if (!this.pc) return
      if (this.pc.iceConnectionState === 'failed') {
        this.onError?.(new Error('ICE connection failed'))
      }
    }

    this.pc.ontrack = (event) => {
      if (!this.audioElement) {
        this.audioElement = document.createElement('audio')
        this.audioElement.autoplay = true
        this.audioElement.style.display = 'none'
        document.body.appendChild(this.audioElement)
      }

      if (this.audioElement && event.streams[0]) {
        this.audioElement.srcObject = event.streams[0]
      }
    }
  }

  private async setupLocalMedia() {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    this.mediaStream.getTracks().forEach((track) => {
      this.pc?.addTrack(track, this.mediaStream as MediaStream)
    })
  }

  private setupDataChannel() {
    if (!this.pc) return

    this.dataChannel = this.pc.createDataChannel('oai-events')

    this.dataChannel.onopen = () => {
      this.sendEvent({
        type: 'session.update',
        session: {
          type: 'realtime',
          model: this.config.model,
          instructions: this.currentInstructions,
          audio: {
            output: {
              voice: this.config.voice,
            },
          },
        },
      })

      // Prompt the model to begin the interview immediately
      this.startConversation()
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
    this.sendEvent({
      type: 'response.create',
      response: {
        instructions:
          'Begin the interview by introducing yourself briefly and asking the first question based on the provided job description.',
      },
    })
  }

  private handleServerEvent(event: any) {
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

    if (typeof event.type === 'string' && event.type.endsWith('.error')) {
      const message = event.error?.message || 'Realtime session error'
      this.onError?.(new Error(message))
    }
  }
}


