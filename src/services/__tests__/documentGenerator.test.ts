import { describe, it, expect } from 'vitest'
import { generateMarkdown } from '../documentGenerator'
import type { Session } from '../../types'

function makeSession(): Session {
  return {
    id: 'test',
    path: 'entrepreneur',
    brandData: { orgName: 'Test Org', orgType: 'Nonprofit', industry: 'Education' },
    sections: {
      basics: { status: 'approved', approvedDraft: 'Test Org is a nonprofit in the education space.', reviewFeedback: null },
      story: { status: 'approved', approvedDraft: 'Founded to help students succeed.', reviewFeedback: null },
      values: { status: 'approved', approvedDraft: '**Community First**: We always put community needs first.', reviewFeedback: null },
      personality: { status: 'approved', approvedDraft: 'Warm, trustworthy, and bold.', reviewFeedback: null },
    },
    currentSection: 'personality',
    createdAt: '',
    updatedAt: '',
  }
}

describe('generateMarkdown', () => {
  it('includes org name in title', () => {
    const md = generateMarkdown(makeSession())
    expect(md).toContain('# Test Org')
  })

  it('includes all approved section drafts', () => {
    const md = generateMarkdown(makeSession())
    expect(md).toContain('Test Org is a nonprofit')
    expect(md).toContain('Founded to help students succeed')
    expect(md).toContain('Community First')
    expect(md).toContain('Warm, trustworthy, and bold')
  })

  it('skips sections without approved drafts', () => {
    const session = makeSession()
    session.sections.story = { status: 'not_started', approvedDraft: null, reviewFeedback: null }
    const md = generateMarkdown(session)
    expect(md).not.toContain('Founded to help students')
  })

  it('uses section titles from mapping', () => {
    const md = generateMarkdown(makeSession())
    expect(md).toContain('## Introduction')
    expect(md).toContain('## Brand Story')
    expect(md).toContain('## Brand Values')
    expect(md).toContain('## Brand Personality')
  })
})
