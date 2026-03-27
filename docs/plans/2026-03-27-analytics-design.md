# Analytics & Usage Tracking Design

**Date:** 2026-03-27
**Goal:** Track how people use the Brand Guide Builder and how well the AI conversations work, using a single Supabase events table queried via raw SQL.

## Core Questions

1. **AI effectiveness** — Are conversations producing good brand guides, or are people just clicking through?
2. **Drop-off / friction** — Where do people get stuck or abandon?

## Schema

### `analytics_events` table

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID (PK, default gen_random_uuid()) | Row identity |
| `session_id` | UUID | Which session (no FK constraint — allows proxy to log without valid session) |
| `event_type` | TEXT | Event name (e.g. `section.started`, `message.sent`) |
| `payload` | JSONB | Event-specific data |
| `created_at` | TIMESTAMPTZ (default now()) | When it happened |

**Indexes:** `(session_id)`, `(event_type, created_at)`, `(created_at)`

**RLS:** Same open policy as existing tables (anon key access).

## Event Types

### Funnel / drop-off

| Event | Payload | Answers |
|---|---|---|
| `session.created` | `{ path }` | How many start, which path (join to sessions for userSlug) |
| `section.started` | `{ sectionId }` | Which sections get attempted |
| `section.approved` | `{ sectionId, messageCount, draftLength, revisionNumber }` | Completion + effort to get there |
| `section.skipped` | `{ sectionId }` | What people skip |
| `document.downloaded` | `{ format, sectionsApproved, sectionsSkipped }` | Who finishes, in what format |
| `review.submitted` | `{ sectionsApproved }` | Intern submission rate |
| `review.completed` | `{ sectionId, status, hasNotes }` | Fellow engagement |

### AI effectiveness

| Event | Payload | Answers |
|---|---|---|
| `message.sent` | `{ sectionId, role, length }` | Conversation volume per section |
| `summary.triggered` | `{ sectionId, messageCount }` | Which sections need long conversations |

Revision tracking: `revisionNumber` in `section.approved` payload counts how many times the user requested changes after an AI draft was produced. Higher = AI struggling with that section.

### API-level (from edge proxy)

| Event | Payload | Answers |
|---|---|---|
| `api.request` | `{ sectionId, inputTokens, outputTokens, latencyMs, model }` | Cost, speed, usage |
| `api.error` | `{ sectionId, statusCode, errorType }` | Reliability |
| `api.rate_limited` | `{ ipHash }` | Abuse / capacity issues |

### Intern-specific

| Event | Payload | Answers |
|---|---|---|
| `research.task_completed` | `{ sectionId, taskId, hasNotes }` | Research engagement |
| `reflection.saved` | `{ sectionId, length }` | Reflection quality signal |

## Instrumentation

### Client-side: `src/services/analytics.ts`

Single exported function:

```typescript
track(eventType: string, payload: object, sessionId?: string)
```

- Grabs `sessionId` from `brandGuideStore` if not passed
- Inserts row into `analytics_events` via Supabase client
- **Fire-and-forget** — no `await`, no error surfacing. Failed analytics writes never break UX.
- No batching or queue. Low event volume (dozens per session).

### Instrumentation points (client)

| Store / Component | Action | Event |
|---|---|---|
| `brandGuideStore.createNewSession` | After session created | `session.created` |
| `WizardSection` (on mount) | Section loaded | `section.started` |
| `brandGuideStore.approveSectionDraft` | Draft approved | `section.approved` |
| `brandGuideStore.skipSection` | Section skipped | `section.skipped` |
| `WizardSection.handleSendMessage` | After message added | `message.sent` |
| `summarize.ts` | After summary generated | `summary.triggered` |
| `GuidePreview` download handlers | Download clicked | `document.downloaded` |
| `brandGuideStore.submitForReview` | Review submitted | `review.submitted` |
| `FellowReview` section handler | Fellow reviews section | `review.completed` |
| `conversationStore.toggleTask` | Research task toggled on | `research.task_completed` |
| `reflectionStore.setReflection` | Reflection saved | `reflection.saved` |

### API proxy: `api/chat.ts`

- Writes `api.request`, `api.error`, `api.rate_limited` directly to Supabase
- Uses `SUPABASE_SERVICE_ROLE_KEY` (new env var) to bypass RLS
- Client passes `X-Session-Id` and `X-Section-Id` headers so proxy can associate events with sessions and sections
- Token counts not yet available (streaming mode — `usage` object comes in final SSE event which the proxy doesn't parse; tracked as future improvement)

## Example Queries

### Drop-off funnel

```sql
SELECT event_type, COUNT(DISTINCT session_id)
FROM analytics_events
WHERE event_type IN ('session.created', 'section.started', 'section.approved', 'document.downloaded')
GROUP BY event_type;
```

### Hardest sections (most messages/revisions)

```sql
SELECT payload->>'sectionId' as section,
       AVG((payload->>'messageCount')::int) as avg_messages,
       AVG((payload->>'revisionNumber')::int) as avg_revisions
FROM analytics_events
WHERE event_type = 'section.approved'
GROUP BY payload->>'sectionId';
```

### AI cost per session

```sql
SELECT session_id,
       SUM((payload->>'inputTokens')::int) as total_input,
       SUM((payload->>'outputTokens')::int) as total_output,
       AVG((payload->>'latencyMs')::int) as avg_latency
FROM analytics_events
WHERE event_type = 'api.request'
GROUP BY session_id;
```

### Abandoned sessions

```sql
SELECT e.session_id, s.path,
       MAX(e.created_at) as last_activity,
       COUNT(*) FILTER (WHERE e.event_type = 'section.approved') as sections_done
FROM analytics_events e
JOIN sessions s ON s.id = e.session_id
WHERE e.session_id NOT IN (
  SELECT session_id FROM analytics_events WHERE event_type = 'document.downloaded'
)
GROUP BY e.session_id, s.path;
```

## Not In Scope

- No real-time dashboards or admin UI (future work)
- No data retention / cleanup policy (low volume — dozens of events per session)
- No PII in events — `userSlug` lives in sessions table, not repeated. IP hashed in rate limit events.
- No batching or client-side queue — direct inserts are sufficient at this scale
