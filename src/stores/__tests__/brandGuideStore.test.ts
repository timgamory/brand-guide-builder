import { describe, it, expect, beforeEach } from 'vitest'
import { useBrandGuideStore } from '../brandGuideStore'
import { db } from '../../services/storage'

describe('brandGuideStore', () => {
  beforeEach(async () => {
    await db.sessions.clear()
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
})
