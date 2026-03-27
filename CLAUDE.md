# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI-powered Brand Guide Builder — two-path (Entrepreneur + Intern) wizard that uses Claude to conduct adaptive brand interviews and generate professional brand guidelines. Built by [Elevate Digital](https://elevatedigital.nyc). Deployed on Vercel with Supabase backend.

## Commands

- `npm run dev` — Start dev server (Vite, port 5173)
- `npm run build` — Production build (`tsc -b && vite build`)
- `npx vitest run` — Run all tests (60 tests across 12 files)
- `npx vitest run src/path/to/test.ts` — Run single test file
- `npx tsc -b` — Type check (use `-b` not `--noEmit` — matches the build command and catches unused variables)

## Architecture

**Stack**: Vite + React 18 + TypeScript + Tailwind CSS 4 + shadcn/ui + Zustand + Supabase + React Router + Anthropic JS SDK + docx

**Data flow**: Zustand stores (reactive UI) hydrate from and write-through to Supabase (Postgres). WizardShell hydrates the most recent session on mount so page refreshes work. Sessions are scoped to users via URL slugs (`/start/:slug`) stored in localStorage. Anthropic API called via Vercel Edge Function proxy (`api/chat.ts`) with server-side API key, or directly from browser if user has a local key in localStorage (model: `claude-sonnet-4-6`).

**Key patterns**:
- Section definitions in `src/data/sections.ts` drive both AI conversation (field keys = data to extract) and fallback form mode
- System prompts assembled dynamically in `src/services/prompts/builder.ts` from persona + context + section + research blocks
- AI responses for section reviews are structured JSON parsed by `parseSectionReview()` using brace-depth counting (`src/services/jsonExtract.ts`), not regex
- Documents generated client-side from approved drafts, not raw field data
- Research task templates in `src/data/researchTasks.ts` drive intern path task assignments
- Intern path has three modes per section: research → synthesis → review (with reflection)
- Markdown rendering in chat bubbles (`MessageBubble.tsx`) — supports `**bold**`
- Long conversations (>20 messages) are summarized transparently before API calls (`src/services/summarize.ts`), with re-summarization when 10+ new messages accumulate

**Two paths share**: layout, sidebar, section definitions, review UI, document generators. They differ in: AI persona, conversation strategy, and the intern path adds research tasks, synthesis coaching, reflections, and fellow review.

**Stores**: `brandGuideStore` (session/section state), `conversationStore` (messages + research tasks), `reflectionStore` (intern reflections), `reviewStore` (fellow review status)

**API proxy** (`api/chat.ts`): Vercel Edge Function with rate limiting (20 req/min per IP), origin validation, input validation (message count/size limits), sanitized error responses. The `ANTHROPIC_API_KEY` env var is set in Vercel project settings.

**Retry logic**: `sendMessage` in `src/services/ai.ts` retries with exponential backoff (1s, 2s, 4s) on network errors, rate limits, and 5xx responses. Does not retry on auth or validation errors.

## Design Docs

- `docs/plans/2026-03-25-brand-guide-builder-design.md` — Full technical design
- `docs/plans/2026-03-25-phase-1-implementation.md` — Phase 1: Entrepreneur core + storage
- `docs/plans/2026-03-26-phase-2-intern-path.md` — Phase 2: Intern path (research, synthesis, reflections, fellow review)
- `docs/plans/2026-03-26-phase-3-full-sections.md` — Phase 3: Full 11-section coverage
- `docs/plans/2026-03-26-phase-4-polish.md` — Phase 4: Skip, summarization, consistency check, presentation view
- `docs/plans/2026-03-26-phase-4-polish-design.md` — Phase 4 design rationale
- `docs/plans/2026-03-26-supabase-backend-design.md` — Supabase backend schema, RLS, and env vars

## Visual Identity

Warm off-white background (#faf8f5), Fraunces (headings) + DM Sans (body), slate primary (#1e293b), coral accent (#e07a5f), sage accent (#81b29a). Custom theme tokens defined in `src/index.css` via Tailwind CSS 4 `@theme {}`.

## Deployment

Vercel auto-deploys from `main` branch on GitHub (`timgamory/brand-guide-builder`). SPA routing handled by `vercel.json` rewrites. API proxy at `/api/chat`. Live at `elevate-brand.vercel.app`.

**Env vars** (set in Vercel project settings):
- `ANTHROPIC_API_KEY` — server-side, used by API proxy
- `VITE_SUPABASE_URL` — Supabase project URL (public, baked into client build)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (public, baked into client build)
