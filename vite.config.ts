/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function voiceDevProxy(): Plugin {
  let env: Record<string, string>
  return {
    name: 'voice-dev-proxy',
    configResolved(config) {
      env = loadEnv(config.mode, config.root, '')
    },
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
        const apiKey = env.ELEVENLABS_API_KEY
        const voiceId = env.ELEVENLABS_VOICE_ID
        if (!apiKey || !voiceId) { res.writeHead(500); res.end(JSON.stringify({ error: 'TTS not configured' })); return }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(Buffer.from(chunk))
        const { text } = JSON.parse(Buffer.concat(chunks).toString())
        if (!text) { res.writeHead(400); res.end(JSON.stringify({ error: 'Missing text' })); return }

        try {
          const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
            method: 'POST',
            headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
            body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
          })
          if (!resp.ok) { res.writeHead(502); res.end(JSON.stringify({ error: 'TTS API error' })); return }
          res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' })
          const reader = resp.body?.getReader()
          if (!reader) { res.end(); return }
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch { res.writeHead(500); res.end(JSON.stringify({ error: 'Internal error' })); return }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), voiceDevProxy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
