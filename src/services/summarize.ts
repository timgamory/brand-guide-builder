import type { Message } from '../types'
import { sendMessage } from './ai'

const MAX_MESSAGES = 20
const KEEP_RECENT = 10
const RESUMMARIZE_THRESHOLD = 10 // re-summarize when this many new messages since last summary

export function prepareMessagesForApi(
  messages: Message[],
  existingSummary: string | undefined,
): Message[] {
  if (messages.length <= MAX_MESSAGES) return messages

  if (existingSummary) {
    const summaryMessage: Message = {
      role: 'assistant',
      content: `[Summary of our conversation so far: ${existingSummary}]`,
    }
    const recent = messages.slice(-KEEP_RECENT)
    return [summaryMessage, ...recent]
  }

  // Fallback: hard truncation
  return messages.slice(-MAX_MESSAGES)
}

export async function generateSummary(
  messages: Message[],
  existingSummary?: string,
): Promise<string> {
  const toSummarize = messages.slice(0, -KEEP_RECENT)

  // If we have an existing summary, include it as context so the new summary builds on it
  const parts: string[] = []
  if (existingSummary) {
    parts.push(`Previous summary:\n${existingSummary}\n\nNew conversation since then:`)
  }
  parts.push(
    toSummarize
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n')
  )

  const systemPrompt =
    'Summarize this brand interview conversation in 3-5 concise bullet points. Focus on key decisions made, preferences stated, and information gathered. If a previous summary is provided, incorporate it and add new information. Return ONLY the bullet points, no other text.'

  const summary = await sendMessage(
    systemPrompt,
    [{ role: 'user', content: parts.join('\n\n') }],
    () => {},
  )

  return summary
}

export function needsSummarization(
  messageCount: number,
  summarizedAtCount: number | undefined,
): boolean {
  if (messageCount <= MAX_MESSAGES) return false
  // No summary yet — need one
  if (summarizedAtCount === undefined) return true
  // Conversation has grown significantly since last summary
  return messageCount - summarizedAtCount >= RESUMMARIZE_THRESHOLD
}
