import { describe, it, expect } from 'vitest'
import { generateReflectionMarkdown } from '../documentGenerator'
import type { Session, ReflectionEntry } from '../../types'

describe('generateReflectionMarkdown', () => {
  it('generates markdown from reflection entries', () => {
    const session: Session = {
      id: 'test', path: 'intern', brandData: { orgName: 'TestOrg' },
      sections: {}, currentSection: 'basics',
      internMeta: { internName: 'Jordan', fellowName: 'Maria', startDate: '2026-03-01' },
      createdAt: '', updatedAt: '',
    }
    const entries: ReflectionEntry[] = [
      { sectionId: 'story', text: 'I learned about origin stories.', timestamp: '2026-03-15' },
      { sectionId: 'values', text: 'Values guide decisions.', timestamp: '2026-03-16' },
    ]
    const md = generateReflectionMarkdown(session, entries)
    expect(md).toContain('Jordan')
    expect(md).toContain('Maria')
    expect(md).toContain('Your Story')
    expect(md).toContain('I learned about origin stories.')
    expect(md).toContain('What You Stand For')
    expect(md).toContain('Values guide decisions.')
  })
})
