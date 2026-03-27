# Magic Link Auth + Session Identity Refactor

## Problem

Users accidentally create duplicate sessions every time they leave and return to the app. The current identity model uses a `user_slug` stored in localStorage, which is fragile (lost on cookie clear, doesn't work across devices) and doesn't prevent session proliferation.

## Decision

Use Supabase Magic Link authentication. One email = one real identity. Sessions are tied to `auth.uid()` instead of a localStorage slug. Returning authenticated users auto-resume their most recent guide.

## Authentication Flow

1. User visits `/` and sees the marketing page with an email input + "Send magic link" button in the Get Started section
2. Supabase sends a magic link email
3. User clicks the link, lands on `/auth/callback`
4. Supabase JS SDK exchanges the URL token for a session (stored automatically in localStorage by the SDK)
5. Redirect to `/` where auth-aware logic kicks in:
   - **Authenticated + has session:** redirect to `/wizard/{currentSection}`
   - **Authenticated + no session:** show path selection cards (entrepreneur/intern)
   - **Not authenticated:** show marketing content + login CTA

Returning users with a valid Supabase auth session skip the login page entirely.

## Session Model Changes

### Database

- Add `user_id UUID REFERENCES auth.users(id)` column to `sessions` table
- No unique constraint on `user_id` (multiple guides per user allowed, though default behavior is auto-resume most recent)
- Deprecate `user_slug` column (leave in DB, stop using in code)
- Update all queries from `WHERE user_slug = ?` to `WHERE user_id = auth.uid()`

### Row-Level Security

Replace permissive `ALLOW ALL` policies with proper auth-scoped policies:

```sql
-- Sessions: users can only access their own
CREATE POLICY "users_own_sessions" ON sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Conversations: scoped via session ownership
CREATE POLICY "users_own_conversations" ON conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sessions WHERE sessions.id = split_part(conversations.id, ':', 1)::uuid AND sessions.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM sessions WHERE sessions.id = split_part(conversations.id, ':', 1)::uuid AND sessions.user_id = auth.uid())
  );

-- Reflections: scoped via session ownership
CREATE POLICY "users_own_reflections" ON reflections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sessions WHERE sessions.id = reflections.id AND sessions.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM sessions WHERE sessions.id = reflections.id AND sessions.user_id = auth.uid())
  );

-- Reviews: scoped via session ownership OR public via review_token
CREATE POLICY "users_own_reviews" ON reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sessions WHERE sessions.id = reviews.id AND sessions.user_id = auth.uid())
  );

-- Reviews: fellows can read/write via token (anon access)
CREATE POLICY "review_token_access" ON reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sessions WHERE sessions.id = reviews.id AND sessions.review_token IS NOT NULL)
  );
```

Note: The review token policies need refinement at implementation time to ensure fellows can access review data without auth while maintaining security.

### Analytics Events

The `analytics_events` table stays permissive (insert-only, no user data exposed). Or scope to auth if preferred.

## Route Changes

| Route | Before | After |
|-------|--------|-------|
| `/` | PathSelection (marketing + path cards) | PathSelection (marketing + login CTA if unauthed, path cards if authed + no session, redirect if authed + session) |
| `/start/:slug` | Set localStorage slug, redirect | **Removed** |
| `/auth/callback` | N/A | **New** — handles magic link token exchange |
| `/wizard/*` | Loads most recent session by slug | Loads most recent session by `auth.uid()`, redirects to `/` if not authenticated |
| `/review/:token` | Public via token | **Unchanged** — stays public, no auth required |
| All other routes | No auth check | Protected by auth (redirect to `/` if not authenticated) |

## Component Changes

### New Components

- **`AuthCallback`** — handles `/auth/callback`. Calls `supabase.auth.getSession()`, redirects to `/`.
- **`AuthGate`** — wrapper component that checks Supabase auth state. Wraps protected routes. Redirects to `/` if not authenticated.
- **`useAuth` hook** — exposes `{ user, isLoading, signOut }` from Supabase auth state listener (`onAuthStateChange`).

### Modified Components

- **`PathSelection`** — three states based on auth:
  1. Not authenticated: marketing content + email input / magic link button (replaces path cards and name modal)
  2. Authenticated + no session: path selection cards (same UI as today minus name modal)
  3. Authenticated + has session: auto-redirect to wizard
- **`WizardShell`** — `loadMostRecentSession()` uses `auth.uid()` instead of `getUserSlug()`
- **`brandGuideStore`** — all session queries use `auth.uid()` from Supabase auth instead of `getUserSlug()`
- **`storage.ts`** — `listSessions()`, `createSession()` use `user_id` instead of `user_slug`

### Removed

- **`StartPage.tsx`** — deleted
- **`userSlug.ts`** — deleted
- **Name modal in PathSelection** — removed (identity from email)
- **localStorage `bgb-user-slug`** — no longer read or written

## What Stays Unchanged

- Wizard UI (all sections, chat, review flow)
- AI conversation logic and prompts
- Document generation
- Intern path (research, synthesis, reflections)
- Fellow review via `/review/:token`
- API proxy (`api/chat.ts`)
- Analytics tracking

## Supabase Dashboard Config

1. Enable Magic Link provider in Auth settings
2. Add redirect URLs:
   - `https://elevate-brand.vercel.app/auth/callback`
   - `http://localhost:5173/auth/callback`
3. Customize email template (optional — Supabase default works)

## Migration Strategy

- Existing sessions with `user_slug` but no `user_id` become orphaned — acceptable since there's no real user base yet
- Add `user_id` column as nullable initially
- New sessions always set `user_id`
- No data migration needed
