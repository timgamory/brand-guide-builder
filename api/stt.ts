export const config = { runtime: 'edge' }

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute per IP
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB
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

  // API key check
  const apiKey = process.env.STT_PROVIDER_API_KEY
  if (!apiKey) {
    return errorResponse('STT not configured', 500)
  }

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio')

    // Validate audio file
    if (!audioFile || !(audioFile instanceof File)) {
      return errorResponse('Missing audio file', 400)
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      return errorResponse('File too large (max 25MB)', 400)
    }

    // Forward to OpenAI Whisper
    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, audioFile.name || 'audio.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', 'en')

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperForm,
      }
    )

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      console.error('Whisper API error:', response.status, errText)
      return errorResponse('STT API error', 502)
    }

    const result = (await response.json()) as { text: string }
    return new Response(JSON.stringify({ text: result.text }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return errorResponse('Request failed', 500)
  }
}
