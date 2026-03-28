# Simplified Login Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the overloaded PathSelection page with a clean marketing HomePage and a separate auth-gated Dashboard page.

**Architecture:** Split `PathSelection.tsx` into two new pages: `HomePage.tsx` (pure marketing + sticky auth-aware header) and `Dashboard.tsx` (session management + path selection + inline intern setup). Update routes, redirects, and delete three obsolete pages.

**Tech Stack:** React 18, React Router, TypeScript, Tailwind CSS 4, Zustand, Supabase Auth

**Design doc:** `docs/plans/2026-03-27-simplified-login-flow-design.md`

---

### Task 1: Create HomePage component

**Files:**
- Create: `src/pages/HomePage.tsx`

**Step 1: Create the HomePage component**

Extract the marketing sections (HeroSection, WhySection, HowItWorksSection, WhatYouGetSection) from `src/pages/PathSelection.tsx` into a new `HomePage.tsx`. Add a sticky auth-aware header and a LoginForm section.

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function StickyHeader() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border px-6 py-3 flex items-center justify-between">
      <h1 className="font-heading text-lg font-semibold text-brand-text">
        Brand Guide Builder
      </h1>
      {!isLoading && user && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-semibold">
            {(user.email?.[0] ?? '?').toUpperCase()}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium text-brand-primary hover:text-brand-text-secondary transition-colors"
          >
            Dashboard
          </button>
        </div>
      )}
    </header>
  )
}

function LoginForm() {
  // Copy the existing LoginForm from PathSelection.tsx exactly (lines 220-277)
  // It uses useAuth().signInWithMagicLink, manages email/sent/error/sending state
  // No changes needed to the form itself
}

function HeroSection() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  const handleGetStarted = () => {
    if (!isLoading && user) {
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
          onClick={handleGetStarted}
          className="inline-block bg-brand-primary text-white font-semibold text-[15px] px-8 py-3.5 rounded-xl hover:bg-brand-text-secondary transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:outline-none"
        >
          Get Started
        </button>
      </div>
    </section>
  )
}

// WhySection — copy from PathSelection.tsx lines 77-110 (WHY_CARDS constant + component), no changes
// HowItWorksSection — copy from PathSelection.tsx lines 112-152, no changes
// WhatYouGetSection — copy from PathSelection.tsx lines 154-218, no changes

function GetStartedSection() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) return null

  // If logged in, show a simple message with dashboard link
  if (user) {
    return (
      <section id="get-started" className="px-6 py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-brand-text mb-4">
            Welcome back
          </h2>
          <p className="text-brand-text-secondary text-[15px] mb-6">
            Head to your dashboard to continue or start a new guide.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-block bg-brand-primary text-white font-semibold text-[15px] px-8 py-3.5 rounded-xl hover:bg-brand-text-secondary transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </section>
    )
  }

  // If not logged in, show the magic link login form
  return (
    <section id="get-started" className="px-6 py-16 md:py-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-brand-text text-center mb-12">
          Ready to start?
        </h2>
        <LoginForm />
      </div>
    </section>
  )
}

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
```

Key differences from PathSelection:
- `StickyHeader` is new: avatar circle (first letter of email) + "Dashboard" button when logged in
- `HeroSection` CTA text changes from "Build Your Brand Guide" to "Get Started", becomes a `<button>` instead of `<a>`, and navigates to `/dashboard` if logged in or scrolls to `#get-started` if not
- `GetStartedSection` no longer shows path cards or session list. When logged in, shows "Go to Dashboard" button. When not logged in, shows `LoginForm`
- No session-loading logic, no auto-redirect `useEffect`, no path selection
- `LoginForm` copied as-is from PathSelection

