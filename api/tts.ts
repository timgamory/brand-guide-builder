export const config = { runtime: 'edge' }

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

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
    'elevate-brand',
    'brand-guide-builder',
    'localhost',
    '127.0.0.1',
  ]
  return allowedHosts.some(h => origin.includes(h) || referer.includes(h))
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
  if (isRateLimited(ip)) {
    return errorResponse('Too many requests. Please wait a minute.', 429)
  }

  // API key + voice ID check
  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  if (!apiKey || !voiceId) {
    return errorResponse('TTS not configured', 500)
  }

  try {
    const { text } = await req.json()

    // Validate text input
    if (!text || typeof text !== 'string' || text.length > 5000) {
      return errorResponse('Invalid text', 400)
    }

    // Forward to ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      console.error('ElevenLabs API error:', response.status, errText)
      return errorResponse('TTS API error', 502)
    }

    // Stream audio back to client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return errorResponse('Request failed', 500)
  }
}
