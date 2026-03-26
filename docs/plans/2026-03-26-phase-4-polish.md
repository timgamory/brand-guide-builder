# Phase 4: Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four polish features: optional section skip, long conversation summarization, cross-section consistency check, and presentation view.

**Architecture:** Skip adds a new `SectionStatus` value and UI button. Summarization adds a helper function called transparently in `handleSend`. Consistency check adds a new AI service function and UI card on the preview page. Presentation view adds a new route and full-screen component.

**Tech Stack:** Same as Phase 1-3 — Vite, React 18, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand, Dexie.js, Anthropic JS SDK, Vitest

---

## Task 1: Optional Section Skip

Add `'skipped'` to `SectionStatus` and a skip button for optional sections.

**Files:**
- Modify: `src/types/index.ts` — add `'skipped'` to `SectionStatus`
- Modify: `src/pages/WizardSection.tsx` — add skip button for optional sections
- Modify: `src/components/layout/Sidebar.tsx` — show dash icon for skipped sections
- Modify: `src/stores/brandGuideStore.ts` — add `skipSection` action

**Step 1: Update `SectionStatus` type**

In `src/types/index.ts`, change line 25:

```ts
export type SectionStatus = 'not_started' | 'in_progress' | 'approved' | 'skipped'
```

**Step 2: Add `skipSection` to brand guide store**

In `src/stores/brandGuideStore.ts`, add to the type:

```ts
skipSection: (sectionId: string) => Promise<void>
```

Implementation:

```ts
skipSection: async (sectionId) => {
  const { session } = get()
  if (!session) return
  const sections = {
    ...session.sections,
    [sectionId]: { ...session.sections[sectionId], status: 'skipped' as const },
  }
  await updateSession(session.id, { sections })
  set({ session: { ...session, sections, updatedAt: new Date().toISOString() } })
  // Advance to next section
  await get().nextSection()
},
```

**Step 3: Add skip button to WizardSection**

In `src/pages/WizardSection.tsx`, add a skip handler:

```ts
const handleSkip = useCallback(async () => {
  if (!sectionId) return
  await useBrandGuideStore.getState().skipSection(sectionId)
  const next = useBrandGuideStore.getState().session?.currentSection
  if (next) navigate(`/wizard/${next}`)
}, [sectionId, navigate])
```

In the section header area (the `<div className="px-6 pt-6 pb-4 border-b ...">` block), add a skip button next to the optional badge:

```tsx
{section.optional && session.sections[sectionId ?? '']?.status !== 'in_progress' && (
  <button
    onClick={handleSkip}
    className="text-sm text-brand-text-faint hover:text-brand-text transition-colors"
  >
    Skip this section
  </button>
)}
```

**Step 4: Update Sidebar for skipped status**

In `src/components/layout/Sidebar.tsx`, update the `StatusIcon` component:

```tsx
function StatusIcon({ status }: { status: SectionStatus }) {
  if (status === 'approved') {
    return <span className="text-brand-accent-sage text-xs">&#10003;</span>
  }
  if (status === 'in_progress') {
    return <span className="text-brand-accent-coral text-xs">&#9679;</span>
  }
  if (status === 'skipped') {
    return <span className="text-brand-text-faint text-xs">&mdash;</span>
  }
  return <span className="text-brand-text-faint text-xs">&#9675;</span>
}
```

**Step 5: Run type check and tests**

Run: `npx tsc --noEmit`
Run: `npx vitest run`

**Step 6: Commit**

```bash
git add src/types/index.ts src/pages/WizardSection.tsx src/components/layout/Sidebar.tsx src/stores/brandGuideStore.ts
git commit -m "feat: add optional section skip for social media and photography"
```

---

## Task 2: Long Conversation Summarization

Add a `conversationSummary` field to the Conversation type and a summarization function that transparently compresses long conversations before sending to the API.

