import { describe, it, expect } from 'vitest'
import { prepareMessagesForApi, needsSummarization } from '../summarize'
import type { Message } from '../../types'

function makeMessages(count: number): Message[] {
  return Array.from({ length: count }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: `Message ${i + 1}`,
  }))
}

describe('prepareMessagesForApi', () => {
  it('returns all messages when count <= 20', () => {
    const msgs = makeMessages(15)
    const result = prepareMessagesForApi(msgs, undefined)
    expect(result).toEqual(msgs)
  })

  it('prepends summary and keeps recent 10 when count > 20 and summary exists', () => {
    const msgs = makeMessages(25)
    const result = prepareMessagesForApi(msgs, 'This is a summary')
    expect(result.length).toBe(11)
    expect(result[0].role).toBe('assistant')
    expect(result[0].content).toContain('summary')
    expect(result[result.length - 1].content).toBe('Message 25')
  })

  it('truncates to most recent 20 when count > 20 and no summary', () => {
    const msgs = makeMessages(25)
    const result = prepareMessagesForApi(msgs, undefined)
    expect(result.length).toBe(20)
    expect(result[0].content).toBe('Message 6')
    expect(result[result.length - 1].content).toBe('Message 25')
  })
})

describe('needsSummarization', () => {
  it('returns false when messages <= 20', () => {
    expect(needsSummarization(15, undefined)).toBe(false)
  })

  it('returns true when messages > 20 and no prior summary', () => {
    expect(needsSummarization(25, undefined)).toBe(true)
  })

  it('returns false when messages > 20 but recently summarized', () => {
    expect(needsSummarization(25, 22)).toBe(false)
  })

  it('returns true when conversation has grown 10+ messages since last summary', () => {
    expect(needsSummarization(35, 22)).toBe(true)
  })

  it('returns false when conversation grew but not enough', () => {
    expect(needsSummarization(30, 22)).toBe(false)
  })
})
