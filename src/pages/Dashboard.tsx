import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { useAuth } from '../hooks/useAuth'
import type { Session } from '../types'

function SessionCard({ session, onResume, onDelete }: { session: Session; onResume: () => void; onDelete: () => void }) {
  const updated = new Date(session.updatedAt).toLocaleDateString()
  const approvedCount = Object.values(session.sections).filter(s => s.status === 'approved').length

  return (
    <div className="bg-white rounded-xl p-5 border border-brand-border flex items-center justify-between">
      <div>
        <p className="font-body font-semibold text-brand-text">
          {session.brandData.orgName || 'Untitled'}
        </p>
        <p className="text-brand-text-muted text-sm">
          {session.path === 'entrepreneur' ? 'Your Brand' : 'Intern Path'} &middot; {approvedCount}/11 sections &middot; Updated {updated}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={onDelete} className="text-brand-text-faint text-sm hover:text-red-500 transition-colors px-2">Delete</button>
        <button onClick={onResume} className="bg-brand-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-text-secondary transition-colors">Continue</button>
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading, signOut } = useAuth()
  const { sessions, loadSessions, createNewSession, loadSession, deleteSessionById, setInternMeta } = useBrandGuideStore()

  const [loaded, setLoaded] = useState(false)
  const [showPathChoice, setShowPathChoice] = useState(false)
  const [showInternForm, setShowInternForm] = useState(false)
  const [internName, setInternName] = useState('')
  const [fellowName, setFellowName] = useState('')

  // Auth guard: redirect to landing if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true })
    }
  }, [authLoading, user, navigate])

  // Load sessions when user is present
  useEffect(() => {
    if (user) {
      loadSessions().then(() => setLoaded(true))
    }
  }, [user, loadSessions])

  const handleResume = async (id: string) => {
    await loadSession(id)
    const s = useBrandGuideStore.getState().session
    navigate(`/wizard/${s?.currentSection ?? 'basics'}`)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this session? This cannot be undone.')) {
      await deleteSessionById(id)
    }
  }

  const handleSelectEntrepreneur = async () => {
    await createNewSession('entrepreneur')
    navigate('/wizard/basics')
  }

  const handleSelectIntern = () => {
    setShowPathChoice(false)
    setShowInternForm(true)
  }

  const handleInternSubmit = async () => {
    if (!internName.trim() || !fellowName.trim()) return
    await createNewSession('intern')
    await setInternMeta({
      internName: internName.trim(),
      fellowName: fellowName.trim(),
      startDate: new Date().toISOString(),
    })
    navigate('/wizard/basics')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // Loading state: prevent flash
  if (authLoading || !loaded) return null

  const emailInitial = user?.email ? user.email[0].toUpperCase() : '?'

  return (
    <div className="min-h-screen bg-brand-bg font-body">
      {/* Dashboard header */}
      <header className="bg-brand-primary">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="font-heading text-lg font-bold text-white hover:opacity-80 transition-opacity">
            Brand Guide Builder
          </button>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
              {emailInitial}
            </div>
            <button onClick={handleSignOut} className="text-white/80 text-sm hover:text-white transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Session list */}
        {sessions.length > 0 && (
          <div className="mb-10">
            <h2 className="font-heading text-2xl font-bold text-brand-text mb-4">Your Brand Guides</h2>
            <div className="space-y-3">
              {sessions.map(s => (
                <SessionCard key={s.id} session={s} onResume={() => handleResume(s.id)} onDelete={() => handleDelete(s.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && !showPathChoice && !showInternForm && (
          <p className="text-brand-text-muted text-center text-[15px] mb-8">
            You don't have any brand guides yet.
          </p>
        )}

        {/* Start New Guide button */}
        {!showPathChoice && !showInternForm && (
          <div className="text-center">
            <button
              onClick={() => setShowPathChoice(true)}
              className="bg-brand-primary text-white font-semibold text-[15px] px-8 py-3.5 rounded-xl hover:bg-brand-text-secondary transition-colors"
            >
              Start New Guide
            </button>
          </div>
        )}

        {/* Path selection */}
        {showPathChoice && (
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-brand-text mb-6">Choose your path</h2>
            <div className="flex gap-6 flex-wrap justify-center">
              <button
                onClick={handleSelectEntrepreneur}
                className="bg-white rounded-2xl p-8 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left max-w-sm w-full cursor-pointer"
              >
                <h3 className="font-heading text-2xl font-semibold text-brand-text mb-2">I'm building my own brand guide</h3>
                <p className="text-brand-text-secondary text-[15px] leading-relaxed">
                  Work directly with an AI brand strategist who'll draw out what you already know and turn it into polished brand language.
                </p>
              </button>
              <button
                onClick={handleSelectIntern}
                className="bg-white rounded-2xl p-8 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left max-w-sm w-full cursor-pointer"
              >
                <h3 className="font-heading text-2xl font-semibold text-brand-text mb-2">I'm building for someone else</h3>
                <p className="text-brand-text-secondary text-[15px] leading-relaxed">
                  Get guided through a research process with structured assignments, AI coaching, and a fellow review flow.
                </p>
              </button>
            </div>
            <button
              onClick={() => setShowPathChoice(false)}
              className="text-brand-text-muted text-sm mt-6 hover:text-brand-text transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Inline intern setup */}
        {showInternForm && (
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8 max-w-md w-full space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-bold text-brand-text">Getting Started</h2>
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
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowInternForm(false); setShowPathChoice(true) }}
                  className="px-6 py-3 rounded-xl border border-brand-border text-brand-text-secondary font-medium text-[15px] hover:bg-brand-bg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleInternSubmit}
                  disabled={!internName.trim() || !fellowName.trim()}
                  className="flex-1 px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Let's go
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer text */}
        <p className="text-brand-text-muted text-center mt-10 text-sm">
          Your progress is saved automatically.
        </p>
      </main>
    </div>
  )
}