**Files:**
- Modify: `src/types/index.ts` — add `conversationSummary?: string` to `Conversation`
- Create: `src/services/summarize.ts` — summarization function
- Create: `src/services/__tests__/summarize.test.ts` — test
- Modify: `src/pages/WizardSection.tsx` — use summarization in `handleSend`

**Step 1: Update `Conversation` type**

In `src/types/index.ts`, add to the `Conversation` type:

```ts
export type Conversation = {
  id: string
  messages: Message[]
  researchTasks?: ResearchTask[]
  conversationSummary?: string
}
```

**Step 2: Write the summarize test**

```ts
// src/services/__tests__/summarize.test.ts
import { describe, it, expect } from 'vitest'
import { prepareMessagesForApi } from '../summarize'
import type { Message } from '../../types'

function makeMessages(count: number): Message[] {
  return Array.from({ length: count }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: `Message ${i + 1}`,
  }))
}

describe('prepareMessagesForApi', () => {
  it('returns all messages when count <= 20', () => {
    const msgs = makeMessages(15)
    const result = prepareMessagesForApi(msgs, undefined)
    expect(result).toEqual(msgs)
  })

  it('prepends summary and keeps recent 10 when count > 20 and summary exists', () => {
    const msgs = makeMessages(25)
    const result = prepareMessagesForApi(msgs, 'This is a summary')
    expect(result.length).toBe(11) // 1 summary + 10 recent
    expect(result[0].role).toBe('assistant')
    expect(result[0].content).toContain('summary')
    expect(result[result.length - 1].content).toBe('Message 25')
  })

  it('truncates to most recent 20 when count > 20 and no summary', () => {
    const msgs = makeMessages(25)
    const result = prepareMessagesForApi(msgs, undefined)
    expect(result.length).toBe(20)
    expect(result[0].content).toBe('Message 6')
    expect(result[result.length - 1].content).toBe('Message 25')
  })
})
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run src/services/__tests__/summarize.test.ts`
Expected: FAIL

**Step 4: Implement summarize module**

```ts
// src/services/summarize.ts
import type { Message } from '../types'
import { sendMessage } from './ai'

const MAX_MESSAGES = 20
const KEEP_RECENT = 10

export function prepareMessagesForApi(messages: Message[], existingSummary: string | undefined): Message[] {
  if (messages.length <= MAX_MESSAGES) return messages

  if (existingSummary) {
    const summaryMessage: Message = {
      role: 'assistant',
      content: `[Summary of our conversation so far: ${existingSummary}]`,
    }
    const recent = messages.slice(-KEEP_RECENT)
    return [summaryMessage, ...recent]
  }

  // Fallback: hard truncation to most recent 20
  return messages.slice(-MAX_MESSAGES)
}

export async function generateSummary(messages: Message[]): Promise<string> {
  const toSummarize = messages.slice(0, -KEEP_RECENT)
  const conversationText = toSummarize
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n')

  const systemPrompt = 'Summarize this brand interview conversation in 3-5 concise bullet points. Focus on key decisions made, preferences stated, and information gathered. Return ONLY the bullet points, no other text.'

  const summary = await sendMessage(
    systemPrompt,
    [{ role: 'user', content: conversationText }],
    () => {}, // no streaming needed
  )

  return summary
}

export function needsSummarization(messages: Message[], existingSummary: string | undefined): boolean {
  return messages.length > MAX_MESSAGES && !existingSummary
}
```

**Step 5: Run test to verify pass**

Run: `npx vitest run src/services/__tests__/summarize.test.ts`
Expected: PASS

**Step 6: Integrate into WizardSection**

In `src/pages/WizardSection.tsx`, import the new functions:

```ts
import { prepareMessagesForApi, generateSummary, needsSummarization } from '../services/summarize'
```

In `handleSend`, after building the `allMessages` array and before calling `sendMessage`, add:

