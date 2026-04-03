export class TTSService {
  private audio: HTMLAudioElement | null = null
  private playing = false
  private resolveSpeak: (() => void) | null = null

  async speak(text: string): Promise<void> {
    this.stop()

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.status}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    return new Promise<void>((resolve, reject) => {
      this.resolveSpeak = resolve
      this.audio = new Audio()
      this.audio.src = url
      this.playing = true

      this.audio.onended = () => {
        this.playing = false
        URL.revokeObjectURL(url)
        resolve()
      }

      this.audio.onerror = (e) => {
        this.playing = false
        URL.revokeObjectURL(url)
        reject(e)
      }

      this.audio.play().catch(reject)
    })
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio = null
      this.playing = false
      this.resolveSpeak?.()
      this.resolveSpeak = null
    }
  }

  isPlaying(): boolean {
    return this.playing
  }
}
