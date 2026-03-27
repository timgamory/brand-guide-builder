export const config = { runtime: 'edge' }

import { createClient } from '@supabase/supabase-js'

const MAX_BODY_SIZE = 100_000 // 100KB
const MAX_MESSAGES = 50
const MAX_SYSTEM_PROMPT_LENGTH = 10_000
const MAX_MESSAGE_LENGTH = 5_000
const MAX_TOKENS_CEILING = 4000

// Simple in-memory rate limiter (per-edge-instance, not distributed)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX_REQUESTS
}

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function isValidOrigin(req: Request): boolean {
  const origin = req.headers.get('origin') ?? ''
  const referer = req.headers.get('referer') ?? ''
  const allowedHosts = [
    'brand-guide-builder',
    'localhost',
    '127.0.0.1',
  ]
  return allowedHosts.some(h => origin.includes(h) || referer.includes(h))
}

function validateMessages(messages: unknown): messages is Array<{ role: string; content: string }> {
  if (!Array.isArray(messages)) return false
  if (messages.length === 0 || messages.length > MAX_MESSAGES) return false
  return messages.every(
    m =>
      m &&
      typeof m === 'object' &&
      'role' in m &&
      'content' in m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.length <= MAX_MESSAGE_LENGTH
  )
}

// Analytics: SUPABASE_SERVICE_ROLE_KEY must be added to Vercel env vars
function getAnalyticsClient() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function trackEvent(sessionId: string | null, eventType: string, payload: Record<string, unknown>) {
  try {
    const client = getAnalyticsClient()
    if (!client) return
    client.from('analytics_events').insert({
      session_id: sessionId,
      event_type: eventType,
      payload,
    }).then(
      () => {},
      () => {},
    )
  } catch {
    // Never let analytics break the proxy
  }
}

function hashIp(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req: Request) {
  // Method check
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  // Origin check
  if (!isValidOrigin(req)) {
    return errorResponse('Forbidden', 403)
  }

  // Rate limiting
  const ip = getClientIp(req)
  const sessionId = req.headers.get('x-session-id') || null
  const sectionId = req.headers.get('x-section-id') || null
  if (isRateLimited(ip)) {
    trackEvent(sessionId, 'api.rate_limited', { sectionId, ipHash: hashIp(ip) })
    return errorResponse('Too many requests. Please wait a minute.', 429)
  }

  // API key check
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return errorResponse('API key not configured', 500)
  }

  try {
    // Body size check
    const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
    if (contentLength > MAX_BODY_SIZE) {
      return errorResponse('Request too large', 413)
    }

    const body = await req.json()

    // Validate system prompt
    const system = body.system
    if (typeof system !== 'string' || system.length === 0 || system.length > MAX_SYSTEM_PROMPT_LENGTH) {
      return errorResponse('Invalid system prompt', 400)
    }

    // Validate messages
    if (!validateMessages(body.messages)) {
      return errorResponse('Invalid messages', 400)
    }

    // Validate max_tokens
    const max_tokens = Math.min(
      typeof body.max_tokens === 'number' ? body.max_tokens : 2000,
      MAX_TOKENS_CEILING
    )

    // Forward to Anthropic — only pass validated fields
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens,
        system,
        messages: body.messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const status = response.status
      trackEvent(sessionId, 'api.error', {
        sectionId,
        statusCode: status,
        errorType: status === 429 ? 'rate_limited' : status === 401 ? 'auth' : 'server',
      })
      if (status === 429) return errorResponse('AI service is busy. Please try again shortly.', 429)
      if (status === 401) return errorResponse('API configuration error', 500)
      return errorResponse('AI service error', 502)
    }

    trackEvent(sessionId, 'api.request', { sectionId, model: 'claude-sonnet-4-6' })

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch {
    trackEvent(sessionId, 'api.error', { sectionId, statusCode: 500, errorType: 'exception' })
    return errorResponse('Request failed', 500)
  }
}
