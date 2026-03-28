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
