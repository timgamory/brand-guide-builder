import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TTSService } from '../tts'

// Mock HTMLAudioElement
const mockPlay = vi.fn(() => Promise.resolve())
const mockPause = vi.fn()
let mockAudio: { play: typeof mockPlay; pause: typeof mockPause; src: string; onended: (() => void) | null; onerror: ((e: unknown) => void) | null }

// Use function keyword so vi.fn() treats it as a constructor
vi.stubGlobal('Audio', vi.fn(function (this: typeof mockAudio) {
  this.play = mockPlay
  this.pause = mockPause
  this.src = ''
  this.onended = null
  this.onerror = null
  mockAudio = this
}))

vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
})

describe('TTSService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    mockAudio = undefined as unknown as typeof mockAudio
  })

  it('speak() calls /api/tts and plays audio', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
    vi.mocked(fetch).mockResolvedValueOnce(new Response(mockBlob, { status: 200 }))

    const tts = new TTSService()
    const speakPromise = tts.speak('Hello world')

    await vi.waitFor(() => expect(mockAudio.onended).toBeTruthy())
    mockAudio.onended!()

    await speakPromise
    expect(fetch).toHaveBeenCalledWith('/api/tts', expect.objectContaining({ method: 'POST' }))
    expect(mockPlay).toHaveBeenCalled()
  })

  it('stop() pauses audio and resolves pending speak()', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
    vi.mocked(fetch).mockResolvedValueOnce(new Response(mockBlob, { status: 200 }))

    const tts = new TTSService()
    const speakPromise = tts.speak('Hello')

    // Wait for the Audio element to be created and event handlers assigned (after fetch resolves)
    await vi.waitFor(() => expect(mockAudio?.onended).toBeTruthy())

    tts.stop()
    expect(mockPause).toHaveBeenCalled()
    await speakPromise
  })

  it('isPlaying() returns false initially', () => {
    const tts = new TTSService()
    expect(tts.isPlaying()).toBe(false)
  })
})
