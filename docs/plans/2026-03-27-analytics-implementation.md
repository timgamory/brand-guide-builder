# Analytics Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add usage analytics to the Brand Guide Builder so the builder can understand AI effectiveness and where users drop off.

**Architecture:** Single `analytics_events` table in Supabase, one `track()` function on the client, direct Supabase writes from the API proxy. Fire-and-forget — analytics never block UX.

**Tech Stack:** Supabase (Postgres), TypeScript, Zustand, Vercel Edge Functions

---

### Task 1: Add `analytics_events` table to schema

**Files:**
- Modify: `supabase/schema.sql` (append after line 55)

**Step 1: Add the table, indexes, and RLS to schema.sql**

Append this SQL after the existing reviews RLS policy:

```sql
-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_session ON analytics_events (session_id);
CREATE INDEX idx_analytics_type_time ON analytics_events (event_type, created_at);
CREATE INDEX idx_analytics_time ON analytics_events (created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_analytics" ON analytics_events FOR ALL USING (true) WITH CHECK (true);
```

**Step 2: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add analytics_events table to schema"
```

> **Note for executor:** This SQL also needs to be run manually in Supabase Dashboard > SQL Editor against the live database. The schema.sql file is the source of truth but doesn't auto-migrate.

---

### Task 2: Create `track()` analytics service with tests

**Files:**
- Create: `src/services/analytics.ts`
- Create: `src/services/__tests__/analytics.test.ts`

**Step 1: Write the failing test**

Create `src/services/__tests__/analytics.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock supabase before importing analytics
const mockFrom = vi.fn()
vi.mock('../supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}))

// Mock brandGuideStore
vi.mock('../../stores/brandGuideStore', () => ({
  useBrandGuideStore: { getState: () => ({ session: { id: 'store-session-id' } }) },
}))

import { track } from '../analytics'

function mockInsert(error: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain.insert = () => Promise.resolve({ error })
  return chain
}

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts an event with explicit sessionId', () => {
    mockFrom.mockReturnValue(mockInsert())
    track('session.created', { path: 'entrepreneur' }, 'explicit-id')
    expect(mockFrom).toHaveBeenCalledWith('analytics_events')
  })

  it('falls back to store sessionId when not provided', () => {
    mockFrom.mockReturnValue(mockInsert())
    track('section.started', { sectionId: 'basics' })
    expect(mockFrom).toHaveBeenCalledWith('analytics_events')
  })

  it('does not throw when insert fails', () => {
    mockFrom.mockReturnValue(mockInsert({ message: 'db error' }))
    // Should not throw — fire and forget
    expect(() => track('session.created', { path: 'entrepreneur' })).not.toThrow()
  })

  it('does not throw when supabase call throws synchronously', () => {
    mockFrom.mockImplementation(() => { throw new Error('connection failed') })
    expect(() => track('session.created', { path: 'entrepreneur' })).not.toThrow()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/__tests__/analytics.test.ts`
Expected: FAIL — `../analytics` module not found

**Step 3: Write the implementation**

Create `src/services/analytics.ts`:

```typescript
import { supabase } from './supabase'
import { useBrandGuideStore } from '../stores/brandGuideStore'

export function track(
  eventType: string,
  payload: Record<string, unknown>,
  sessionId?: string,
): void {
  try {
    const resolvedSessionId = sessionId ?? useBrandGuideStore.getState().session?.id
    supabase.from('analytics_events').insert({
      session_id: resolvedSessionId ?? null,
      event_type: eventType,
      payload,
    }).then(() => {
      // Fire-and-forget: intentionally ignoring result
    })
  } catch {
    // Never let analytics break the app
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/__tests__/analytics.test.ts`
Expected: PASS (4 tests)

**Step 5: Run full test suite to check for regressions**

Run: `npx vitest run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/services/analytics.ts src/services/__tests__/analytics.test.ts
git commit -m "feat: add track() analytics service with fire-and-forget inserts"
```

---

### Task 3: Instrument store actions (session.created, section.approved, section.skipped, review.submitted)

**Files:**
- Modify: `src/stores/brandGuideStore.ts`

**Step 1: Add import and track calls**

At the top of `src/stores/brandGuideStore.ts`, add:

```typescript
import { track } from '../services/analytics'
```

Then add `track()` calls inside these store actions:

**In `createNewSession`** (after `set({ session, isLoading: false })`):
```typescript
track('session.created', { path, userSlug: userSlug ?? null }, session.id)
```

**In `approveSectionDraft`** (after the `set()` call, before the closing `}`):
```typescript
track('section.approved', {
  sectionId,
  draftLength: draft.length,
})
```

**In `skipSection`** (before the `await get().nextSection()` call):
```typescript
track('section.skipped', { sectionId })
```

**In `submitForReview`** (before `return reviewToken`):
```typescript
const approvedCount = Object.values(session.sections).filter(s => s.status === 'approved').length
track('review.submitted', { sectionsApproved: approvedCount })
```

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass. The existing `brandGuideStore.test.ts` tests should still pass because `track()` is fire-and-forget and the analytics module mock will be auto-handled (or we may need to add a mock — see next step).

**Step 3: If brandGuideStore tests fail**, add this mock at the top of `src/stores/__tests__/brandGuideStore.test.ts`:

```typescript
vi.mock('../../services/analytics', () => ({
  track: vi.fn(),
}))
```

**Step 4: Run tests again to confirm**

Run: `npx vitest run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/stores/brandGuideStore.ts src/stores/__tests__/brandGuideStore.test.ts
git commit -m "feat: instrument store actions with analytics tracking"
```

---

### Task 4: Instrument WizardSection (section.started, message.sent)

**Files:**
- Modify: `src/pages/WizardSection.tsx`

**Step 1: Add import**

At the top of `WizardSection.tsx`, add:

```typescript
import { track } from '../services/analytics'
```

**Step 2: Add section.started tracking**

Inside the first `useEffect` that fires on section change (the one at line ~40 that calls `loadConversation`), add after `setApiError(false)`:

```typescript
track('section.started', { sectionId })
```

**Step 3: Add message.sent tracking**

Inside `handleSend`, right after `await addMessage(userMsg)` (line ~93):

```typescript
track('message.sent', { sectionId, role: 'user', length: text.length })
```

And right after the AI response is added (after `await addMessage({ role: 'assistant', content: response })` at line ~139, and similarly after the draft message at line ~135):

```typescript
track('message.sent', { sectionId, role: 'assistant', length: response.length })
```

**Step 4: Add summary.triggered tracking**

Inside `handleSend`, after `summarizedAtCount = allMessages.length` (line ~114):

```typescript
track('summary.triggered', { sectionId, messageCount: allMessages.length })
```

**Step 5: Add revision tracking to section.approved**

The `section.approved` event in the store doesn't have `messageCount` or `revisionNumber`. We can enrich it by tracking from WizardSection instead. Actually, the store already tracks `section.approved` — so let's add `messageCount` context.

In `handleApprove`, before `await approveSectionDraft(sectionId, draft)`:

```typescript
const messageCount = useConversationStore.getState().messages.length
track('section.approved', { sectionId, messageCount, draftLength: draft.length })
```

Wait — this would double-fire with the store's `section.approved`. **Remove the `track('section.approved', ...)` from the store** (Task 3) and put it only here in WizardSection where we have access to `messageCount`. Update the store's `approveSectionDraft` to NOT track this event.

**Step 6: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/pages/WizardSection.tsx src/stores/brandGuideStore.ts
git commit -m "feat: instrument WizardSection with analytics tracking"
```

---

### Task 5: Instrument GuidePreview (document.downloaded) and FellowReview (review.completed)

**Files:**
- Modify: `src/pages/GuidePreview.tsx`
- Modify: `src/pages/FellowReview.tsx`

**Step 1: Add import to GuidePreview**

```typescript
import { track } from '../services/analytics'
```

**Step 2: Track document downloads**

In `GuidePreview.tsx`, wrap the download button handlers. Replace the inline `onClick` for the markdown download button (line ~96):

```typescript
onClick={() => {
  downloadMarkdown(session)
  const sectionsApproved = approvedSections.length
  const sectionsSkipped = SECTIONS.filter(s => session.sections[s.id]?.status === 'skipped').length
  track('document.downloaded', { format: 'md', sectionsApproved, sectionsSkipped })
}}
```

Replace the docx download button (line ~102):

```typescript
onClick={() => {
  downloadDocx(session)
  const sectionsApproved = approvedSections.length
  const sectionsSkipped = SECTIONS.filter(s => session.sections[s.id]?.status === 'skipped').length
  track('document.downloaded', { format: 'docx', sectionsApproved, sectionsSkipped })
}}
```

**Step 3: Add import to FellowReview**

```typescript
import { track } from '../services/analytics'
```

**Step 4: Track review.completed**

In `FellowReview.tsx`, in the `onAction` handler passed to each `ReviewSection` (line ~126):

```typescript
onAction={(status, notes) => {
  setReviewStatus(section.id, status, notes)
  track('review.completed', {
    sectionId: section.id,
    status,
    hasNotes: !!notes,
  }, session.id)
}}
```

**Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/pages/GuidePreview.tsx src/pages/FellowReview.tsx
git commit -m "feat: instrument GuidePreview and FellowReview with analytics"
```

---

### Task 6: Instrument intern-specific events (research.task_completed, reflection.saved)

**Files:**
- Modify: `src/stores/conversationStore.ts`
- Modify: `src/stores/reflectionStore.ts`

**Step 1: Add import to conversationStore**

```typescript
import { track } from '../services/analytics'
```

**Step 2: Track research.task_completed**

In `toggleTask`, after the `set({ researchTasks: updated })` call, add:

```typescript
const task = updated.find(t => t.id === taskId)
if (task?.completed) {
  track('research.task_completed', {
    sectionId: currentSectionId,
    taskId,
    hasNotes: !!task.notes,
  }, currentSessionId)
}
```

Only track when toggled ON (completed = true), not when toggled off.

**Step 3: Add import to reflectionStore**

```typescript
import { track } from '../services/analytics'
```

**Step 4: Track reflection.saved**

In `setReflection`, after `await saveReflection(...)`:

```typescript
track('reflection.saved', {
  sectionId,
  length: text.length,
}, currentSessionId)
```

**Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass. If `reflectionStore.test.ts` fails, add a mock:

```typescript
vi.mock('../../services/analytics', () => ({
  track: vi.fn(),
}))
```

**Step 6: Commit**

```bash
git add src/stores/conversationStore.ts src/stores/reflectionStore.ts src/stores/__tests__/reflectionStore.test.ts
git commit -m "feat: instrument intern events (research tasks, reflections)"
```

---

### Task 7: Instrument API proxy with analytics

**Files:**
- Modify: `api/chat.ts`

**Step 1: Add Supabase client initialization**

At the top of `api/chat.ts`, after the existing imports/config:

```typescript
import { createClient } from '@supabase/supabase-js'

function getAnalyticsClient() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function trackEvent(sessionId: string | null, eventType: string, payload: Record<string, unknown>) {
  try {
    const client = getAnalyticsClient()
    if (!client) return
    client.from('analytics_events').insert({
      session_id: sessionId,
      event_type: eventType,
      payload,
    }).then(() => {
      // Fire-and-forget
    })
  } catch {
    // Never let analytics break the proxy
  }
}

function hashIp(ip: string): string {
  // Simple hash — not crypto-grade, just for grouping
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}
```

**Step 2: Read X-Session-Id header**

Inside the `handler` function, after `const ip = getClientIp(req)`, add:

```typescript
const sessionId = req.headers.get('x-session-id') || null
```

**Step 3: Track rate limit hits**

Inside the `if (isRateLimited(ip))` block, before the return:

```typescript
trackEvent(sessionId, 'api.rate_limited', { ipHash: hashIp(ip) })
```

**Step 4: Track API errors**

After the `if (!response.ok)` block (line ~133), before each error return, track the error. Replace the error handling block:

```typescript
if (!response.ok) {
  const status = response.status
  trackEvent(sessionId, 'api.error', { statusCode: status, errorType: status === 429 ? 'rate_limited' : status === 401 ? 'auth' : 'server' })
  if (status === 429) return errorResponse('AI service is busy. Please try again shortly.', 429)
  if (status === 401) return errorResponse('API configuration error', 500)
  return errorResponse('AI service error', 502)
}
```

**Step 5: Track successful requests**

The streaming response makes it tricky to get token counts from the response (they come at the end of the stream). For now, track the request itself without token counts — we can add token tracking later by parsing the `message_stop` event.

Before `return new Response(response.body, ...)`:

```typescript
trackEvent(sessionId, 'api.request', { model: 'claude-sonnet-4-6' })
```

**Step 6: Send X-Session-Id from client**

Modify `src/services/ai.ts` in the `sendViaProxy` function. Add the session ID header to the fetch call. After `'Content-Type': 'application/json'`:

```typescript
headers: {
  'Content-Type': 'application/json',
  'X-Session-Id': useBrandGuideStore.getState().session?.id ?? '',
},
```

Add the import at the top of `ai.ts`:

```typescript
import { useBrandGuideStore } from '../stores/brandGuideStore'
```

**Step 7: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 8: Commit**

```bash
git add api/chat.ts src/services/ai.ts
git commit -m "feat: instrument API proxy with analytics tracking"
```

> **Note for executor:** The `SUPABASE_SERVICE_ROLE_KEY` env var must be added to Vercel project settings. Get it from Supabase Dashboard > Settings > API > service_role key. Also add `VITE_SUPABASE_URL` to the proxy's env if not already available (it should be, since it's already set for the client build).

---

### Task 8: Type check and final validation

**Files:** None (validation only)

**Step 1: Type check**

Run: `npx tsc -b`
Expected: No errors

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Build**

Run: `npm run build`
Expected: Clean build with no errors

**Step 4: Commit any fixes if needed**

---

### Task 9: Manual smoke test

**Files:** None (manual testing)

**Step 1: Run dev server**

Run: `npm run dev`

**Step 2: Create a new session and verify `session.created` event**

Open the app, create a new entrepreneur session. Check Supabase Dashboard > Table Editor > analytics_events for a `session.created` row.

**Step 3: Enter a section and verify `section.started` event**

Navigate to the basics section. Check for a `section.started` row.

**Step 4: Send a message and verify `message.sent` events**

Send a message in the chat. Check for `message.sent` rows (one for user, one for assistant).

**Step 5: Verify events are fire-and-forget**

Open browser DevTools Network tab. Analytics inserts should not block the UI. No errors should appear in the console related to analytics.
