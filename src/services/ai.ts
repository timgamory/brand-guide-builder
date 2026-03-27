import Anthropic from '@anthropic-ai/sdk'
import type { Message } from '../types'
import { extractJsonObject } from './jsonExtract'
import { useBrandGuideStore } from '../stores/brandGuideStore'

let client: Anthropic | null = null

const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000

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

function isRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    // Retry on network errors and rate limits, not on auth/validation errors
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout')) return true
    if (msg.includes('429') || msg.includes('too many') || msg.includes('rate')) return true
    if (msg.includes('502') || msg.includes('503') || msg.includes('504')) return true
  }
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendViaProxy(
  systemPrompt: string,
  messages: Message[],
  onChunk: (text: string) => void,
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': useBrandGuideStore.getState().session?.id ?? '',
    },
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
  const send = hasLocalKey() ? sendViaSdk : sendViaProxy
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await send(systemPrompt, messages, onChunk)
    } catch (error) {
      lastError = error
      if (!isRetryable(error) || attempt === MAX_RETRIES - 1) {
        throw error
      }
      // Reset chunk state for retry — caller sees fresh stream
      onChunk('')
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
      await sleep(backoff)
    }
  }

  throw lastError
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
    const jsonStr = extractJsonObject(text)
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr)
        if (parsed.draft) return parsed
      } catch { /* fall through */ }
    }
  }
  return null
}
