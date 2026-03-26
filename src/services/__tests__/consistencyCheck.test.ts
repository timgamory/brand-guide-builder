import { describe, it, expect } from 'vitest'
import { parseConsistencyResult } from '../consistencyCheck'

describe('parseConsistencyResult', () => {
  it('parses consistent result', () => {
    const json = '{"issues": [], "verdict": "consistent"}'
    const result = parseConsistencyResult(json)
    expect(result).toEqual({ issues: [], verdict: 'consistent' })
  })

  it('parses result with issues', () => {
    const json = '{"issues": [{"sections": ["story", "values"], "description": "Tone shifts from casual to formal"}], "verdict": "minor_issues"}'
    const result = parseConsistencyResult(json)
    expect(result!.issues).toHaveLength(1)
    expect(result!.verdict).toBe('minor_issues')
  })

  it('returns null for invalid JSON', () => {
    expect(parseConsistencyResult('not json')).toBeNull()
  })

  it('extracts JSON from surrounding text', () => {
    const text = 'Here is my analysis:\n{"issues": [], "verdict": "consistent"}\nDone.'
    const result = parseConsistencyResult(text)
    expect(result).toEqual({ issues: [], verdict: 'consistent' })
  })
})
