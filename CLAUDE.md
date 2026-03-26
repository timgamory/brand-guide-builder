# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI-powered Brand Guide Builder — two-path (Entrepreneur + Intern) wizard that uses Claude to conduct adaptive brand interviews and generate professional brand guidelines.

## Commands

- `npm run dev` — Start dev server (Vite, port 5173)
- `npm run build` — Production build
- `npx vitest run` — Run all tests
- `npx vitest run src/path/to/test.ts` — Run single test file
- `npx tsc --noEmit` — Type check without emitting

## Architecture

**Stack**: Vite + React 18 + TypeScript + Tailwind CSS 4 + shadcn/ui + Zustand + Dexie.js + React Router + Anthropic JS SDK + docx

**Data flow**: Zustand stores (reactive UI) hydrate from and write-through to Dexie.js (IndexedDB). No backend. Anthropic API called directly from browser with user-provided API key stored in localStorage.

**Key patterns**:
- Section definitions in `src/data/sections.ts` drive both AI conversation (field keys = data to extract) and fallback form mode
- System prompts assembled dynamically in `src/services/prompts/builder.ts` from persona + context + section blocks
- AI responses for section reviews are structured JSON parsed by `parseSectionReview()` in `src/services/ai.ts`
- Documents generated client-side from approved drafts, not raw field data

**Two paths share**: layout, sidebar, section definitions, review UI, document generators. They differ in: AI persona, conversation strategy. Intern path (Phase 2) adds research tasks + reflections.

## Design Docs

- `docs/plans/2026-03-25-brand-guide-builder-design.md` — Full technical design
- `docs/plans/2026-03-25-phase-1-implementation.md` — Phase 1 implementation plan

## Visual Identity

Warm off-white background (#faf8f5), Fraunces (headings) + DM Sans (body), slate primary (#1e293b), coral accent (#e07a5f), sage accent (#81b29a). Custom theme tokens defined in `src/index.css` via Tailwind CSS 4 `@theme {}`.
