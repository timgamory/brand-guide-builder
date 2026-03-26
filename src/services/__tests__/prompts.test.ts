import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, getOpener } from '../prompts/builder'
import type { Session } from '../../types'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test',
    path: 'entrepreneur',
    brandData: {},
    sections: {
      basics: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
      story: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
      values: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
      personality: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
    },
    currentSection: 'basics',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('buildSystemPrompt', () => {
  it('includes entrepreneur persona for entrepreneur path', () => {
    const prompt = buildSystemPrompt(makeSession(), 'story')
    expect(prompt).toContain('warm, experienced brand consultant')
  })

  it('includes intern persona for intern path', () => {
    const prompt = buildSystemPrompt(makeSession({ path: 'intern' }), 'story')
    expect(prompt).toContain('experienced mentor')
  })

  it('includes context block when sections are approved', () => {
    const prompt = buildSystemPrompt(makeSession({
      brandData: { orgName: 'Test Org', orgType: 'Nonprofit' },
      sections: {
        basics: { status: 'approved', approvedDraft: 'test', reviewFeedback: null },
        story: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
        values: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
        personality: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
      },
    }), 'story')
    expect(prompt).toContain('Test Org')
    expect(prompt).toContain('Nonprofit')
  })

  it('includes section goal', () => {
    const prompt = buildSystemPrompt(makeSession(), 'story')
    expect(prompt).toContain('origin story')
  })
})

describe('getOpener', () => {
  it('returns section-specific opener for entrepreneur', () => {
    const opener = getOpener(makeSession(), 'story')
    expect(opener).toContain('heart of things')
  })

  it('returns section-specific opener for intern', () => {
    const opener = getOpener(makeSession({ path: 'intern' }), 'story')
    expect(opener).toContain('research')
  })

  it('returns fallback for unknown section', () => {
    const opener = getOpener(makeSession(), 'unknown_section')
    expect(opener).toContain('Tell me what you know')
  })
})