**Step 2: Verify it compiles**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: add HomePage marketing page with sticky auth header"
```

---

### Task 2: Create Dashboard component

**Files:**
- Create: `src/pages/Dashboard.tsx`

**Step 1: Create the Dashboard component**

Build a new auth-gated dashboard with session list and path selection. Reuses `SessionCard` and `PathCard` patterns from PathSelection, adds inline intern setup.

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { useAuth } from '../hooks/useAuth'
import type { Session, Path } from '../types'

function SessionCard({ session, onResume, onDelete }: { session: Session; onResume: () => void; onDelete: () => void }) {
  // Copy from PathSelection.tsx lines 32-52 — no changes needed
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

  // Auth guard: redirect to / if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true })
    }
  }, [authLoading, user, navigate])

  // Load sessions on mount
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

  const handleSelectPath = async (path: Path) => {
    if (path === 'intern') {
      setShowInternForm(true)
      setShowPathChoice(false)
    } else {
      await createNewSession(path)
      navigate('/wizard/basics')
    }
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

  if (authLoading || !loaded) return null

  return (
    <div className="min-h-screen bg-brand-bg font-body">
      {/* Dashboard header */}
      <header className="bg-brand-primary px-6 py-4 flex items-center justify-between">
        <h1
          onClick={() => navigate('/')}
          className="font-heading text-xl font-semibold text-white cursor-pointer hover:text-white/80 transition-colors"
        >
          Brand Guide Builder
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-semibold">
            {(user?.email?.[0] ?? '?').toUpperCase()}
          </div>
          <button
            onClick={handleSignOut}
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="font-heading text-3xl font-bold text-brand-text mb-8">
          Your Brand Guides
        </h2>

        {/* Existing sessions */}
        {sessions.length > 0 && (
          <div className="space-y-3 mb-10">
            {sessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                onResume={() => handleResume(s.id)}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        )}

        {sessions.length === 0 && !showPathChoice && !showInternForm && (
          <p className="text-brand-text-muted text-[15px] mb-8">
            You don't have any brand guides yet. Start your first one!
          </p>
        )}

        {/* Start new guide */}
        {!showPathChoice && !showInternForm && (
          <button
            onClick={() => setShowPathChoice(true)}
            className="w-full py-4 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors"
          >
            Start New Guide
          </button>
        )}

        {/* Path selection */}
        {showPathChoice && (
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-semibold text-brand-text">Choose your path</h3>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => handleSelectPath('entrepreneur')}
                className="flex-1 min-w-[250px] bg-white rounded-2xl p-6 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer"
              >
                <h4 className="font-heading text-lg font-semibold text-brand-text mb-1">I'm building my own brand guide</h4>
                <p className="text-brand-text-muted text-sm">Work directly with an AI brand strategist</p>
              </button>
              <button
                onClick={() => handleSelectPath('intern')}
                className="flex-1 min-w-[250px] bg-white rounded-2xl p-6 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer"
              >
                <h4 className="font-heading text-lg font-semibold text-brand-text mb-1">I'm building for someone else</h4>
                <p className="text-brand-text-muted text-sm">Guided research and synthesis process</p>
              </button>
            </div>
            <button
              onClick={() => setShowPathChoice(false)}
              className="text-brand-text-muted text-sm hover:text-brand-text transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Inline intern setup */}
        {showInternForm && (
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8 max-w-md space-y-6">
            <div>
              <h3 className="font-heading text-xl font-semibold text-brand-text">Getting Started</h3>
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
                className="px-4 py-3 rounded-xl text-brand-text-muted text-[15px] hover:text-brand-text transition-colors"
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
        )}

        <p className="text-brand-text-muted text-center mt-8 text-[15px]">
          Your progress is saved automatically. Come back anytime.
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: add Dashboard page with session list and path selection"
```

---

### Task 3: Update routes and redirects

**Files:**
- Modify: `src/App.tsx` (all lines)
- Modify: `src/pages/AuthCallback.tsx:11` (change redirect from `'/'` to `'/dashboard'`)
- Modify: `src/components/layout/WizardShell.tsx:24,30` (change redirects from `'/'` to `'/dashboard'`)

**Step 1: Update App.tsx**

