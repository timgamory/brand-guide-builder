import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock supabase before importing analytics
const mockFrom = vi.fn()
vi.mock('../supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}))

// Mock brandGuideStore
vi.mock('../../stores/brandGuideStore', () => ({
  useBrandGuideStore: { getState: () => ({ session: { id: 'store-session-id' } }) },
}))

import { track } from '../analytics'

function mockInsert(error: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain.insert = () => Promise.resolve({ error })
  return chain
}

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts an event with explicit sessionId', () => {
    mockFrom.mockReturnValue(mockInsert())
    track('session.created', { path: 'entrepreneur' }, 'explicit-id')
    expect(mockFrom).toHaveBeenCalledWith('analytics_events')
  })

  it('falls back to store sessionId when not provided', () => {
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }))
    mockFrom.mockReturnValue({ insert: insertSpy })
    track('section.started', { sectionId: 'basics' })
    expect(mockFrom).toHaveBeenCalledWith('analytics_events')
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: 'store-session-id' }),
    )
  })

  it('does not throw when insert fails', () => {
    mockFrom.mockReturnValue(mockInsert({ message: 'db error' }))
    expect(() => track('session.created', { path: 'entrepreneur' })).not.toThrow()
  })

  it('does not throw when supabase call throws synchronously', () => {
    mockFrom.mockImplementation(() => { throw new Error('connection failed') })
    expect(() => track('session.created', { path: 'entrepreneur' })).not.toThrow()
  })

  it('does not throw when insert returns a rejected promise', async () => {
    const chain = { insert: () => Promise.reject(new Error('network error')) }
    mockFrom.mockReturnValue(chain)
    expect(() => track('session.created', {})).not.toThrow()
    await Promise.resolve()
  })
})
