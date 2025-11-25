'use client'

/**
 * Types for Gemini Live API
 */
export interface LiveConfig {
  model?: string
  systemInstruction?: string
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null
  private apiKey: string
  private config: LiveConfig
  private audioContext: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private mediaStream: MediaStream | null = null
  private isConnected = false
  private audioQueue: Float32Array[] = []
  private isPlaying = false
  private nextPlayTime = 0

  // Event callbacks
  public onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void
  public onAudioData?: (data: Int16Array) => void
  public onTextData?: (text: string) => void
  public onError?: (error: Error) => void

  // Simple AudioWorklet for recording
  private static WORKLET_CODE = `
    class RecorderProcessor extends AudioWorkletProcessor {
      process(inputs, outputs, parameters) {
        const input = inputs[0]
        if (input && input.length > 0) {
          this.port.postMessage(input[0])
        }
        return true
      }
    }
    registerProcessor('recorder-processor', RecorderProcessor)
  `

  constructor(apiKey: string, config: LiveConfig = {}) {
    this.apiKey = apiKey
    this.config = {
      model: 'models/gemini-2.0-flash-exp',
      ...config
    }
  }

  async connect() {
    if (!this.apiKey) {
      this.onError?.(new Error('API key is missing'))
      return
    }

    this.disconnect()
    this.onStatusChange?.('connecting')

    try {
      // Standard WebSocket URL for Gemini Live
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`
      
      this.ws = new WebSocket(url)
      
      this.ws.onopen = async () => {
        console.log('Connected to Gemini Live API')
        this.isConnected = true
        this.onStatusChange?.('connected')
        
        // 1. Send Setup Message immediately
        this.sendSetupMessage()
        
        // 2. Start Audio Input
        await this.startAudioInput()
      }

      this.ws.onmessage = async (event) => {
        try {
          let data
          if (event.data instanceof Blob) {
            const text = await event.data.text()
            data = JSON.parse(text)
          } else {
            data = JSON.parse(event.data)
          }
          this.handleServerMessage(data)
        } catch (err) {
          console.error('Failed to parse message:', err)
        }
      }

      this.ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        this.onError?.(new Error('WebSocket connection failed'))
        this.disconnect()
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        this.disconnect()
      }

    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error('Failed to connect'))
      this.disconnect()
    }
  }

  private sendSetupMessage() {
    if (!this.ws) return

    const setupMessage = {
      setup: {
        model: this.config.model,
        generation_config: {
          response_modalities: ["AUDIO"]
        },
        system_instruction: this.config.systemInstruction ? {
          parts: [{ text: this.config.systemInstruction }]
        } : undefined
      }
    }

    console.log('Sending setup:', setupMessage)
    this.ws.send(JSON.stringify(setupMessage))
  }

  private async startAudioInput() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      })

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // Load worklet
      const blob = new Blob([GeminiLiveClient.WORKLET_CODE], { type: 'application/javascript' })
      const workletUrl = URL.createObjectURL(blob)
      await this.audioContext.audioWorklet.addModule(workletUrl)

      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.workletNode = new AudioWorkletNode(this.audioContext, 'recorder-processor')
      
      this.workletNode.port.onmessage = (event) => {
        this.processAudioInput(event.data)
      }

      source.connect(this.workletNode)
      
    } catch (err) {
      console.error('Audio input failed:', err)
      this.onError?.(new Error('Failed to start microphone'))
    }
  }

  private processAudioInput(float32Data: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    // Convert Float32 to Int16 PCM
    const pcm16 = new Int16Array(float32Data.length)
    for (let i = 0; i < float32Data.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Data[i]))
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }

    // Base64 encode
    const base64Audio = this.arrayBufferToBase64(pcm16.buffer)

    // Send RealtimeInput
    const message = {
      realtime_input: {
        media_chunks: [{
          mime_type: "audio/pcm",
          data: base64Audio
        }]
      }
    }

    this.ws.send(JSON.stringify(message))
  }

  private handleServerMessage(data: any) {
    // console.log('Server message:', data)

    // Handle Audio Output
    if (data.serverContent?.modelTurn?.parts) {
      for (const part of data.serverContent.modelTurn.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
          const pcmData = this.base64ToArrayBuffer(part.inlineData.data)
          this.playAudioChunk(pcmData)
        }
        if (part.text) {
          this.onTextData?.(part.text)
        }
      }
    }
    
    if (data.serverContent?.turnComplete) {
      // Turn complete
    }
  }

  private playAudioChunk(pcmData: ArrayBuffer) {
    if (!this.audioContext) return

    // Gemini 2.0 Flash Exp output is 24kHz
    const sampleRate = 24000
    const int16Array = new Int16Array(pcmData)
    const float32Array = new Float32Array(int16Array.length)
    
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0
    }

    this.audioQueue.push(float32Array)
    if (!this.isPlaying) {
      this.scheduleNextPlay()
    }
  }

  private scheduleNextPlay() {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false
      return
    }

    this.isPlaying = true
    const audioData = this.audioQueue.shift()!
    const buffer = this.audioContext.createBuffer(1, audioData.length, 24000)
    buffer.getChannelData(0).set(audioData)

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(this.audioContext.destination)
    
    const currentTime = this.audioContext.currentTime
    // Schedule slightly in future to avoid glitches if we fell behind
    const startTime = Math.max(currentTime, this.nextPlayTime)
    
    source.start(startTime)
    this.nextPlayTime = startTime + buffer.duration
    
    source.onended = () => {
      this.scheduleNextPlay()
    }
  }

  disconnect() {
    this.isConnected = false
    this.onStatusChange?.('disconnected')
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
    
    if (this.workletNode) {
      this.workletNode.disconnect()
      this.workletNode = null
    }

    // Don't close AudioContext, just suspend/disconnect nodes to allow reuse?
    // Actually better to close to release mic lock
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.audioQueue = []
    this.isPlaying = false
    this.nextPlayTime = 0
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }
}
