import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../services/storage', () => ({
  getReflections: vi.fn().mockResolvedValue(undefined),
  saveReflection: vi.fn().mockResolvedValue(undefined),
}))

import { useReflectionStore } from '../reflectionStore'

describe('reflectionStore', () => {
  beforeEach(() => {
    useReflectionStore.setState({ entries: {}, currentSessionId: null })
  })

  it('starts with empty entries', () => {
    expect(useReflectionStore.getState().entries).toEqual({})
  })

  it('getReflection returns empty string for unknown section', () => {
    expect(useReflectionStore.getState().getReflection('story')).toBe('')
  })
})
