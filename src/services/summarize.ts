import type { Message } from '../types'
import { sendMessage } from './ai'

const MAX_MESSAGES = 20
const KEEP_RECENT = 10

export function prepareMessagesForApi(messages: Message[], existingSummary: string | undefined): Message[] {
  if (messages.length <= MAX_MESSAGES) return messages

  if (existingSummary) {
    const summaryMessage: Message = {
      role: 'assistant',
      content: `[Summary of our conversation so far: ${existingSummary}]`,
    }
    const recent = messages.slice(-KEEP_RECENT)
    return [summaryMessage, ...recent]
  }

  return messages.slice(-MAX_MESSAGES)
}

export async function generateSummary(messages: Message[]): Promise<string> {
  const toSummarize = messages.slice(0, -KEEP_RECENT)
  const conversationText = toSummarize
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n')

  const systemPrompt = 'Summarize this brand interview conversation in 3-5 concise bullet points. Focus on key decisions made, preferences stated, and information gathered. Return ONLY the bullet points, no other text.'

  const summary = await sendMessage(
    systemPrompt,
    [{ role: 'user', content: conversationText }],
    () => {},
  )

  return summary
}

export function needsSummarization(messages: Message[], existingSummary: string | undefined): boolean {
  return messages.length > MAX_MESSAGES && !existingSummary
}
