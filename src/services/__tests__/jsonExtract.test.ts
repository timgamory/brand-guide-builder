import { describe, it, expect } from 'vitest'
import { extractJsonObject } from '../jsonExtract'

describe('extractJsonObject', () => {
  it('extracts a simple JSON object', () => {
    const result = extractJsonObject('{"key": "value"}')
    expect(result).toBe('{"key": "value"}')
  })

  it('extracts JSON from surrounding text', () => {
    const result = extractJsonObject('Here is the result: {"draft": "hello"} and more text')
    expect(result).toBe('{"draft": "hello"}')
  })

  it('handles nested objects', () => {
    const result = extractJsonObject('{"a": {"b": "c"}, "d": "e"}')
    expect(result).toBe('{"a": {"b": "c"}, "d": "e"}')
  })

  it('stops at first complete object, not greedy', () => {
    const result = extractJsonObject('{"first": "obj"} some text {"second": "obj"}')
    expect(result).toBe('{"first": "obj"}')
  })

  it('handles strings with braces inside', () => {
    const result = extractJsonObject('{"draft": "Use { and } in your text"}')
    expect(result).toBe('{"draft": "Use { and } in your text"}')
  })

  it('handles escaped quotes in strings', () => {
    const result = extractJsonObject('{"draft": "She said \\"hello\\""}')
    expect(result).toBe('{"draft": "She said \\"hello\\""}')
  })

  it('returns null when no JSON found', () => {
    expect(extractJsonObject('no json here')).toBeNull()
  })

  it('returns null for unbalanced braces', () => {
    expect(extractJsonObject('{"open": "forever')).toBeNull()
  })
})
