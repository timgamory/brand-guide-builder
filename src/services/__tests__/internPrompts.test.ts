import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../prompts/builder'
import type { Session, ResearchTask } from '../../types'

function makeSession(path: 'entrepreneur' | 'intern'): Session {
  return {
    id: 'test', path, brandData: {}, currentSection: 'story',
    sections: { story: { status: 'in_progress', approvedDraft: null, reviewFeedback: null } },
    createdAt: '', updatedAt: '',
    internMeta: path === 'intern' ? { internName: 'Jordan', fellowName: 'Maria', startDate: '' } : undefined,
  }
}

describe('intern prompt builder', () => {
  it('includes research block for intern path', () => {
    const tasks: ResearchTask[] = [
      { id: 't1', description: 'Ask why they started', type: 'interview', completed: true, notes: 'She said community was the driver' },
      { id: 't2', description: 'Look at website', type: 'observe', completed: false, notes: '' },
    ]
    const prompt = buildSystemPrompt(makeSession('intern'), 'story', tasks)
    expect(prompt).toContain('Research')
    expect(prompt).toContain('community was the driver')
    expect(prompt).toContain('Not completed')
  })

  it('does not include research block for entrepreneur path', () => {
    const prompt = buildSystemPrompt(makeSession('entrepreneur'), 'story')
    expect(prompt).not.toContain('Research Notes')
  })

  it('includes fellow name in intern prompt', () => {
    const prompt = buildSystemPrompt(makeSession('intern'), 'story', [])
    expect(prompt).toContain('Maria')
  })
})
