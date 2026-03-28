import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/* ─── Sticky Header ─── */

function StickyHeader() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const initial = user?.email ? user.email[0].toUpperCase() : ''

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-sm border-b border-brand-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-heading text-lg font-bold text-brand-text">Brand Guide Builder</span>
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-semibold">
              {initial}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm font-medium text-brand-primary hover:text-brand-text-secondary transition-colors"
            >
              Dashboard
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

/* ─── Hero Section ─── */

function HeroSection() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="px-6 pt-24 pb-16 md:pt-32 md:pb-20">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-text leading-tight mb-6">
          Your brand already exists.<br />It just needs a guide.
        </h1>
        <p className="text-brand-text-secondary text-lg md:text-xl leading-relaxed max-w-xl mx-auto mb-8">
          You already know what your business stands for. Brand Guide Builder draws it out through conversation and turns it into a professional document you can share with your team, your designer, or your website.
        </p>
        <button
          onClick={handleCTA}
          className="inline-block bg-brand-primary text-white font-semibold text-[15px] px-8 py-3.5 rounded-xl hover:bg-brand-text-secondary transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:outline-none"
        >
          Get Started
        </button>
      </div>
    </section>
  )
}

/* ─── Why Section ─── */

const WHY_CARDS = [
  {
    title: 'Stop explaining yourself differently every time',
    body: 'Your website says one thing, your social media says another, and your elevator pitch changes weekly. A brand guide locks in the language so everyone\u2019s on the same page.',
  },
  {
    title: 'Give your designer something to work with',
    body: 'When you hire someone to build your website or design a flyer, a brand guide tells them exactly what your brand sounds like, looks like, and stands for \u2014 no guesswork.',
  },
  {
    title: 'Look like you\u2019ve been doing this for years',
    body: 'A clear, consistent brand makes a two-person shop look as polished as a company ten times its size.',
  },
]

