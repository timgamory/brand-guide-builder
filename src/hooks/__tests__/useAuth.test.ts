import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock supabase before importing hook
const mockOnAuthStateChange = vi.fn()
const mockGetSession = vi.fn()
const mockSignInWithOtp = vi.fn()
const mockSignOut = vi.fn()

vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signInWithOtp: (...args: unknown[]) => mockSignInWithOtp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}))

import { useAuth } from '../useAuth'

describe('useAuth', () => {
  let authCallback: (event: string, session: unknown) => void

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockImplementation((cb: typeof authCallback) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
  })

  it('starts in loading state then resolves to no user', async () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isLoading).toBe(true)

    await act(async () => {})
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('exposes user after sign-in event', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {})

    const fakeUser = { id: 'user-123', email: 'test@example.com' }
    act(() => {
      authCallback('SIGNED_IN', { user: fakeUser })
    })

    expect(result.current.user).toEqual(fakeUser)
    expect(result.current.isLoading).toBe(false)
  })

  it('clears user on sign-out event', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
      error: null,
    })

    const { result } = renderHook(() => useAuth())
    await act(async () => {})

    act(() => {
      authCallback('SIGNED_OUT', null)
    })

    expect(result.current.user).toBeNull()
  })
})
