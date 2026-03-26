import { describe, it, expect } from 'vitest'
import { SECTIONS, getSection, getSectionIndex, ALL_SECTION_IDS } from '../sections'

describe('sections', () => {
  it('has 11 sections', () => {
    expect(SECTIONS).toHaveLength(11)
  })

  it('each section has required fields', () => {
    for (const section of SECTIONS) {
      expect(section.id).toBeTruthy()
      expect(section.title).toBeTruthy()
      expect(section.subtitle).toBeTruthy()
      expect(typeof section.optional).toBe('boolean')
      expect(Array.isArray(section.fields)).toBe(true)
    }
  })

  it('only social_media and photography are optional', () => {
    const optional = SECTIONS.filter(s => s.optional)
    expect(optional.map(s => s.id)).toEqual(['social_media', 'photography'])
  })

  it('all field keys are unique across sections', () => {
    const allKeys = SECTIONS.flatMap(s => s.fields.map(f => f.key))
    const uniqueKeys = new Set(allKeys)
    expect(allKeys.length).toBe(uniqueKeys.size)
  })

  it('getSection returns correct section', () => {
    expect(getSection('story')?.title).toBe('Your Story')
    expect(getSection('nonexistent')).toBeUndefined()
  })

  it('getSectionIndex returns correct index', () => {
    expect(getSectionIndex('basics')).toBe(0)
    expect(getSectionIndex('story')).toBe(1)
    expect(getSectionIndex('nonexistent')).toBe(-1)
  })

  it('ALL_SECTION_IDS matches section order', () => {
    expect(ALL_SECTION_IDS).toEqual(SECTIONS.map(s => s.id))
  })
})
