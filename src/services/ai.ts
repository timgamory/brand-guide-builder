import Anthropic from '@anthropic-ai/sdk'
import type { Message } from '../types'

let client: Anthropic | null = null

function getLocalApiKey(): string | null {
  return localStorage.getItem('anthropic-api-key')
}

function getClient(): Anthropic {
  if (client) return client
  const apiKey = getLocalApiKey()
  if (!apiKey) throw new Error('No local API key')
  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  return client
}

export function resetClient() {
  client = null
}

function hasLocalKey(): boolean {
  return !!getLocalApiKey()
}

async function sendViaProxy(
  systemPrompt: string,
  messages: Message[],
  onChunk: (text: string) => void,
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const event = JSON.parse(data)
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          fullText += event.delta.text
          onChunk(fullText)
        }
      } catch { /* skip unparseable lines */ }
    }
  }

  return fullText
}

async function sendViaSdk(
  systemPrompt: string,
  messages: Message[],
  onChunk: (text: string) => void,
): Promise<string> {
  const anthropic = getClient()

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
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

export async function sendMessage(
  systemPrompt: string,
  messages: Message[],
  onChunk: (text: string) => void,
): Promise<string> {
  if (hasLocalKey()) {
    return sendViaSdk(systemPrompt, messages, onChunk)
  }
  return sendViaProxy(systemPrompt, messages, onChunk)
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