```ts
// Summarize long conversations
const convo = await getConversation(session.id, sectionId)
let summary = convo?.conversationSummary

if (needsSummarization(allMessages, summary)) {
  try {
    summary = await generateSummary(allMessages)
    await saveConversation(session.id, sectionId, {
      messages: useConversationStore.getState().messages,
      researchTasks: useConversationStore.getState().researchTasks,
      conversationSummary: summary,
    })
  } catch {
    // If summarization fails, proceed without it
  }
}

const apiMessages = prepareMessagesForApi(allMessages, summary)
const response = await sendMessage(systemPrompt, apiMessages, setStreamingContent)
```

You'll need to import `getConversation` and `saveConversation` from `../services/storage`.

**Step 7: Run type check and tests**

Run: `npx tsc --noEmit`
Run: `npx vitest run`

**Step 8: Commit**

```bash
git add src/types/index.ts src/services/summarize.ts src/services/__tests__/summarize.test.ts src/pages/WizardSection.tsx
git commit -m "feat: add long conversation summarization for context management"
```

---

## Task 3: Cross-Section Consistency Check

Add a consistency check feature to the guide preview page.

**Files:**
- Create: `src/services/consistencyCheck.ts` — AI-powered consistency checker
- Create: `src/services/__tests__/consistencyCheck.test.ts` — test for response parsing
- Modify: `src/pages/GuidePreview.tsx` — add check button and results card

**Step 1: Write the test**

```ts
// src/services/__tests__/consistencyCheck.test.ts
import { describe, it, expect } from 'vitest'
import { parseConsistencyResult } from '../consistencyCheck'

describe('parseConsistencyResult', () => {
  it('parses consistent result', () => {
    const json = '{"issues": [], "verdict": "consistent"}'
    const result = parseConsistencyResult(json)
    expect(result).toEqual({ issues: [], verdict: 'consistent' })
  })

  it('parses result with issues', () => {
    const json = '{"issues": [{"sections": ["story", "values"], "description": "Tone shifts from casual to formal"}], "verdict": "minor_issues"}'
    const result = parseConsistencyResult(json)
    expect(result!.issues).toHaveLength(1)
    expect(result!.verdict).toBe('minor_issues')
  })

  it('returns null for invalid JSON', () => {
    expect(parseConsistencyResult('not json')).toBeNull()
  })

  it('extracts JSON from surrounding text', () => {
    const text = 'Here is my analysis:\n{"issues": [], "verdict": "consistent"}\nDone.'
    const result = parseConsistencyResult(text)
    expect(result).toEqual({ issues: [], verdict: 'consistent' })
  })
})
```

**Step 2: Run test to verify fail**

Run: `npx vitest run src/services/__tests__/consistencyCheck.test.ts`

**Step 3: Implement consistency check**

```ts
// src/services/consistencyCheck.ts
import type { Session } from '../types'
import { SECTIONS } from '../data/sections'
import { sendMessage } from './ai'

export type ConsistencyIssue = {
  sections: string[]
  description: string
}

export type ConsistencyResult = {
  issues: ConsistencyIssue[]
  verdict: 'consistent' | 'minor_issues' | 'needs_attention'
}

const SECTION_TITLES: Record<string, string> = {
  basics: 'Introduction', story: 'Brand Story', values: 'Brand Values',
  personality: 'Brand Personality', visuals_colors: 'Color Palette',
  visuals_logo: 'Logo & Name', typography: 'Typography',
  messaging: 'Key Messages', application: 'Brand in Use',
  social_media: 'Social Media', photography: 'Photography & Imagery',
}

export function parseConsistencyResult(text: string): ConsistencyResult | null {
  try {
    const parsed = JSON.parse(text)
    if (parsed.verdict) return parsed
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.verdict) return parsed
      } catch { /* fall through */ }
    }
  }
  return null
}

export async function checkConsistency(session: Session): Promise<ConsistencyResult> {
  const drafts: string[] = []
  for (const section of SECTIONS) {
    const state = session.sections[section.id]
    if (state?.status === 'approved' && state.approvedDraft) {
      const title = SECTION_TITLES[section.id] || section.title
      drafts.push(`## ${title}\n\n${state.approvedDraft}`)
    }
  }

  const systemPrompt = `You are a brand consistency reviewer. Review these brand guide sections together and identify inconsistencies: tone shifts between sections, contradictory claims, terminology that changes (e.g., "customers" in one section and "community members" in another), or visual decisions that clash with personality/values.

Return ONLY JSON with NO markdown fences:
{"issues": [{"sections": ["sectionId1", "sectionId2"], "description": "What's inconsistent"}], "verdict": "consistent" | "minor_issues" | "needs_attention"}`

  const response = await sendMessage(
    systemPrompt,
    [{ role: 'user', content: drafts.join('\n\n---\n\n') }],
    () => {},
  )

  return parseConsistencyResult(response) ?? { issues: [], verdict: 'consistent' }
}
```

**Step 4: Run test to verify pass**

Run: `npx vitest run src/services/__tests__/consistencyCheck.test.ts`

**Step 5: Add consistency check UI to GuidePreview**

In `src/pages/GuidePreview.tsx`, add state and handler:

```ts
import { checkConsistency, type ConsistencyResult } from '../services/consistencyCheck'

