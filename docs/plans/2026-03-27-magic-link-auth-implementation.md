# Magic Link Auth + Session Identity Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace localStorage slug identity with Supabase Magic Link authentication so returning users auto-resume their guide without accidentally creating duplicates.

**Architecture:** Add a `useAuth` hook wrapping Supabase `onAuthStateChange`. Protect routes with an `AuthGate` wrapper. Replace all `user_slug` references with `user_id` from `auth.uid()`. Modify `PathSelection` to show login CTA when unauthenticated, path selection when authenticated without session, and auto-redirect when authenticated with session.

**Tech Stack:** Supabase Auth (magic link), React hooks, React Router, Zustand

**Design doc:** `docs/plans/2026-03-27-magic-link-auth-design.md`

---

### Task 0: Supabase Dashboard Configuration (Manual)

Before any code changes, configure the Supabase project:

**Step 1: Enable Magic Link auth provider**

In Supabase Dashboard > Authentication > Providers > Email:
- Ensure "Enable Email provider" is ON
- Ensure "Enable Magic Link" is ON (sometimes labeled "Enable email confirmations" — magic links work via OTP email by default)

**Step 2: Add redirect URLs**

In Supabase Dashboard > Authentication > URL Configuration:
- Add `http://localhost:5173/auth/callback` to "Redirect URLs"
- Add `https://elevate-brand.vercel.app/auth/callback` to "Redirect URLs"

**Step 3: Verify**

No code commit for this task — it's dashboard-only.

---

### Task 1: Database Migration — Add `user_id` Column + Update RLS

**Files:**
- Create: `supabase/migrations/001_add_user_id.sql`
- Modify: `supabase/schema.sql` (update canonical schema reference)

**Step 1: Write the migration SQL**

Create `supabase/migrations/001_add_user_id.sql`:

```sql
-- Add user_id column to sessions (nullable for backwards compat)
ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_sessions_user_id ON sessions (user_id) WHERE user_id IS NOT NULL;

-- Drop old permissive policies
DROP POLICY IF EXISTS "allow_all_sessions" ON sessions;
DROP POLICY IF EXISTS "allow_all_conversations" ON conversations;
DROP POLICY IF EXISTS "allow_all_reflections" ON reflections;
DROP POLICY IF EXISTS "allow_all_reviews" ON reviews;

-- Sessions: authenticated users access their own rows
CREATE POLICY "users_own_sessions" ON sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Conversations: access via session ownership
-- conversation.id format is "{sessionId}:{sectionId}"
CREATE POLICY "users_own_conversations" ON conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = split_part(conversations.id, ':', 1)::uuid
        AND sessions.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = split_part(conversations.id, ':', 1)::uuid
        AND sessions.user_id = auth.uid()
    )
  );

-- Reflections: access via session ownership
-- reflections.id = session.id
CREATE POLICY "users_own_reflections" ON reflections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reflections.id
        AND sessions.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reflections.id
        AND sessions.user_id = auth.uid()
    )
  );

-- Reviews: access via session ownership
CREATE POLICY "users_own_reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reviews.id
        AND sessions.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reviews.id
        AND sessions.user_id = auth.uid()
    )
  );

-- Reviews: also allow access via review token (for fellow review — anon users)
-- This uses a Postgres function to check the token from request headers
-- For now, keep reviews accessible to anon for the /review/:token flow
CREATE POLICY "anon_review_token_access" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reviews.id
        AND sessions.review_token IS NOT NULL
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reviews.id
        AND sessions.review_token IS NOT NULL
    )
  );

-- Sessions: also allow read-only access by review_token for /review/:token page
CREATE POLICY "anon_review_token_session_read" ON sessions
  FOR SELECT USING (review_token IS NOT NULL);

-- Analytics: keep insert-only permissive (no sensitive data)
-- (analytics_events policy already allows all, leave it)
```

**Step 2: Run the migration in Supabase Dashboard**

Go to SQL Editor > New Query > paste the migration > Run.

**Step 3: Update `supabase/schema.sql`**

Add the `user_id` column to the sessions table definition and update the RLS policies section to reflect the new policies (this file is the canonical reference, not auto-applied).

**Step 4: Commit**

```bash
git add supabase/
git commit -m "db: add user_id column and auth-scoped RLS policies"
```

---

### Task 2: Create `useAuth` Hook