function WhySection() {
  return (
    <section className="bg-brand-bg-warm px-6 py-16 md:py-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-brand-text text-center mb-12">
          Why a brand guide?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {WHY_CARDS.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm">
              <h3 className="font-heading text-lg font-semibold text-brand-text mb-2 leading-snug">{c.title}</h3>
              <p className="text-brand-text-secondary text-[15px] leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works Section ─── */

const HOW_STEPS = [
  {
    num: '01',
    title: 'Have a conversation',
    body: 'Answer questions about your business the way you\u2019d talk to a friend. The AI asks follow-ups, offers suggestions when you\u2019re stuck, and never uses jargon.',
  },
  {
    num: '02',
    title: 'Review your drafts',
    body: 'After each topic, you\u2019ll see a polished draft of that section. Edit it, ask for revisions, or approve it and move on.',
  },
  {
    num: '03',
    title: 'Download your guide',
    body: 'When all sections are complete, download a professional brand guide document ready to share with your team or designer.',
  },
]

function HowItWorksSection() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-brand-text text-center mb-12">
          How it works
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {HOW_STEPS.map((s) => (
            <div key={s.num}>
              <span className="font-heading text-3xl font-bold text-brand-accent-coral">{s.num}</span>
              <h3 className="font-heading text-lg font-semibold text-brand-text mt-2 mb-2">{s.title}</h3>
              <p className="text-brand-text-secondary text-[15px] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="text-brand-text-muted text-center mt-10 text-[15px]">
          Most people finish in 2&ndash;3 sessions. No branding experience needed.
        </p>
      </div>
    </section>
  )
}

/* ─── What You Get Section ─── */

const GUIDE_SECTIONS = [
  { title: 'The Basics', desc: 'Name, industry, and who you serve' },
  { title: 'Your Story', desc: 'Why you started and what drives you' },
  { title: 'What You Stand For', desc: 'The values behind every decision' },
  { title: 'Brand Personality', desc: 'How your brand acts and feels' },
  { title: 'Colors', desc: 'Your palette and when to use each color' },
  { title: 'Logo', desc: 'Usage rules and what to avoid' },
  { title: 'Typography', desc: 'Fonts that match your voice' },
  { title: 'Messaging', desc: 'Tagline, elevator pitch, key messages' },
  { title: 'How It All Comes Together', desc: 'Real-world applications' },
  { title: 'Social Media', desc: 'Voice and style for each platform' },
  { title: 'Photography', desc: 'The visual feel of your brand' },
]

function WhatYouGetSection() {
  return (
    <section className="bg-brand-bg-warm px-6 py-16 md:py-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-brand-text text-center mb-12">
          What you'll get
        </h2>

        {/* Mockup card */}
        <div className="flex justify-center mb-14">
          <div className="bg-white rounded-2xl border border-brand-border shadow-lg p-8 max-w-sm w-full rotate-[-1deg]">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-text-muted mb-1">Brand Guide</p>
            <h3 className="font-heading text-2xl font-bold text-brand-text mb-5">Bright Path Consulting</h3>

            <div className="border-t border-brand-border pt-4 mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted mb-1">Brand Story</p>
              <p className="text-brand-text-secondary text-[13px] leading-relaxed">
                Founded in 2019, Bright Path helps small businesses find clarity in their next chapter.
              </p>
            </div>
            <div className="border-t border-brand-border pt-4 mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted mb-1">Values</p>
              <p className="text-brand-text-secondary text-[13px] leading-relaxed">
                Honesty, accessibility, and real talk over corporate jargon.
              </p>
            </div>
            <div className="border-t border-brand-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted mb-1">Voice</p>
              <p className="text-brand-text-secondary text-[13px] leading-relaxed">
                Warm but direct. Like a smart friend who happens to know branding.
              </p>
            </div>
          </div>
        </div>

        {/* Section grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {GUIDE_SECTIONS.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-brand-accent-sage mt-0.5 shrink-0" aria-hidden="true">&#10003;</span>
              <div>
                <p className="font-semibold text-brand-text text-[15px]">{s.title}</p>
                <p className="text-brand-text-muted text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Login Form ─── */

function LoginForm() {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)
    const { error: authError } = await signInWithMagicLink(email.trim())
    setSending(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <h3 className="font-heading text-xl font-semibold text-brand-text">Check your email</h3>
        <p className="text-brand-text-secondary text-[15px]">
          We sent a magic link to <strong>{email}</strong>. Click it to sign in.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <div className="text-center mb-2">
        <h3 className="font-heading text-xl font-semibold text-brand-text">Enter your email to get started</h3>
        <p className="text-brand-text-muted text-[15px] mt-1">We'll send you a magic link — no password needed.</p>
      </div>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-bg text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 font-body"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={sending || !email.trim()}
        className="w-full px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {sending ? 'Sending...' : 'Send Magic Link'}
      </button>
    </form>
  )
}

/* ─── Get Started Section (simplified) ─── */

function GetStartedSection() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) return null

  return (
    <section id="get-started" className="px-6 py-16 md:py-20">
      <div className="max-w-4xl mx-auto">
        {user ? (
          <div className="text-center space-y-6">
            <h2 className="font-heading text-3xl font-bold text-brand-text">
              Welcome back
            </h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-block bg-brand-primary text-white font-semibold text-[15px] px-8 py-3.5 rounded-xl hover:bg-brand-text-secondary transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:outline-none"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-heading text-3xl font-bold text-brand-text text-center mb-12">
              Ready to start?
            </h2>
            <LoginForm />
          </>
        )}
      </div>
    </section>
  )
}

/* ─── Main Page ─── */

export function HomePage() {
  return (
    <div className="min-h-screen bg-brand-bg font-body">
      <StickyHeader />
      <HeroSection />
      <WhySection />
      <HowItWorksSection />
      <WhatYouGetSection />
      <GetStartedSection />

      <footer className="py-8 text-center">
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