Replace the entire file with updated routes:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Dashboard } from './pages/Dashboard'
import { WizardShell } from './components/layout/WizardShell'
import { WizardSection } from './pages/WizardSection'
import { GuidePreview } from './pages/GuidePreview'
import { FellowReview } from './pages/FellowReview'
import { PresentationView } from './pages/PresentationView'
import { AuthCallback } from './pages/AuthCallback'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/wizard" element={<WizardShell />}>
        <Route index element={<WizardSection />} />
        <Route path=":sectionId" element={<WizardSection />} />
      </Route>
      <Route path="/preview" element={<GuidePreview />} />
      <Route path="/review/:token" element={<FellowReview />} />
      <Route path="/presentation" element={<PresentationView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

Changes: removed imports for `PathSelection`, `ApiKeySetup`, `InternSetup`. Added `HomePage` and `Dashboard`. Removed `/setup` and `/intern-setup` routes.

**Step 2: Update AuthCallback redirect**

In `src/pages/AuthCallback.tsx`, change line 11:
```tsx
// Before:
navigate('/', { replace: true })
// After:
navigate('/dashboard', { replace: true })
```

**Step 3: Update WizardShell redirects**

In `src/components/layout/WizardShell.tsx`, change line 24 and line 30:
```tsx
// Before (line 24):
navigate('/')
// After:
navigate('/dashboard')

// Before (line 30):
navigate('/')
// After:
navigate('/dashboard')
```

**Step 4: Verify it compiles**

Run: `npx tsc -b`
Expected: No errors (old pages may produce "unused" warnings but since they're not imported, they just won't be bundled)

**Step 5: Run existing tests**

Run: `npx vitest run`
Expected: All 68 tests pass (no test file references the deleted routes)

**Step 6: Commit**

```bash
git add src/App.tsx src/pages/AuthCallback.tsx src/components/layout/WizardShell.tsx
git commit -m "feat: update routes and redirects for new login flow"
```

---

### Task 4: Delete obsolete files

**Files:**
- Delete: `src/pages/PathSelection.tsx`
- Delete: `src/pages/InternSetup.tsx`
- Delete: `src/pages/ApiKeySetup.tsx`

**Step 1: Delete the files**

```bash
git rm src/pages/PathSelection.tsx src/pages/InternSetup.tsx src/pages/ApiKeySetup.tsx
```

**Step 2: Verify build**

Run: `npx tsc -b`
Expected: No errors. These files are no longer imported anywhere.

**Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 4: Commit**

```bash
git commit -m "chore: remove PathSelection, InternSetup, ApiKeySetup — replaced by HomePage + Dashboard"
```

---

### Task 5: Manual verification via dev server

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Verify each flow**

Test these scenarios in the browser:

1. **`/` not logged in:** See marketing page with sticky header (no avatar). Click "Get Started" — scrolls to login form. Submit email — see "Check your email" message.
2. **`/` logged in:** Sticky header shows avatar circle + "Dashboard" button. Click "Get Started" — navigates to `/dashboard`. "Get Started" section shows "Welcome back" with dashboard link.
3. **`/dashboard` not logged in:** Redirects to `/`.
4. **`/dashboard` logged in, no sessions:** Shows "You don't have any brand guides yet" + "Start New Guide" button.
5. **`/dashboard` "Start New Guide":** Shows two path cards. Click entrepreneur — creates session, goes to `/wizard/basics`. Click intern — shows inline name/fellow form, fill in, click "Let's go" — goes to `/wizard/basics`.
6. **`/dashboard` with existing sessions:** Shows session cards with "Continue" and "Delete". Click "Continue" — loads session, navigates to wizard.
7. **`/wizard` sign out:** Navigates to `/`.
8. **Magic link callback:** After clicking magic link in email, arrives at `/auth/callback`, redirects to `/dashboard`.

**Step 3: Commit any fixes found during testing**

---

### Task 6: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the Architecture section**

Update the Auth description to reflect the new flow:

> **Auth**: Supabase Magic Link authentication. Users land on the marketing homepage (`/`). If logged in, a sticky header shows their avatar and a "Dashboard" button. The single "Get Started" CTA navigates to `/dashboard` (logged in) or shows a magic link form (not logged in). The Dashboard (`/dashboard`) is auth-gated and handles session management, path selection, and inline intern setup. Auth callback redirects to `/dashboard`.

Remove any references to PathSelection, InternSetup, or ApiKeySetup. Add Dashboard to the description.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for simplified login flow"
```