**Files:**
- Create: `src/hooks/useAuth.ts`
- Test: `src/hooks/__tests__/useAuth.test.ts`

**Step 1: Write the test**

Create `src/hooks/__tests__/useAuth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock supabase before importing hook
const mockOnAuthStateChange = vi.fn()
const mockGetSession = vi.fn()
const mockSignInWithOtp = vi.fn()
const mockSignOut = vi.fn()

vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signInWithOtp: (...args: unknown[]) => mockSignInWithOtp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}))

import { useAuth } from '../useAuth'

describe('useAuth', () => {
  let authCallback: (event: string, session: unknown) => void

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockImplementation((cb: typeof authCallback) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
  })

  it('starts in loading state then resolves to no user', async () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isLoading).toBe(true)

    await act(async () => {})
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('exposes user after sign-in event', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {})

    const fakeUser = { id: 'user-123', email: 'test@example.com' }
    act(() => {
      authCallback('SIGNED_IN', { user: fakeUser })
    })

    expect(result.current.user).toEqual(fakeUser)
    expect(result.current.isLoading).toBe(false)
  })

  it('clears user on sign-out event', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
      error: null,
    })

    const { result } = renderHook(() => useAuth())
    await act(async () => {})

    act(() => {
      authCallback('SIGNED_OUT', null)
    })

    expect(result.current.user).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useAuth.test.ts`
Expected: FAIL — module `../useAuth` not found

**Step 3: Install `@testing-library/react` if needed**

Run: `npm ls @testing-library/react` — if not installed:
Run: `npm install -D @testing-library/react @testing-library/dom`

**Step 4: Write the hook**

