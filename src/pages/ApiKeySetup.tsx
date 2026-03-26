import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import type { Path } from '../types'

export function ApiKeySetup() {
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const createNewSession = useBrandGuideStore(s => s.createNewSession)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = apiKey.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setError('API key should start with "sk-ant-"')
      return
    }
    localStorage.setItem('anthropic-api-key', trimmed)
    const pendingPath = localStorage.getItem('pending-path') as Path | null
    localStorage.removeItem('pending-path')
    if (pendingPath) {
      await createNewSession(pendingPath)
      navigate('/wizard/basics')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg font-body flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="font-heading text-2xl font-semibold text-brand-text mb-2">Connect to Claude</h1>
        <p className="text-brand-text-muted text-[15px] leading-relaxed mb-6">
          The Brand Guide Builder uses Claude to conduct your brand interview. Enter your Anthropic API key to get started. Your key is stored locally in your browser and never sent to any server except Anthropic.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Anthropic API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setError('') }}
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text font-body text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all"
          />
          {error && <p className="text-red-500 text-sm mt-1.5">{error}</p>}
          <button
            type="submit"
            disabled={!apiKey.trim()}
            className="mt-4 w-full py-3 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
        <p className="text-brand-text-faint text-xs mt-4 leading-relaxed">
          Don't have an API key? Get one at console.anthropic.com
        </p>
      </div>
    </div>
  )
}
