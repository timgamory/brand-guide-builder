import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { getUserSlug, setUserSlug } from '../services/userSlug'
import type { Path, Session } from '../types'

function PathCard({
  title, description, details, onClick,
}: {
  title: string; description: string; details: string[]; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-8 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left max-w-sm w-full cursor-pointer"
    >
      <h2 className="font-heading text-2xl font-semibold text-brand-text mb-2">{title}</h2>
      <p className="text-brand-text-secondary text-[15px] leading-relaxed mb-4">{description}</p>
      <ul className="space-y-1.5">
        {details.map((d, i) => (
          <li key={i} className="text-brand-text-muted text-sm flex items-start gap-2">
            <span className="text-brand-accent-sage mt-0.5">&#10003;</span>
            {d}
          </li>
        ))}
      </ul>
    </button>
  )
}

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
        <button onClick={onResume} className="bg-brand-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-text-secondary transition-colors">Resume</button>
      </div>
    </div>
  )
}

export function PathSelection() {
  const navigate = useNavigate()
  const { createNewSession, loadSession, loadSessions, deleteSessionById, sessions } = useBrandGuideStore()
  const [loaded, setLoaded] = useState(false)
  const [slug, setSlug] = useState<string | null>(getUserSlug())
  const [nameInput, setNameInput] = useState('')
  const [pendingPath, setPendingPath] = useState<Path | null>(null)

  useEffect(() => {
    if (slug) {
      loadSessions().then(() => setLoaded(true))
    } else {
      setLoaded(true)
    }
  }, [slug, loadSessions])

  const handleSetName = async () => {
    const trimmed = nameInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!trimmed || !pendingPath) return
    setUserSlug(trimmed)
    setSlug(trimmed)
    await createNewSession(pendingPath)
    if (pendingPath === 'intern') {
      navigate('/intern-setup')
    } else {
      navigate('/wizard/basics')
    }
  }

  const handleSelect = async (path: Path) => {
    if (!slug) {
      setPendingPath(path)
      return
    }
    await createNewSession(path)
    if (path === 'intern') {
      navigate('/intern-setup')
    } else {
      navigate('/wizard/basics')
    }
  }

  const handleResume = async (id: string) => {
    await loadSession(id)
    const session = useBrandGuideStore.getState().session
    navigate(`/wizard/${session?.currentSection ?? 'basics'}`)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this session? This cannot be undone.')) {
      await deleteSessionById(id)
    }
  }

  if (!loaded) return null

  return (
    <div className="min-h-screen bg-brand-bg font-body flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold text-brand-text mb-2">Brand Guide Builder</h1>
        <p className="text-brand-text-muted text-lg">Create professional brand guidelines, step by step.</p>
      </div>

      {sessions.length > 0 && (
        <div className="w-full max-w-2xl mb-10 space-y-3">
          <h2 className="font-heading text-lg font-semibold text-brand-text mb-2">Continue where you left off</h2>
          {sessions.map(s => (
            <SessionCard key={s.id} session={s} onResume={() => handleResume(s.id)} onDelete={() => handleDelete(s.id)} />
          ))}
        </div>
      )}

      <div className="flex gap-6 flex-wrap justify-center">
        <PathCard
          title="I'm building my own brand guide"
          description="Work directly with an AI brand strategist who'll draw out what you already know and turn it into polished brand language."
          details={['15-25 minute guided interview', 'Professional brand guide download', 'No design experience needed']}
          onClick={() => handleSelect('entrepreneur')}
        />
        <PathCard
          title="I'm building a brand guide for someone else"
          description="Get guided through a research process: what questions to ask, what to observe, and how to synthesize your findings into professional brand language."
          details={['Structured research assignments', 'AI coaching through synthesis', 'Fellow review and approval flow', 'Reflection document for your portfolio']}
          onClick={() => handleSelect('intern')}
        />
      </div>

      {pendingPath && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setPendingPath(null)}>
          <div className="bg-white rounded-2xl border border-brand-border shadow-lg p-8 max-w-sm w-full space-y-6" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h2 className="font-heading text-2xl font-bold text-brand-text mb-2">What's your name?</h2>
              <p className="text-brand-text-muted text-[15px]">This helps us save your progress.</p>
            </div>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSetName() }}
              placeholder="e.g. Jordan"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-bg text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 font-body"
            />
            <button
              onClick={handleSetName}
              disabled={!nameInput.trim()}
              className="w-full px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      <footer className="mt-12 text-center">
        <a
          href="https://elevatedigital.nyc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-text-faint text-xs hover:text-brand-text-muted transition-colors"
        >
          Built by Elevate Digital
        </a>
      </footer>
    </div>
  )
}
