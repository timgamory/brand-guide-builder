import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../services/analytics', () => ({
  track: vi.fn(),
}))

// Mock storage before importing store
vi.mock('../../services/storage', () => {
  let sessions: Record<string, unknown> = {}
  return {
    createSession: vi.fn(async (path: string) => {
      const session = {
        id: crypto.randomUUID(),
        path,
        brandData: {},
        sections: {
          basics: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
          story: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
        },
        currentSection: 'basics',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      sessions[session.id] = session
      return session
    }),
    getSession: vi.fn(async (id: string) => sessions[id]),
    updateSession: vi.fn(async (id: string, updates: Record<string, unknown>) => {
      const existing = sessions[id] as Record<string, unknown>
      if (existing) sessions[id] = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    }),
    listSessions: vi.fn(async () => Object.values(sessions)),
    deleteSession: vi.fn(async (id: string) => { delete sessions[id] }),
    _reset: () => { sessions = {} },
  }
})

vi.mock('../../services/documentGenerator', () => ({
  generateMarkdown: vi.fn((session: { brandData: { orgName?: string } }) => {
    return `# ${session.brandData.orgName || 'Brand'} Guide`
  }),
}))

import { useBrandGuideStore } from '../brandGuideStore'
import * as storage from '../../services/storage'

describe('brandGuideStore', () => {
  beforeEach(() => {
    (storage as unknown as { _reset: () => void })._reset()
    useBrandGuideStore.getState().reset()
  })

  it('starts with no session', () => {
    const state = useBrandGuideStore.getState()
    expect(state.session).toBeNull()
    expect(state.isLoading).toBe(false)
  })

  it('creates a new session', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    const state = useBrandGuideStore.getState()
    expect(state.session).not.toBeNull()
    expect(state.session!.path).toBe('entrepreneur')
  })

  it('updates brand data', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().updateBrandData({ orgName: 'Test Org' })
    const state = useBrandGuideStore.getState()
    expect(state.session!.brandData.orgName).toBe('Test Org')
  })

  it('navigates to a section', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().navigateToSection('story')
    const state = useBrandGuideStore.getState()
    expect(state.session!.currentSection).toBe('story')
  })

  it('approves a section draft', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().approveSectionDraft('story', 'Polished story draft...')
    const state = useBrandGuideStore.getState()
    expect(state.session!.sections['story'].status).toBe('approved')
    expect(state.session!.sections['story'].approvedDraft).toBe('Polished story draft...')
  })

  it('regenerates document when approving a draft', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().updateBrandData({ orgName: 'Acme' })
    await useBrandGuideStore.getState().approveSectionDraft('basics', 'Acme is great.')
    const state = useBrandGuideStore.getState()
    expect(state.session!.generatedDocument).toBe('# Acme Guide')
  })

  it('regenerates document when skipping a section', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().updateBrandData({ orgName: 'Acme' })
    await useBrandGuideStore.getState().skipSection('basics')
    const state = useBrandGuideStore.getState()
    expect(state.session!.generatedDocument).toBe('# Acme Guide')
  })
})