Create `src/hooks/useAuth.ts`:

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithMagicLink = async (email: string) => {
    const redirectTo = `${window.location.origin}/auth/callback`
    return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
  }

  const signOut = async () => {
    return supabase.auth.signOut()
  }

  return { user, isLoading, signInWithMagicLink, signOut }
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useAuth.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useAuth hook wrapping Supabase magic link auth"
```

---

### Task 3: Create `AuthCallback` Page

**Files:**
- Create: `src/pages/AuthCallback.tsx`

**Step 1: Write the component**

Create `src/pages/AuthCallback.tsx`:

```tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase JS SDK automatically picks up the token from the URL hash
    // and exchanges it for a session. We just need to wait for that to complete.
    supabase.auth.getSession().then(() => {
      navigate('/', { replace: true })
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-brand-bg font-body flex items-center justify-center">
      <p className="text-brand-text-secondary">Signing you in...</p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/pages/AuthCallback.tsx
git commit -m "feat: add AuthCallback page for magic link redirect"
```

---

### Task 4: Update Types and Storage Layer

**Files:**
- Modify: `src/types/index.ts:37-49` (Session type)
- Modify: `src/services/storage.ts:24-52,76-99,124-137` (CRUD functions)

**Step 1: Update Session type**

In `src/types/index.ts`, replace `userSlug?: string` with `userId?: string` in the `Session` type:

```typescript
export type Session = {
  id: string
  path: Path
  userId?: string       // was: userSlug?: string
  brandData: BrandData
  sections: Record<string, SectionState>
  currentSection: string
  internMeta?: InternMeta
  reviewToken?: string
  generatedDocument?: string
  createdAt: string
  updatedAt: string
}
```

**Step 2: Update `storage.ts` — row converters**

In `sessionFromRow`:
- Change `userSlug: row.user_slug as string | undefined` to `userId: row.user_id as string | undefined`

In `sessionToRow`:
- Change `if (session.userSlug !== undefined) row.user_slug = session.userSlug` to `if (session.userId !== undefined) row.user_id = session.userId`

**Step 3: Update `createSession` signature and body**

Change the function signature from `createSession(path, userSlug?)` to `createSession(path, userId?)`:

```typescript
async function createSession(path: Session['path'], userId?: string): Promise<Session> {
  const session: Session = {
    id: generateId(),
    path,
    userId,
    brandData: {},
    sections: buildInitialSections(),
    currentSection: 'basics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase.from('sessions').insert({
    id: session.id,
    path: session.path,
    user_id: session.userId,
    brand_data: session.brandData,
    sections: session.sections,
    current_section: session.currentSection,
  })

  if (error) throw new Error(`Failed to create session: ${error.message}`)
  return session
}
```

**Step 4: Update `listSessions`**

Change from filtering by `user_slug` to filtering by `user_id`:

```typescript
async function listSessions(userId?: string): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select('*')
    .order('updated_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to list sessions: ${error.message}`)
  return (data ?? []).map(sessionFromRow)
}
```

**Step 5: Run existing storage tests to check for breakage**

Run: `npx vitest run src/services/__tests__/storage.test.ts`
Expected: PASS (tests mock supabase and don't reference userSlug directly)

**Step 6: Commit**

```bash
git add src/types/index.ts src/services/storage.ts
git commit -m "refactor: replace userSlug with userId in Session type and storage layer"
```

---

### Task 5: Update `brandGuideStore`

**Files:**
- Modify: `src/stores/brandGuideStore.ts`

**Step 1: Remove `getUserSlug` import and add `supabase` import**

Remove:
```typescript
import { getUserSlug } from '../services/userSlug'
```

Add:
```typescript
import { supabase } from '../services/supabase'
```

**Step 2: Update `createNewSession`**

Replace the body:

```typescript
createNewSession: async (path) => {
  set({ isLoading: true })
  const { data: { user } } = await supabase.auth.getUser()
  const session = await createSession(path, user?.id)
  set({ session, isLoading: false })
  track('session.created', { path }, session.id)
},
```

**Step 3: Update `loadSessions`**

```typescript
loadSessions: async () => {
  const { data: { user } } = await supabase.auth.getUser()
  const sessions = await listSessions(user?.id)
  set({ sessions })
},
```

**Step 4: Update `loadMostRecentSession`**

```typescript
loadMostRecentSession: async () => {
  const { session } = get()
  if (session) return
  set({ isLoading: true })
  const { data: { user } } = await supabase.auth.getUser()
  const sessions = await listSessions(user?.id)
  if (sessions.length > 0) {
    set({ session: sessions[0], sessions, isLoading: false })
  } else {
    set({ isLoading: false })
  }
},
```

**Step 5: Run store tests**

Run: `npx vitest run src/stores/__tests__/brandGuideStore.test.ts`
Expected: PASS (store tests mock storage entirely and don't import userSlug)

**Step 6: Commit**

```bash
git add src/stores/brandGuideStore.ts
git commit -m "refactor: replace getUserSlug with supabase auth in brandGuideStore"
```

---

### Task 6: Update `PathSelection` — Three Auth States

**Files:**
- Modify: `src/pages/PathSelection.tsx`

This is the largest change. The page now has three modes:
1. **Not authenticated:** marketing content + email login form (replaces path cards + name modal)
2. **Authenticated + no session:** path selection cards (same UI, no name modal)
3. **Authenticated + has session:** auto-redirect to wizard

**Step 1: Replace imports**

Remove:
```typescript
import { getUserSlug, setUserSlug } from '../services/userSlug'
```

Add:
```typescript
import { useAuth } from '../hooks/useAuth'
```

**Step 2: Rewrite `GetStartedSection` to show login form when not authenticated**

Create a new `LoginForm` component inside the file:

```tsx
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
        autoFocus
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
```

**Step 3: Rewrite `GetStartedSection`**

The section now conditionally shows `LoginForm` (when not authed) or path cards (when authed):

```tsx
function GetStartedSection({
  user,
  sessions,
  onSelect,
  onResume,
  onDelete,
}: {
  user: User | null
  sessions: Session[]
  onSelect: (path: Path) => void
  onResume: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <section id="get-started" className="px-6 py-16 md:py-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-brand-text text-center mb-12">
          Ready to start?
        </h2>

        {!user ? (
          <LoginForm />
        ) : (
          <>
            {sessions.length > 0 && (
              <div className="max-w-2xl mx-auto mb-10 space-y-3">
                <h3 className="font-heading text-lg font-semibold text-brand-text mb-2">Continue where you left off</h3>
                {sessions.map(s => (
                  <SessionCard key={s.id} session={s} onResume={() => onResume(s.id)} onDelete={() => onDelete(s.id)} />
                ))}
              </div>
            )}

            <div className="flex gap-6 flex-wrap justify-center">
              <PathCard
                title="I'm building my own brand guide"
                description="Work directly with an AI brand strategist who'll draw out what you already know and turn it into polished brand language."
                details={['15-25 minute guided interview', 'Professional brand guide download', 'No design experience needed']}
                onClick={() => onSelect('entrepreneur')}
              />
              <PathCard
                title="I'm building a brand guide for someone else"
                description="Get guided through a research process: what questions to ask, what to observe, and how to synthesize your findings into professional brand language."
                details={['Structured research assignments', 'AI coaching through synthesis', 'Fellow review and approval flow', 'Reflection document for your portfolio']}
                onClick={() => onSelect('intern')}
              />
            </div>

            <p className="text-brand-text-muted text-center mt-8 text-[15px]">
              Your progress is saved automatically. Come back anytime.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
```

**Step 4: Rewrite the main `PathSelection` component**

Remove all slug-related state and the name modal. Add auth state and auto-redirect:

```tsx
export function PathSelection() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { createNewSession, loadSession, loadSessions, deleteSessionById, sessions, loadMostRecentSession, session } = useBrandGuideStore()
  const [loaded, setLoaded] = useState(false)

  // Load sessions when authenticated
  useEffect(() => {
    if (authLoading) return
    if (user) {
      loadSessions().then(() => setLoaded(true))
    } else {
      setLoaded(true)
    }
  }, [user, authLoading, loadSessions])

  // Auto-redirect if authenticated with an existing session
  useEffect(() => {
    if (!authLoading && user && loaded && sessions.length > 0) {
      // Load and redirect to most recent session
      const mostRecent = sessions[0]
      loadSession(mostRecent.id).then(() => {
        navigate(`/wizard/${mostRecent.currentSection}`, { replace: true })
      })
    }
  }, [authLoading, user, loaded, sessions, loadSession, navigate])

  const handleSelect = async (path: Path) => {
    await createNewSession(path)
    if (path === 'intern') {
      navigate('/intern-setup')
    } else {
      navigate('/wizard/basics')
    }
  }

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

  if (authLoading || !loaded) return null

  // If we have a user and sessions, the auto-redirect effect will fire.
  // Show the page meanwhile (marketing + path cards or login).

  return (
    <div className="min-h-screen bg-brand-bg font-body">
      <HeroSection />
      <WhySection />
      <HowItWorksSection />
      <WhatYouGetSection />
      <GetStartedSection
        user={user}
        sessions={sessions}
        onSelect={handleSelect}
        onResume={handleResume}
        onDelete={handleDelete}
      />

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

**Step 5: Add `User` type import**

Add at top of file:
```typescript
import type { User } from '@supabase/supabase-js'
```

**Step 6: Remove the name modal JSX entirely**

Delete the `pendingPath` modal block (lines ~340-364 in original).

**Step 7: Verify build compiles**

Run: `npx tsc -b`
Expected: No errors

**Step 8: Commit**

```bash
git add src/pages/PathSelection.tsx
git commit -m "feat: replace name modal with magic link login in PathSelection"
```

---

### Task 7: Update Routes in `App.tsx`

**Files:**
- Modify: `src/app.tsx`

**Step 1: Add AuthCallback import, remove StartPage**

Remove:
```typescript
import { StartPage } from './pages/StartPage'
```

Add:
```typescript
import { AuthCallback } from './pages/AuthCallback'
```

**Step 2: Update route definitions**

Replace the routes:

```tsx
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PathSelection />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/setup" element={<ApiKeySetup />} />
      <Route path="/intern-setup" element={<InternSetup />} />
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

Key changes:
- Removed `/start/:slug` route
- Added `/auth/callback` route

**Step 3: Verify build**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Commit**

```bash
git add src/app.tsx
git commit -m "feat: add auth callback route, remove /start/:slug route"
```

---

### Task 8: Add Auth Guard to `WizardShell`

**Files:**
- Modify: `src/components/layout/WizardShell.tsx`

**Step 1: Add auth check**

Import `useAuth`:
```typescript
import { useAuth } from '../../hooks/useAuth'
```

Add at the top of the component function, before existing hooks:
```typescript
const { user, isLoading: authLoading } = useAuth()
```

Update the redirect effect — redirect if not authenticated OR no session:
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    navigate('/')
  }
}, [authLoading, user, navigate])

useEffect(() => {
  if (!isLoading && !session) {
    navigate('/')
  }
}, [isLoading, session, navigate])
```

Update the loading check:
```typescript
if (authLoading || isLoading || !session) return null
```

**Step 2: Verify build**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/layout/WizardShell.tsx
git commit -m "feat: add auth guard to WizardShell"
```

---

### Task 9: Delete Dead Code

**Files:**
- Delete: `src/pages/StartPage.tsx`
- Delete: `src/services/userSlug.ts`

**Step 1: Verify no remaining references**

Run: `grep -r "userSlug\|getUserSlug\|setUserSlug\|StartPage" src/ --include="*.ts" --include="*.tsx" -l`

Expected: no results (all references already updated in previous tasks). If any remain, fix them first.

**Step 2: Delete the files**

```bash
rm src/pages/StartPage.tsx src/services/userSlug.ts
```

**Step 3: Verify build still passes**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass. If `brandGuideStore.test.ts` has issues because it mocked `userSlug`, verify the mock is no longer needed (the store no longer imports it).

**Step 5: Commit**

```bash
git add -u
git commit -m "chore: remove StartPage and userSlug — replaced by magic link auth"
```

---

### Task 10: Update Existing Tests

**Files:**
- Modify: `src/stores/__tests__/brandGuideStore.test.ts` (if needed)
- Modify: `src/services/__tests__/storage.test.ts` (if needed)

**Step 1: Check if store test mocks `userSlug`**

Look at the store test — it mocks `../../services/storage` entirely and doesn't mock `userSlug` (the import was in the actual store, not the test). After Task 5, the store no longer imports `userSlug`, so the test should work.

However, the store now imports `supabase` directly. Add a mock:

```typescript
vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
  },
}))
```

Add this mock at the top of `brandGuideStore.test.ts`, alongside the existing mocks.

**Step 2: Check if storage test needs updates**

The storage test mocks supabase entirely. The `createSession` function signature changed from `(path, userSlug?)` to `(path, userId?)` — but the test calls `createSession('entrepreneur')` without the second arg, so it should still pass.

**Step 3: Run all tests**

Run: `npx vitest run`
Expected: All 60+ tests pass

**Step 4: Commit (if changes were needed)**

```bash
git add src/stores/__tests__/brandGuideStore.test.ts src/services/__tests__/storage.test.ts
git commit -m "test: update mocks for auth-based session management"
```

---

### Task 11: Full Build + Type Check + Manual Smoke Test

**Step 1: Type check**

Run: `npx tsc -b`
Expected: No errors

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: All pass

**Step 3: Build**

Run: `npm run build`
Expected: Successful production build

**Step 4: Manual smoke test locally**

Run: `npm run dev`

Test these flows:
1. Visit `http://localhost:5173` — see marketing page with email login form in "Ready to start?" section
2. Enter an email, click "Send Magic Link" — see "Check your email" confirmation
3. (Check email inbox, click magic link — should redirect to `/auth/callback` then `/`)
4. After auth: if no session, see path selection cards; select entrepreneur → go to wizard
5. Refresh the page — should auto-resume in wizard, not show home page
6. Visit `/review/:token` — should work without auth (public)

**Step 5: Commit any fixes discovered during smoke test**

---

### Task 12: Update `vercel.json` and Deploy

**Files:**
- Verify: `vercel.json` (no changes needed — SPA routing already handles `/auth/callback`)

**Step 1: Verify vercel.json**

The existing config already routes all non-API paths to `index.html`:
```json
{ "source": "/((?!api/).*)", "destination": "/index.html" }
```
This covers `/auth/callback`. No changes needed.

**Step 2: Push to main for Vercel deploy**

After all tests pass and local smoke test is good, push to trigger Vercel auto-deploy.

**Step 3: Verify in production**

Visit `https://elevate-brand.vercel.app` and test the magic link flow end-to-end.

---

## Summary of File Changes

| Action | File |
|--------|------|
| Create | `supabase/migrations/001_add_user_id.sql` |
| Create | `src/hooks/useAuth.ts` |
| Create | `src/hooks/__tests__/useAuth.test.ts` |
| Create | `src/pages/AuthCallback.tsx` |
| Modify | `supabase/schema.sql` |
| Modify | `src/types/index.ts` |
| Modify | `src/services/storage.ts` |
| Modify | `src/stores/brandGuideStore.ts` |
| Modify | `src/pages/PathSelection.tsx` |
| Modify | `src/app.tsx` |
| Modify | `src/components/layout/WizardShell.tsx` |
| Modify | `src/stores/__tests__/brandGuideStore.test.ts` |
| Delete | `src/pages/StartPage.tsx` |
| Delete | `src/services/userSlug.ts` |
