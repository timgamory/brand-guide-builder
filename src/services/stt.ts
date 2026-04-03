export interface STTService {
  start(): void
  stop(): Promise<string>
  onInterim(cb: (text: string) => void): void
  isListening(): boolean
}

/**
 * Browser-native STT service wrapping the Web Speech API.
 * Works well in Chrome; unavailable in Firefox, partial in Safari.
 */
export class BrowserSTTService implements STTService {
  private recognition: Record<string, unknown> | null = null
  private listening = false
  private finalTranscript = ''
  private interimCallback: ((text: string) => void) | null = null
  private silenceTimer: ReturnType<typeof setTimeout> | null = null
  private onSilence: (() => void) | null = null

  static isAvailable(): boolean {
    return (
      typeof (globalThis as Record<string, unknown>).SpeechRecognition !== 'undefined' ||
      typeof (globalThis as Record<string, unknown>).webkitSpeechRecognition !== 'undefined'
    )
  }

  start(): void {
    const SpeechRecognitionCtor =
      ((globalThis as Record<string, unknown>).SpeechRecognition as
        | (new () => Record<string, unknown>)
        | undefined) ??
      ((globalThis as Record<string, unknown>).webkitSpeechRecognition as
        | (new () => Record<string, unknown>)
        | undefined)

    if (!SpeechRecognitionCtor) {
      throw new Error('SpeechRecognition API is not available in this browser')
    }

    this.finalTranscript = ''
    this.recognition = new SpeechRecognitionCtor()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'

    this.recognition.onresult = (event: Record<string, unknown>) => {
      this.handleResult(event)
      if (this.silenceTimer) clearTimeout(this.silenceTimer)
      this.silenceTimer = setTimeout(() => {
        this.onSilence?.()
      }, 3000)
    }

    this.recognition.onerror = () => {
      this.listening = false
    }

    this.recognition.onend = () => {
      this.listening = false
    }

    ;(this.recognition.start as () => void)()
    this.listening = true
  }

  stop(): Promise<string> {
    if (this.silenceTimer) clearTimeout(this.silenceTimer)
    this.silenceTimer = null
    if (this.recognition && this.listening) {
      ;(this.recognition.stop as () => void)()
    }
    this.listening = false
    const transcript = this.finalTranscript
    return Promise.resolve(transcript)
  }

  onInterim(cb: (text: string) => void): void {
    this.interimCallback = cb
  }

  onSilenceDetected(cb: () => void): void {
    this.onSilence = cb
  }

  isListening(): boolean {
    return this.listening
  }

  private handleResult(event: Record<string, unknown>): void {
    const results = event.results as {
      length: number
      [index: number]: {
        isFinal: boolean
        length: number
        [index: number]: { transcript: string }
      }
    }

    let finalText = ''
    let interimText = ''

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.isFinal) {
        finalText += result[0].transcript
      } else {
        interimText += result[0].transcript
      }
    }

    this.finalTranscript = finalText

    if (this.interimCallback) {
      this.interimCallback(finalText + interimText)
    }
  }
}

/**
 * Cloud STT service that records audio via MediaRecorder and sends it
 * to the /api/stt Edge Function (OpenAI Whisper) for transcription.
 * Works in all browsers that support MediaRecorder (Chrome, Firefox, Safari).
 */
export class CloudSTTService implements STTService {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private listening = false
  private interimCallback: ((text: string) => void) | null = null

  start(): void {
    this.chunks = []
    this.listening = true

    // Fire interim callback to show listening state
    if (this.interimCallback) {
      this.interimCallback('(listening...)')
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.stream = stream
      this.mediaRecorder = new MediaRecorder(stream)

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
        }
      }

      this.mediaRecorder.start(250)
    }).catch(() => {
      this.listening = false
    })
  }

  async stop(): Promise<string> {
    this.listening = false

    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return ''
    }

    // Wait for MediaRecorder to finish producing data
    const blob = await new Promise<Blob>(resolve => {
      this.mediaRecorder!.onstop = () => {
        resolve(new Blob(this.chunks, { type: this.mediaRecorder!.mimeType || 'audio/webm' }))
      }
      this.mediaRecorder!.stop()
    })

    // Stop all mic tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (blob.size === 0) {
      return ''
    }

    // Send to cloud STT endpoint
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')

    const response = await fetch('/api/stt', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Cloud STT request failed')
    }

    const result = (await response.json()) as { text: string }
    return result.text
  }

  onInterim(cb: (text: string) => void): void {
    this.interimCallback = cb
  }

  isListening(): boolean {
    return this.listening
  }
}

/**
 * Factory that returns the appropriate STT service based on provider preference.
 * Falls back to CloudSTTService when browser STT is unavailable.
 */
export function createSTTService(provider: 'browser' | 'cloud'): STTService {
  if (provider === 'browser' && BrowserSTTService.isAvailable()) {
    return new BrowserSTTService()
  }
  return new CloudSTTService()
}
