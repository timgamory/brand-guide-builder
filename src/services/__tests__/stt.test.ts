import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserSTTService } from '../stt'

// Mock SpeechRecognition
interface MockRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: unknown) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
}

let mockRecognition: MockRecognition

const mockStart = vi.fn()
const mockStop = vi.fn()

vi.stubGlobal(
  'webkitSpeechRecognition',
  vi.fn(function (this: MockRecognition) {
    this.continuous = false
    this.interimResults = false
    this.lang = ''
    this.onresult = null
    this.onerror = null
    this.onend = null
    this.start = mockStart
    this.stop = mockStop
    this.abort = vi.fn()
    mockRecognition = this
  }),
)

describe('BrowserSTTService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isAvailable()', () => {
    it('returns true when SpeechRecognition exists', () => {
      expect(BrowserSTTService.isAvailable()).toBe(true)
    })

    it('returns false when SpeechRecognition does not exist', () => {
      const g = globalThis as Record<string, unknown>
      const original = g.webkitSpeechRecognition
      const originalStandard = g.SpeechRecognition

      delete g.webkitSpeechRecognition
      delete g.SpeechRecognition

      expect(BrowserSTTService.isAvailable()).toBe(false)

      // Restore
      g.webkitSpeechRecognition = original
      if (originalStandard) {
        g.SpeechRecognition = originalStandard
      }
    })
  })

  describe('start()', () => {
    it('begins recognition with continuous and interimResults', () => {
      const stt = new BrowserSTTService()
      stt.start()

      expect(mockRecognition.start).toHaveBeenCalled()
      expect(mockRecognition.continuous).toBe(true)
      expect(mockRecognition.interimResults).toBe(true)
    })

    it('sets isListening to true', () => {
      const stt = new BrowserSTTService()
      expect(stt.isListening()).toBe(false)

      stt.start()
      expect(stt.isListening()).toBe(true)
    })
  })

  describe('stop()', () => {
    it('resolves with final transcript', async () => {
      const stt = new BrowserSTTService()
      stt.start()

      // Simulate a final result
      mockRecognition.onresult!({
        resultIndex: 0,
        results: {
          length: 1,
          0: {
            isFinal: true,
            length: 1,
            0: { transcript: 'hello world' },
          },
        },
      })

      const transcript = await stt.stop()
      expect(transcript).toBe('hello world')
      expect(mockRecognition.stop).toHaveBeenCalled()
      expect(stt.isListening()).toBe(false)
    })

    it('resolves with empty string when no speech captured', async () => {
      const stt = new BrowserSTTService()
      stt.start()

      const transcript = await stt.stop()
      expect(transcript).toBe('')
    })

    it('accumulates multiple final results', async () => {
      const stt = new BrowserSTTService()
      stt.start()

      // First final result
      mockRecognition.onresult!({
        resultIndex: 0,
        results: {
          length: 1,
          0: {
            isFinal: true,
            length: 1,
            0: { transcript: 'hello' },
          },
        },
      })

      // Second final result
      mockRecognition.onresult!({
        resultIndex: 1,
        results: {
          length: 2,
          0: {
            isFinal: true,
            length: 1,
            0: { transcript: 'hello' },
          },
          1: {
            isFinal: true,
            length: 1,
            0: { transcript: ' world' },
          },
        },
      })

      const transcript = await stt.stop()
      expect(transcript).toBe('hello world')
    })
  })

  describe('onInterim()', () => {
    it('fires callback with partial results', () => {
      const stt = new BrowserSTTService()
      const interimCb = vi.fn()
      stt.onInterim(interimCb)
      stt.start()

      // Simulate an interim result
      mockRecognition.onresult!({
        resultIndex: 0,
        results: {
          length: 1,
          0: {
            isFinal: false,
            length: 1,
            0: { transcript: 'hel' },
          },
        },
      })

      expect(interimCb).toHaveBeenCalledWith('hel')
    })

    it('combines final and interim text in callback', () => {
      const stt = new BrowserSTTService()
      const interimCb = vi.fn()
      stt.onInterim(interimCb)
      stt.start()

      // First a final result, then an interim result in the same event
      mockRecognition.onresult!({
        resultIndex: 0,
        results: {
          length: 2,
          0: {
            isFinal: true,
            length: 1,
            0: { transcript: 'hello ' },
          },
          1: {
            isFinal: false,
            length: 1,
            0: { transcript: 'wor' },
          },
        },
      })

      expect(interimCb).toHaveBeenCalledWith('hello wor')
    })
  })

  describe('error handling', () => {
    it('stops listening on error and resolves stop() with captured transcript', async () => {
      const stt = new BrowserSTTService()
      stt.start()

      // Capture some speech first
      mockRecognition.onresult!({
        resultIndex: 0,
        results: {
          length: 1,
          0: {
            isFinal: true,
            length: 1,
            0: { transcript: 'partial' },
          },
        },
      })

      // Then an error occurs
      mockRecognition.onerror!({ error: 'network' })

      expect(stt.isListening()).toBe(false)

      const transcript = await stt.stop()
      expect(transcript).toBe('partial')
    })

    it('resolves with empty string on error with no transcript', async () => {
      const stt = new BrowserSTTService()
      stt.start()

      mockRecognition.onerror!({ error: 'no-speech' })

      const transcript = await stt.stop()
      expect(transcript).toBe('')
    })
  })
})
