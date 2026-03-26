# Supabase Backend — Design

Replace IndexedDB (Dexie.js) with Supabase Postgres for persistent, cross-device data storage.

## Motivation

User data currently lives in browser-local IndexedDB. Clearing browser data, switching devices, or using incognito mode loses all work. Interns can lose hours of progress. Supabase provides server-side persistence with zero auth complexity.

## Database Schema

Four tables matching the current Dexie schema:

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL CHECK (path IN ('entrepreneur', 'intern')),
  brand_data JSONB NOT NULL DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '{}',
  current_section TEXT NOT NULL DEFAULT 'basics',
  intern_meta JSONB,
  review_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,  -- format: "sessionId:sectionId"
  messages JSONB NOT NULL DEFAULT '[]',
  research_tasks JSONB,
  conversation_summary TEXT,
  summarized_at_count INTEGER
);

CREATE TABLE reflections (
  id UUID PRIMARY KEY,  -- = session id
  entries JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY,  -- = session id
  sections JSONB NOT NULL DEFAULT '{}'
);
```

## Row Level Security

No auth. RLS enabled with permissive policies (allow all via anon key). UUIDs are unguessable — same security model as the existing review token approach.

## Storage Layer

Replace Dexie implementation in `src/services/storage.ts` with Supabase JS client. Same 10 exported function signatures — nothing upstream changes.

## Environment Variables

- `VITE_SUPABASE_URL` — project URL (client-side, safe)
- `VITE_SUPABASE_ANON_KEY` — anon key (client-side, safe by design)
- Both added to Vercel env vars for production

## What Doesn't Change

- Zustand stores, React components, pages
- API proxy, types, prompts, data files
- Test mocks (they mock storage.ts)