// Inside GuidePreview:
const [consistencyResult, setConsistencyResult] = useState<ConsistencyResult | null>(null)
const [isChecking, setIsChecking] = useState(false)

const handleCheckConsistency = async () => {
  if (!session) return
  setIsChecking(true)
  try {
    const result = await checkConsistency(session)
    setConsistencyResult(result)
  } catch {
    // Silently fail — not critical
  }
  setIsChecking(false)
}
```

Add a "Check Consistency" button next to the download buttons (only visible when >= 3 sections approved):

```tsx
{approvedSections.length >= 3 && (
  <button
    onClick={handleCheckConsistency}
    disabled={isChecking}
    className="px-5 py-2.5 rounded-xl border border-brand-border-dark bg-white text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors disabled:opacity-50"
  >
    {isChecking ? 'Checking...' : 'Check Consistency'}
  </button>
)}
```

Add the results card above the guide content:

```tsx
{consistencyResult && (
  <div className={`rounded-2xl border p-6 mb-6 ${
    consistencyResult.verdict === 'consistent'
      ? 'bg-emerald-50 border-emerald-200'
      : 'bg-amber-50 border-amber-200'
  }`}>
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-heading text-lg font-semibold text-brand-text">
        {consistencyResult.verdict === 'consistent' ? 'Looking Good' : 'Consistency Notes'}
      </h3>
      <button
        onClick={() => setConsistencyResult(null)}
        className="text-brand-text-faint hover:text-brand-text text-sm"
      >
        Dismiss
      </button>
    </div>
    {consistencyResult.verdict === 'consistent' ? (
      <p className="text-[15px] text-brand-text-secondary">Your brand guide is internally consistent across all sections.</p>
    ) : (
      <ul className="space-y-2">
        {consistencyResult.issues.map((issue, i) => (
          <li key={i} className="text-[15px] text-brand-text-secondary">
            <span className="font-medium">{issue.sections.join(' / ')}:</span> {issue.description}
          </li>
        ))}
      </ul>
    )}
  </div>
)}
```

**Step 6: Run type check and tests**

Run: `npx tsc --noEmit`
Run: `npx vitest run`

**Step 7: Commit**

```bash
git add src/services/consistencyCheck.ts src/services/__tests__/consistencyCheck.test.ts src/pages/GuidePreview.tsx
git commit -m "feat: add cross-section consistency check on guide preview"
```

---

## Task 4: Presentation View

Full-screen slide-style view for the intern-fellow review meeting.

**Files:**
- Create: `src/pages/PresentationView.tsx`
- Modify: `src/app.tsx` — add `/presentation` route
- Modify: `src/pages/GuidePreview.tsx` — add "Present to Fellow" button (intern only)

**Step 1: Create PresentationView page**

```tsx
// src/pages/PresentationView.tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { SECTIONS } from '../data/sections'

