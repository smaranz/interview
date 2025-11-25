'use client'

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
  private onAudioData: ((data: Int16Array) => void) | null = null
  private onTextData: ((text: string) => void) | null = null
  private onStatusChange: ((status: 'connected' | 'disconnected' | 'connecting') => void) | null = null
  private audioQueue: Float32Array[] = []
  private isPlaying = false
  private nextPlayTime = 0
  
  // Worklet code as a string to avoid external file dependencies
  private static WORKLET_CODE = `
    class AudioProcessor extends AudioWorkletProcessor {
      process(inputs, outputs, parameters) {
        const input = inputs[0]
        if (input && input.length > 0) {
          const channelData = input[0]
          this.port.postMessage(channelData)
        }
        return true
      }
    }
    registerProcessor('audio-processor', AudioProcessor)
  `

  constructor(apiKey: string, config: LiveConfig = {}) {
    this.apiKey = apiKey
    this.config = {
      model: 'models/gemini-2.0-flash-exp',
      ...config
    }
  }

  setHandlers(
    onStatusChange: (status: 'connected' | 'disconnected' | 'connecting') => void,
    onAudioData?: (data: Int16Array) => void,
    onTextData?: (text: string) => void
  ) {
    this.onStatusChange = onStatusChange
    this.onAudioData = onAudioData || null
    this.onTextData = onTextData || null
  }

  async connect() {
    if (this.ws) {
      this.disconnect()
    }

    this.onStatusChange?.('connecting')

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.isConnected = true
      this.onStatusChange?.('connected')
      this.sendSetupMessage()
      this.startAudioInput()
    }

    this.ws.onmessage = async (event) => {
      try {
        let data
        if (event.data instanceof Blob) {
          data = JSON.parse(await event.data.text())
        } else {
          data = JSON.parse(event.data)
        }
        this.handleServerMessage(data)
      } catch (e) {
        console.error('Error parsing message:', e)
      }
    }

    this.ws.onclose = () => {
      this.cleanup()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.cleanup()
    }
  }

  private sendSetupMessage() {
    if (!this.ws) return

    const setupMessage = {
      setup: {
        model: this.config.model,
        generation_config: {
          response_modalities: ['AUDIO']
        },
        system_instruction: this.config.systemInstruction ? {
          parts: [{ text: this.config.systemInstruction }]
        } : undefined
      }
    }

    this.ws.send(JSON.stringify(setupMessage))
  }

  private async startAudioInput() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000 // Gemini expects 16kHz input usually, but we can resample
      })

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      const blob = new Blob([GeminiLiveClient.WORKLET_CODE], { type: 'application/javascript' })
      const workletUrl = URL.createObjectURL(blob)
      
      await this.audioContext.audioWorklet.addModule(workletUrl)
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor')
      
      this.workletNode.port.onmessage = (event) => {
        this.processAudioInput(event.data)
      }

      source.connect(this.workletNode)
      this.workletNode.connect(this.audioContext.destination) // Needed to keep processor alive in some browsers?
    } catch (error) {
      console.error('Failed to start audio input:', error)
    }
  }

  private processAudioInput(float32Data: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    // Downsample to 16kHz if needed (AudioContext might not be exactly 16kHz)
    // Convert Float32 to Int16 PCM
    const pcm16 = new Int16Array(float32Data.length)
    for (let i = 0; i < float32Data.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Data[i]))
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }

    // Convert to Base64
    const base64Audio = this.arrayBufferToBase64(pcm16.buffer)

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
    // Handle server content (Audio Output)
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
    
    // Handle tool calls or other messages if needed
  }

  private playAudioChunk(pcmData: ArrayBuffer) {
    if (!this.audioContext) return

    // Gemini output is usually 24kHz PCM Int16
    const int16Array = new Int16Array(pcmData)
    const float32Array = new Float32Array(int16Array.length)
    
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0
    }

    // Queue audio for playback
    this.audioQueue.push(float32Array)
    if (!this.isPlaying) {
      this.playQueue()
    }
  }

  private playQueue() {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false
      return
    }

    this.isPlaying = true
    const audioData = this.audioQueue.shift()!
    const buffer = this.audioContext.createBuffer(1, audioData.length, 24000) // Gemini output is 24kHz
    buffer.getChannelData(0).set(audioData)

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(this.audioContext.destination)
    
    const currentTime = this.audioContext.currentTime
    const startTime = Math.max(currentTime, this.nextPlayTime)
    
    source.start(startTime)
    this.nextPlayTime = startTime + buffer.duration
    
    source.onended = () => {
      this.playQueue()
    }
  }

  disconnect() {
    this.isConnected = false
    this.onStatusChange?.('disconnected')
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.cleanup()
  }

  private cleanup() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
    
    if (this.workletNode) {
      this.workletNode.disconnect()
      this.workletNode = null
    }

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

