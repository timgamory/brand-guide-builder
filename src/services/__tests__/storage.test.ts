import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock supabase before importing storage
const mockFrom = vi.fn()
vi.mock('../supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}))

import { createSession, getSession } from '../storage'

// Helper to build chainable mock query
function mockQuery(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const handler = () => chain
  chain.select = handler
  chain.insert = handler
  chain.update = handler
  chain.upsert = handler
  chain.delete = handler
  chain.eq = handler
  chain.in = handler
  chain.like = handler
  chain.order = handler
  chain.single = () => Promise.resolve({ data, error })
  chain.then = (resolve: (v: unknown) => void) => resolve({ data, error })
  return chain
}

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a session with correct defaults', async () => {
    mockFrom.mockReturnValue(mockQuery(null, null))
    const session = await createSession('entrepreneur')
    expect(session.id).toBeTruthy()
    expect(session.path).toBe('entrepreneur')
    expect(session.brandData).toEqual({})
    expect(session.currentSection).toBe('basics')
    expect(session.sections).toBeDefined()
    expect(session.sections['basics'].status).toBe('not_started')
    expect(mockFrom).toHaveBeenCalledWith('sessions')
  })

  it('retrieves a session by id', async () => {
    const fakeRow = {
      id: 'test-id',
      path: 'entrepreneur',
      brand_data: {},
      sections: { basics: { status: 'not_started', approvedDraft: null, reviewFeedback: null } },
      current_section: 'basics',
      intern_meta: null,
      review_token: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    }
    mockFrom.mockReturnValue(mockQuery(fakeRow))
    const session = await getSession('test-id')
    expect(session?.id).toBe('test-id')
    expect(session?.path).toBe('entrepreneur')
  })

  it('returns undefined for missing session', async () => {
    mockFrom.mockReturnValue(mockQuery(null, { code: 'PGRST116' }))
    const session = await getSession('nonexistent')
    expect(session).toBeUndefined()
  })
})