const SECTION_TITLES: Record<string, string> = {
  basics: 'Introduction', story: 'Brand Story', values: 'Brand Values',
  personality: 'Brand Personality', visuals_colors: 'Color Palette',
  visuals_logo: 'Logo & Name', typography: 'Typography',
  messaging: 'Key Messages', application: 'Brand in Use',
  social_media: 'Social Media Guidelines', photography: 'Photography & Imagery',
}

export function PresentationView() {
  const navigate = useNavigate()
  const session = useBrandGuideStore(s => s.session)
  const [currentIndex, setCurrentIndex] = useState(0)

  const approvedSections = SECTIONS.filter(s => {
    const state = session?.sections[s.id]
    return state?.status === 'approved' && state.approvedDraft
  })

  const handlePrev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex(i => Math.min(approvedSections.length - 1, i + 1))
  }, [approvedSections.length])

  const handleExit = useCallback(() => {
    navigate('/preview')
  }, [navigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      else if (e.key === 'ArrowRight') handleNext()
      else if (e.key === 'Escape') handleExit()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext, handleExit])

  if (!session || approvedSections.length === 0) {
    navigate('/preview')
    return null
  }

  const currentSection = approvedSections[currentIndex]
  const draft = session.sections[currentSection.id]?.approvedDraft ?? ''
  const title = SECTION_TITLES[currentSection.id] || currentSection.title

  return (
    <div className="fixed inset-0 bg-brand-primary flex flex-col items-center justify-center p-8 font-body z-50">
      {/* Slide counter */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        Section {currentIndex + 1} of {approvedSections.length}
      </div>

      {/* Exit hint */}
      <div className="absolute top-6 right-8">
        <button onClick={handleExit} className="text-white/40 text-sm hover:text-white/70 transition-colors">
          Press Esc to exit
        </button>
      </div>

      {/* Slide card */}
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[70vh] overflow-y-auto p-10">
        <h2 className="font-heading text-2xl font-bold text-brand-text mb-4 pb-3 border-b border-brand-border">
          {title}
        </h2>
        <div className="text-[15px] leading-relaxed text-brand-text-secondary whitespace-pre-wrap">
          {draft}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6 mt-8">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-6 py-3 rounded-xl text-white font-medium text-[15px] border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === approvedSections.length - 1}
          className="px-6 py-3 rounded-xl text-white font-medium text-[15px] border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Add route in app.tsx**

```tsx
import { PresentationView } from './pages/PresentationView'

// Add route:
<Route path="/presentation" element={<PresentationView />} />
```

**Step 3: Add "Present to Fellow" button to GuidePreview**

In `src/pages/GuidePreview.tsx`, in the intern tools section, add:

```tsx
<button
  onClick={() => navigate('/presentation')}
  className="px-5 py-2.5 rounded-xl border border-brand-border-dark bg-white text-brand-text font-medium text-sm hover:bg-brand-bg transition-colors"
>
  Present to Fellow
</button>
```

**Step 4: Run type check and tests**

Run: `npx tsc --noEmit`
Run: `npx vitest run`

**Step 5: Commit**

```bash
git add src/pages/PresentationView.tsx src/app.tsx src/pages/GuidePreview.tsx
git commit -m "feat: add full-screen presentation view for intern-fellow meetings"
```

---

## Task 5: Final Verification

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All pass

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Fix any issues**

**Step 4: Commit if needed**

---

## Summary

| Task | Feature | Key files |
|------|---------|-----------|
| 1 | Optional section skip | types, WizardSection, Sidebar, brandGuideStore |
| 2 | Long conversation summarization | summarize.ts, WizardSection, types |
| 3 | Cross-section consistency check | consistencyCheck.ts, GuidePreview |
| 4 | Presentation view | PresentationView.tsx, app.tsx, GuidePreview |
| 5 | Final verification | All |
