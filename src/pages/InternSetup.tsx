import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'

export function InternSetup() {
  const navigate = useNavigate()
  const setInternMeta = useBrandGuideStore(s => s.setInternMeta)
  const [internName, setInternName] = useState('')
  const [fellowName, setFellowName] = useState('')

  const handleContinue = async () => {
    if (!internName.trim() || !fellowName.trim()) return
    await setInternMeta({
      internName: internName.trim(),
      fellowName: fellowName.trim(),
      startDate: new Date().toISOString(),
    })
    navigate('/wizard/basics')
  }

  return (
    <div className="min-h-screen bg-brand-bg font-body flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8 max-w-md w-full space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Getting Started</h1>
          <p className="text-brand-text-muted text-[15px] mt-1">
            You'll be building a brand guide for someone else. Let's get the basics.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Your name</label>
            <input
              value={internName}
              onChange={e => setInternName(e.target.value)}
              placeholder="e.g. Jordan"
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-bg text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 font-body"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Who are you building this for?</label>
            <input
              value={fellowName}
              onChange={e => setFellowName(e.target.value)}
              placeholder="e.g. Maria"
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-bg text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 font-body"
            />
          </div>
        </div>
        <button
          onClick={handleContinue}
          disabled={!internName.trim() || !fellowName.trim()}
          className="w-full px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Let's go
        </button>
      </div>
    </div>
  )
}
