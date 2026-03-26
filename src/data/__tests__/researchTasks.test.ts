import { describe, it, expect } from 'vitest'
import { getResearchTasks, RESEARCH_TASKS } from '../researchTasks'

describe('researchTasks', () => {
  it('returns tasks for story section', () => {
    const tasks = getResearchTasks('story')
    expect(tasks.length).toBeGreaterThanOrEqual(2)
    expect(tasks.length).toBeLessThanOrEqual(4)
    tasks.forEach(t => {
      expect(t.id).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(['interview', 'observe', 'reflect', 'research']).toContain(t.type)
    })
  })

  it('returns tasks for values section', () => {
    const tasks = getResearchTasks('values')
    expect(tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('returns tasks for personality section', () => {
    const tasks = getResearchTasks('personality')
    expect(tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('returns empty array for unknown section', () => {
    expect(getResearchTasks('nonexistent')).toEqual([])
  })

  it('early sections have more tasks than later ones', () => {
    const storyTasks = getResearchTasks('story')
    const personalityTasks = getResearchTasks('personality')
    expect(storyTasks.length).toBeGreaterThanOrEqual(personalityTasks.length)
  })
})
