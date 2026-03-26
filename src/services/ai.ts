import Anthropic from '@anthropic-ai/sdk'
import type { Message } from '../types'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (client) return client
  const apiKey = localStorage.getItem('anthropic-api-key')
  if (!apiKey) throw new Error('No API key configured')
  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  return client
}

export function resetClient() {
  client = null
}

export async function sendMessage(
  systemPrompt: string,
  messages: Message[],
  onChunk: (text: string) => void,
): Promise<string> {
  const anthropic = getClient()

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6-20250627',
    max_tokens: 2000,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  let fullText = ''

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text
      onChunk(fullText)
    }
  }

  return fullText
}

export function parseSectionReview(text: string): {
  draft: string
  suggestions: string[]
  alternatives: { option: string; rationale: string }[]
  teachingMoment: string
} | null {
  try {
    const parsed = JSON.parse(text)
    if (parsed.draft) return parsed
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.draft) return parsed
      } catch { /* fall through */ }
    }
  }
  return null
}
