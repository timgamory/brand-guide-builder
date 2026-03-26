# Phase 2: Intern Path Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Working intern path for Story, Values, and Personality sections with research tasks, synthesis conversation, reflection prompts, and fellow review flow.

**Architecture:** Extends the existing Phase 1 SPA. The intern path adds three modes to `WizardSection`: research (task cards with notes), synthesis (chat with intern-coach persona), and review (same review card + reflection prompt). New stores for research tasks and reflections. New `researchTasks.ts` data file with per-section task templates. Fellow review is a separate page reading from the existing `reviews` Dexie table. The intern path setup collects `internMeta` (intern name, fellow name) before entering the wizard.

**Tech Stack:** Same as Phase 1 — Vite, React 18, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand, Dexie.js, React Router 7, @anthropic-ai/sdk, docx, Vitest

---

## Task 1: Research Tasks Data File

**Files:**
- Create: `src/data/researchTasks.ts`
- Create: `src/data/__tests__/researchTasks.test.ts`

**Step 1: Write the failing test**

```ts
// src/data/__tests__/researchTasks.test.ts
import { describe, it, expect } from 'vitest'
import { getResearchTasks, RESEARCH_TASKS } from '../researchTasks'

describe('researchTasks', () => {
  it('returns tasks for story section', () => {
    const tasks = getResearchTasks('story')
    expect(tasks.length).toBeGreaterThanOrEqual(2)
    expect(tasks.length).toBeLessThanOrEqual(4)
    tasks.forEach(t => {
      expect(t.id).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(['interview', 'observe', 'reflect', 'research']).toContain(t.type)
    })
  })

  it('returns tasks for values section', () => {
    const tasks = getResearchTasks('values')
    expect(tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('returns tasks for personality section', () => {
    const tasks = getResearchTasks('personality')
    expect(tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('returns empty array for unknown section', () => {
    expect(getResearchTasks('nonexistent')).toEqual([])
  })

  it('early sections have more tasks than later ones', () => {
    const storyTasks = getResearchTasks('story')
    const personalityTasks = getResearchTasks('personality')
    expect(storyTasks.length).toBeGreaterThanOrEqual(personalityTasks.length)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/researchTasks.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```ts
// src/data/researchTasks.ts
import type { ResearchTaskType } from '../types'

type ResearchTaskTemplate = {
  id: string
  description: string
  type: ResearchTaskType
}

export const RESEARCH_TASKS: Record<string, ResearchTaskTemplate[]> = {
  basics: [
    { id: 'basics-interview-1', description: 'Ask the fellow: "How do you describe what you do when someone asks at a party?"', type: 'interview' },
    { id: 'basics-observe-1', description: 'Look at the fellow\'s website, social media, or any materials. How do they currently describe the organization?', type: 'observe' },
  ],
  story: [
    { id: 'story-interview-1', description: 'Ask the fellow: "Why did you start this? What moment made you decide to go for it?"', type: 'interview' },
    { id: 'story-interview-2', description: 'Ask the fellow: "Who were you trying to help, and what were they struggling with?"', type: 'interview' },
    { id: 'story-observe-1', description: 'Look at their website\'s About page. Note the gap between how they talk about the business in person vs. how it\'s described online.', type: 'observe' },
    { id: 'story-research-1', description: 'Find 2-3 competitors or similar organizations. How do they tell their origin story? What patterns do you notice?', type: 'research' },
  ],
  values: [
    { id: 'values-interview-1', description: 'Ask the fellow: "When you had to make a tough decision, what principle guided you?"', type: 'interview' },
    { id: 'values-interview-2', description: 'Ask the fellow: "What behavior would you never tolerate, even if it made money?"', type: 'interview' },
    { id: 'values-observe-1', description: 'Look at how they interact with customers or community members. What values are they living out, even if they haven\'t named them?', type: 'observe' },
    { id: 'values-reflect-1', description: 'Based on your interviews and observations, what 3-5 values keep coming up? Are these stated values or lived values?', type: 'reflect' },
  ],
  personality: [
    { id: 'personality-interview-1', description: 'Ask the fellow: "If your brand were a person at a party, how would they act? What would people say about them?"', type: 'interview' },
    { id: 'personality-observe-1', description: 'Read the fellow\'s recent emails, social posts, or marketing materials. List 5 adjectives that describe the actual tone.', type: 'observe' },
    { id: 'personality-research-1', description: 'Pick 2 brands the fellow admires. What personality traits do those brands project? What can you borrow?', type: 'research' },
  ],
}

export function getResearchTasks(sectionId: string): ResearchTaskTemplate[] {
  return RESEARCH_TASKS[sectionId] ?? []
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/researchTasks.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/researchTasks.ts src/data/__tests__/researchTasks.test.ts
git commit -m "feat: add research task templates for intern path"
```

---

## Task 2: Intern Setup Flow

When an intern path is selected, collect `internMeta` (intern name, fellow name) before entering the wizard. This is a new page that sits between path selection and the wizard.

**Files:**
- Create: `src/pages/InternSetup.tsx`
- Modify: `src/app.tsx` — add `/intern-setup` route
- Modify: `src/pages/PathSelection.tsx` — intern path navigates to `/intern-setup` instead of `/wizard/basics`
- Modify: `src/stores/brandGuideStore.ts` — add `setInternMeta` action
- Modify: `src/services/storage.ts` — ensure `internMeta` persists

**Step 1: Add `setInternMeta` to the brand guide store**

In `src/stores/brandGuideStore.ts`, add to the type:

```ts
setInternMeta: (meta: InternMeta) => Promise<void>
```

And the implementation:

```ts
setInternMeta: async (meta) => {
  const { session } = get()
  if (!session) return
  await updateSession(session.id, { internMeta: meta })
  set({ session: { ...session, internMeta: meta, updatedAt: new Date().toISOString() } })
},
```

Import `InternMeta` from `../types`.

**Step 2: Create `InternSetup` page**

```tsx
// src/pages/InternSetup.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'

export function InternSetup() {
  const navigate = useNavigate()
  const session = useBrandGuideStore(s => s.session)
  const setInternMeta = useBrandGuideStore(s => s.setInternMeta)
  const [internName, setInternName] = useState('')
  const [fellowName, setFellowName] = useState('')

  const handleContinue = async () => {
    if (!internName.trim() || !fellowName.trim()) return
    await setInternMeta({
      internName: internName.trim(),
      fellowName: fellowName.trim(),
      startDate: new Date().toISOString(),
    })
    navigate('/wizard/basics')
  }

  return (
    <div className="min-h-screen bg-brand-bg font-body flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8 max-w-md w-full space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Getting Started</h1>
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
        <button
          onClick={handleContinue}
          disabled={!internName.trim() || !fellowName.trim()}
          className="w-full px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Let's go
        </button>
      </div>
    </div>
  )
}
```

**Step 3: Wire up routing**

In `src/app.tsx`, add:
```tsx
import { InternSetup } from './pages/InternSetup'
// Add route:
<Route path="/intern-setup" element={<InternSetup />} />
```

In `src/pages/PathSelection.tsx`, change `handleSelect` so that the `intern` path goes to `/intern-setup`:

```ts
const handleSelect = async (path: Path) => {
  if (!apiKey) {
    localStorage.setItem('pending-path', path)
    navigate('/setup')
    return
  }
  await createNewSession(path)
  if (path === 'intern') {
    navigate('/intern-setup')
  } else {
    navigate('/wizard/basics')
  }
}
```

**Step 4: Run type check and dev server**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/pages/InternSetup.tsx src/app.tsx src/pages/PathSelection.tsx src/stores/brandGuideStore.ts
git commit -m "feat: add intern setup page for collecting intern/fellow names"
```

---

## Task 3: Research Task Components

**Files:**
- Create: `src/components/research/TaskCard.tsx`
- Create: `src/components/research/TaskList.tsx`

**Step 1: Build TaskCard component**

```tsx
// src/components/research/TaskCard.tsx
import type { ResearchTask, ResearchTaskType } from '../../types'

const TYPE_CONFIG: Record<ResearchTaskType, { label: string; color: string; icon: string }> = {
  interview: { label: 'Interview', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🎤' },
  observe: { label: 'Observe', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '👀' },
  reflect: { label: 'Reflect', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '✍️' },
  research: { label: 'Research', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🔍' },
}

export function TaskCard({ task, onToggle, onNotesChange }: {
  task: ResearchTask
  onToggle: () => void
  onNotesChange: (notes: string) => void
}) {
  const config = TYPE_CONFIG[task.type]

  return (
    <div className={`bg-white rounded-xl border border-brand-border p-5 ${task.completed ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            task.completed ? 'bg-brand-accent-sage border-brand-accent-sage text-white' : 'border-brand-border-dark hover:border-brand-primary'
          }`}
        >
          {task.completed && <span className="text-xs">✓</span>}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${config.color}`}>
              {config.icon} {config.label}
            </span>
          </div>
          <p className={`text-[15px] text-brand-text leading-relaxed ${task.completed ? 'line-through text-brand-text-muted' : ''}`}>
            {task.description}
          </p>
          <textarea
            value={task.notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Your notes..."
            className="mt-3 w-full min-h-[80px] text-sm leading-relaxed text-brand-text-secondary bg-brand-bg rounded-lg p-3 border border-brand-border outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y font-body"
          />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Build TaskList component**

```tsx
// src/components/research/TaskList.tsx
import type { ResearchTask } from '../../types'
import { TaskCard } from './TaskCard'

export function TaskList({ tasks, onToggle, onNotesChange, onProceed }: {
  tasks: ResearchTask[]
  onToggle: (taskId: string) => void
  onNotesChange: (taskId: string, notes: string) => void
  onProceed: () => void
}) {
  const completedCount = tasks.filter(t => t.completed).length
  const halfDone = completedCount >= Math.ceil(tasks.length / 2)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-brand-text-muted font-body">
          {completedCount} of {tasks.length} tasks done
        </p>
      </div>

      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={() => onToggle(task.id)}
          onNotesChange={(notes) => onNotesChange(task.id, notes)}
        />
      ))}

      <button
        onClick={onProceed}
        disabled={!halfDone}
        className="w-full mt-4 px-6 py-4 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        I've done my research — let's discuss →
      </button>
      {!halfDone && (
        <p className="text-center text-sm text-brand-text-faint">
          Complete at least half the tasks to continue
        </p>
      )}
    </div>
  )
}
```

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/research/TaskCard.tsx src/components/research/TaskList.tsx
git commit -m "feat: add TaskCard and TaskList components for intern research"
```

---

## Task 4: Reflection Component

**Files:**
- Create: `src/components/reflection/ReflectionPrompt.tsx`

**Step 1: Build ReflectionPrompt**

```tsx
// src/components/reflection/ReflectionPrompt.tsx
import { useState, useEffect } from 'react'

const REFLECTION_PROMPTS: Record<string, string> = {
  basics: 'What did you learn about how the fellow thinks about their organization? Was there a gap between how they describe it and how others see it?',
  story: 'What did this section teach you about how brands communicate their origin? How does a good story build trust?',
  values: 'Why do you think naming values explicitly matters for a brand? How did the fellow\'s lived values compare to what they said?',
  personality: 'What surprised you about translating a person\'s personality into a brand personality? What was hardest to capture?',
}

export function ReflectionPrompt({ sectionId, value, onChange }: {
  sectionId: string
  value: string
  onChange: (text: string) => void
}) {
  const prompt = REFLECTION_PROMPTS[sectionId] ?? 'What did you learn from working on this section?'

  return (
    <div className="bg-brand-bg-warm rounded-2xl border border-brand-border p-6">
      <h3 className="font-heading text-lg font-semibold text-brand-text mb-2">Your Reflection</h3>
      <p className="text-[15px] text-brand-text-secondary mb-4 leading-relaxed">{prompt}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Write your reflection..."
        className="w-full min-h-[120px] text-[15px] leading-relaxed text-brand-text-secondary bg-white rounded-xl p-4 border border-brand-border outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y font-body"
      />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/reflection/ReflectionPrompt.tsx
git commit -m "feat: add ReflectionPrompt component for intern path"
```

---

## Task 5: Research Tasks + Reflections Storage

Extend the conversation store to handle research tasks, and add a reflection store using the existing Dexie `reflections` table.

**Files:**
- Modify: `src/stores/conversationStore.ts` — add research task methods
- Create: `src/stores/reflectionStore.ts`
- Modify: `src/services/storage.ts` — add reflection CRUD functions
- Create: `src/stores/__tests__/reflectionStore.test.ts`

**Step 1: Add reflection storage functions**

In `src/services/storage.ts`, add:

```ts
async function getReflections(sessionId: string): Promise<Reflections | undefined> {
  return db.reflections.get(sessionId)
}

async function saveReflection(sessionId: string, sectionId: string, text: string): Promise<void> {
  const existing = await db.reflections.get(sessionId)
  const entry = { sectionId, text, timestamp: new Date().toISOString() }
  if (existing) {
    const entries = existing.entries.filter(e => e.sectionId !== sectionId)
    entries.push(entry)
    await db.reflections.update(sessionId, { entries })
  } else {
    await db.reflections.add({ id: sessionId, entries: [entry] })
  }
}
```

Export both functions.

**Step 2: Extend conversation store for research tasks**

In `src/stores/conversationStore.ts`, add to the type and implementation:

```ts
// Add to type:
researchTasks: ResearchTask[]
loadResearchTasks: (sessionId: string, sectionId: string, templates: ResearchTaskTemplate[]) => Promise<void>
toggleTask: (taskId: string) => Promise<void>
updateTaskNotes: (taskId: string, notes: string) => Promise<void>
```

The `loadResearchTasks` method should:
1. Load the existing conversation for this session:section
2. If it already has `researchTasks`, use those (preserving notes/completion state)
3. If not, initialize from templates with `completed: false` and `notes: ''`
4. Save and set state

The `toggleTask` and `updateTaskNotes` methods should update the task in the array, then save the conversation.

Import `ResearchTask` from `../types`. The template type can be imported from `../data/researchTasks` or just inline-defined.

**Step 3: Create reflection store**

```ts
// src/stores/reflectionStore.ts
import { create } from 'zustand'
import type { ReflectionEntry } from '../types'
import { getReflections, saveReflection } from '../services/storage'

type ReflectionState = {
  entries: Record<string, string>  // sectionId -> text
  currentSessionId: string | null
  loadReflections: (sessionId: string) => Promise<void>
  setReflection: (sectionId: string, text: string) => Promise<void>
  getReflection: (sectionId: string) => string
}

export const useReflectionStore = create<ReflectionState>((set, get) => ({
  entries: {},
  currentSessionId: null,

  loadReflections: async (sessionId) => {
    const reflections = await getReflections(sessionId)
    const entries: Record<string, string> = {}
    if (reflections) {
      for (const e of reflections.entries) {
        entries[e.sectionId] = e.text
      }
    }
    set({ entries, currentSessionId: sessionId })
  },

  setReflection: async (sectionId, text) => {
    const { currentSessionId, entries } = get()
    if (!currentSessionId) return
    await saveReflection(currentSessionId, sectionId, text)
    set({ entries: { ...entries, [sectionId]: text } })
  },

  getReflection: (sectionId) => {
    return get().entries[sectionId] ?? ''
  },
}))
```

**Step 4: Write reflection store test**

```ts
// src/stores/__tests__/reflectionStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock storage before importing store
vi.mock('../../services/storage', () => ({
  getReflections: vi.fn().mockResolvedValue(undefined),
  saveReflection: vi.fn().mockResolvedValue(undefined),
}))

import { useReflectionStore } from '../reflectionStore'

describe('reflectionStore', () => {
  beforeEach(() => {
    useReflectionStore.setState({ entries: {}, currentSessionId: null })
  })

  it('starts with empty entries', () => {
    expect(useReflectionStore.getState().entries).toEqual({})
  })

  it('getReflection returns empty string for unknown section', () => {
    expect(useReflectionStore.getState().getReflection('story')).toBe('')
  })
})
```

**Step 5: Run tests**

Run: `npx vitest run src/stores/__tests__/reflectionStore.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/services/storage.ts src/stores/conversationStore.ts src/stores/reflectionStore.ts src/stores/__tests__/reflectionStore.test.ts
git commit -m "feat: add research task and reflection storage for intern path"
```

---

## Task 6: Intern Prompt Builder Enhancements

The intern path system prompt needs a research block that includes the intern's task notes and completion status. Also update section prompts to have distinct intern openers that reference research.

**Files:**
- Modify: `src/services/prompts/builder.ts` — add research block assembly + intern-aware `buildSystemPrompt`
- Modify: `src/services/prompts/sections/story.ts` — give intern variant a proper distinct opener and synthesis goal
- Modify: `src/services/prompts/sections/values.ts` — same
- Modify: `src/services/prompts/sections/personality.ts` — same
- Create: `src/services/__tests__/internPrompts.test.ts`

**Step 1: Write the test**

```ts
// src/services/__tests__/internPrompts.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../prompts/builder'
import type { Session, ResearchTask } from '../../types'

function makeSession(path: 'entrepreneur' | 'intern'): Session {
  return {
    id: 'test', path, brandData: {}, currentSection: 'story',
    sections: { story: { status: 'in_progress', approvedDraft: null, reviewFeedback: null } },
    createdAt: '', updatedAt: '',
    internMeta: path === 'intern' ? { internName: 'Jordan', fellowName: 'Maria', startDate: '' } : undefined,
  }
}

describe('intern prompt builder', () => {
  it('includes research block for intern path', () => {
    const tasks: ResearchTask[] = [
      { id: 't1', description: 'Ask why they started', type: 'interview', completed: true, notes: 'She said community was the driver' },
      { id: 't2', description: 'Look at website', type: 'observe', completed: false, notes: '' },
    ]
    const prompt = buildSystemPrompt(makeSession('intern'), 'story', tasks)
    expect(prompt).toContain('Research')
    expect(prompt).toContain('community was the driver')
    expect(prompt).toContain('Not completed')
  })

  it('does not include research block for entrepreneur path', () => {
    const prompt = buildSystemPrompt(makeSession('entrepreneur'), 'story')
    expect(prompt).not.toContain('Research Notes')
  })

  it('includes fellow name in intern prompt', () => {
    const prompt = buildSystemPrompt(makeSession('intern'), 'story', [])
    expect(prompt).toContain('Maria')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/__tests__/internPrompts.test.ts`
Expected: FAIL — `buildSystemPrompt` doesn't accept research tasks parameter

**Step 3: Update `buildSystemPrompt` in `src/services/prompts/builder.ts`**

Add optional third parameter `researchTasks?: ResearchTask[]`. When the session path is `intern` and research tasks are provided, build a research block:

```ts
function buildResearchBlock(tasks: ResearchTask[], session: Session): string {
  if (tasks.length === 0) return ''
  const fellowName = session.internMeta?.fellowName ?? 'the fellow'
  const lines = [`Research notes on ${fellowName}'s brand:`]
  for (const t of tasks) {
    const status = t.completed ? '✓ Completed' : '○ Not completed'
    lines.push(`- [${status}] ${t.description}`)
    if (t.notes) lines.push(`  Notes: ${t.notes}`)
  }
  return lines.join('\n')
}
```

In `buildSystemPrompt`, add the research block after context:

```ts
export function buildSystemPrompt(session: Session, sectionId: string, researchTasks?: ResearchTask[]): string {
  // ... existing persona and context blocks ...

  if (session.path === 'intern' && researchTasks) {
    const researchBlock = buildResearchBlock(researchTasks, session)
    if (researchBlock) {
      parts.push('# Research\n\n' + researchBlock)
    }
  }

  // Also include fellow name in intern persona context
  if (session.path === 'intern' && session.internMeta) {
    const internContext = `The intern's name is ${session.internMeta.internName}. They are building a brand guide for ${session.internMeta.fellowName}.`
    parts.splice(1, 0, '# Intern Context\n\n' + internContext)
  }

  // ... rest of prompt assembly ...
}
```

**Step 4: Update intern section openers**

In `src/services/prompts/sections/story.ts`, replace the spread-based intern with a proper distinct config:

```ts
export const storyIntern: SectionPrompt = {
  goal: 'Guide the intern to synthesize their research about the fellow\'s origin story, core offering, and target audience into a polished brand narrative.',
  opener: "Let's talk about what you learned from your research about the fellow's story. When you asked them why they started this, what did they say? What stood out to you?",
  fields: ['originStory', 'whatYouDo', 'whoYouServe'],
  reviewInstruction: `Generate a section review for "Your Story" section. Return JSON with NO markdown fences:
{"draft": "A compelling brand story section (3-4 paragraphs) covering: the origin and motivation, what the organization does, and who it serves. Written at professional copywriting level — elevate the intern's research findings into polished brand language.", "suggestions": ["1-2 refinements the intern should consider"], "alternatives": [{"option": "A different narrative angle", "rationale": "Why this angle might work"}], "teachingMoment": "1-2 sentences on what makes a good origin story work for a brand."}`,
}
```

Apply similar distinct configs for `valuesIntern` and `personalityIntern` in their respective files (same pattern — distinct `goal` and `opener` that reference the fellow and research process).

**Step 5: Run test**

Run: `npx vitest run src/services/__tests__/internPrompts.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/services/prompts/builder.ts src/services/prompts/sections/story.ts src/services/prompts/sections/values.ts src/services/prompts/sections/personality.ts src/services/__tests__/internPrompts.test.ts
git commit -m "feat: add research block to intern system prompts"
```

---

## Task 7: Intern Mode in WizardSection

The core task. Refactor `WizardSection.tsx` to support the intern's three modes: research → synthesis → review (with reflection).

**Files:**
- Modify: `src/pages/WizardSection.tsx` — detect path, render intern modes
- Modify: `src/components/review/SectionReview.tsx` — accept optional reflection slot

**Step 1: Refactor WizardSection to handle intern path**

The key change: when `session.path === 'intern'`, the component manages three modes (`research`, `synthesis`, `review`) instead of two (`interview`, `review`).

In `WizardSection.tsx`:

1. Import the new components: `TaskList`, `ReflectionPrompt`, `getResearchTasks`
2. Import `useReflectionStore`
3. Detect path from `session.path`
4. Add state for intern mode: `useState<InternMode | EntrepreneurMode | 'fallback'>`
5. When path is `intern`:
   - Default mode is `research`
   - Load research tasks from conversation store on mount
   - When "let's discuss" is clicked, switch to `synthesis` mode
   - Synthesis mode uses the same `ChatWindow` + `handleSend`, but passes `researchTasks` to `buildSystemPrompt`
   - When AI returns a review JSON, switch to `review` mode with reflection
6. In review mode for intern: render `SectionReview` + `ReflectionPrompt` below it
7. Approve requires both draft and reflection to be non-empty

The `handleApprove` for intern path should also save the reflection via `useReflectionStore.setReflection`.

**Step 2: Update SectionReview to support an `afterContent` slot**

Add an optional `children` prop or `afterContent` React node to `SectionReview` so that the reflection prompt can be rendered between the review content and the action buttons. This avoids duplicating the review card code.

Alternatively, render the `ReflectionPrompt` outside `SectionReview` in `WizardSection` — simpler and avoids modifying the existing component. The layout:

```tsx
{mode === 'review' && review ? (
  <div className="overflow-y-auto h-full">
    <SectionReview
      review={review}
      onApprove={handleApprove}
      onRevise={handleRevise}
      onStartOver={handleStartOver}
      disableApprove={isIntern && !reflectionText.trim()}
    />
    {isIntern && sectionId && (
      <div className="max-w-2xl mx-auto px-6 pb-6">
        <ReflectionPrompt
          sectionId={sectionId}
          value={reflectionText}
          onChange={handleReflectionChange}
        />
      </div>
    )}
  </div>
) : ...}
```

Add `disableApprove?: boolean` prop to `SectionReview` to conditionally disable the Approve button.

**Step 3: Run type check and manual test**

Run: `npx tsc --noEmit`
Run: `npm run dev` and test both paths

**Step 4: Commit**

```bash
git add src/pages/WizardSection.tsx src/components/review/SectionReview.tsx
git commit -m "feat: add intern three-mode flow (research, synthesis, review+reflection)"
```

---

## Task 8: Fellow Review Page

**Files:**
- Create: `src/pages/FellowReview.tsx`
- Create: `src/stores/reviewStore.ts`
- Modify: `src/services/storage.ts` — add review CRUD
- Modify: `src/app.tsx` — replace placeholder with real component

**Step 1: Add review storage functions**

In `src/services/storage.ts`, add:

```ts
async function getReview(sessionId: string): Promise<Review | undefined> {
  return db.reviews.get(sessionId)
}

async function saveReviewStatus(sessionId: string, sectionId: string, status: ReviewStatus, notes?: string): Promise<void> {
  const existing = await db.reviews.get(sessionId)
  const sectionState = { status, notes, reviewedAt: new Date().toISOString() }
  if (existing) {
    await db.reviews.update(sessionId, {
      sections: { ...existing.sections, [sectionId]: sectionState }
    })
  } else {
    await db.reviews.add({ id: sessionId, sections: { [sectionId]: sectionState } })
  }
}
```

Export both.

**Step 2: Create review store**

```ts
// src/stores/reviewStore.ts
import { create } from 'zustand'
import type { ReviewStatus, SectionReviewState } from '../types'
import { getReview, saveReviewStatus } from '../services/storage'

type ReviewStoreState = {
  sections: Record<string, SectionReviewState>
  currentSessionId: string | null
  loadReview: (sessionId: string) => Promise<void>
  setReviewStatus: (sectionId: string, status: ReviewStatus, notes?: string) => Promise<void>
}

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  sections: {},
  currentSessionId: null,

  loadReview: async (sessionId) => {
    const review = await getReview(sessionId)
    set({ sections: review?.sections ?? {}, currentSessionId: sessionId })
  },

  setReviewStatus: async (sectionId, status, notes) => {
    const { currentSessionId, sections } = get()
    if (!currentSessionId) return
    await saveReviewStatus(currentSessionId, sectionId, status, notes)
    set({
      sections: {
        ...sections,
        [sectionId]: { status, notes, reviewedAt: new Date().toISOString() },
      },
    })
  },
}))
```

**Step 3: Build FellowReview page**

```tsx
// src/pages/FellowReview.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { useReviewStore } from '../stores/reviewStore'
import { SECTIONS } from '../data/sections'
import type { ReviewStatus } from '../types'

function ReviewSection({ sectionId, title, draft, reviewStatus, notes, onAction }: {
  sectionId: string
  title: string
  draft: string
  reviewStatus: ReviewStatus
  notes?: string
  onAction: (status: ReviewStatus, notes?: string) => void
}) {
  const [changeNotes, setChangeNotes] = useState(notes ?? '')
  const [showNotes, setShowNotes] = useState(false)

  const statusBadge = {
    approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700' },
    changes_requested: { label: 'Changes Requested', color: 'bg-amber-50 text-amber-700' },
    flagged: { label: 'Flagged', color: 'bg-red-50 text-red-700' },
    not_reviewed: { label: 'Not Reviewed', color: 'bg-gray-50 text-gray-500' },
  }[reviewStatus]

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold text-brand-text">{title}</h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${statusBadge.color}`}>{statusBadge.label}</span>
      </div>
      <div className="text-[15px] text-brand-text-secondary leading-relaxed whitespace-pre-wrap mb-4">
        {draft}
      </div>
      {showNotes && (
        <div className="mb-4">
          <textarea
            value={changeNotes}
            onChange={e => setChangeNotes(e.target.value)}
            placeholder="What needs to change?"
            className="w-full min-h-[80px] text-sm p-3 rounded-xl border border-brand-border bg-brand-bg outline-none focus:border-brand-primary font-body"
          />
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onAction('approved')}
          className="px-4 py-2 rounded-lg bg-brand-accent-sage text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Approve
        </button>
        <button
          onClick={() => {
            if (showNotes && changeNotes.trim()) {
              onAction('changes_requested', changeNotes.trim())
              setShowNotes(false)
            } else {
              setShowNotes(true)
            }
          }}
          className="px-4 py-2 rounded-lg border border-brand-border-dark bg-white text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors"
        >
          {showNotes ? 'Submit Changes' : 'Request Changes'}
        </button>
        <button
          onClick={() => onAction('flagged')}
          className="px-4 py-2 rounded-lg text-brand-text-muted text-sm hover:text-brand-text transition-colors"
        >
          Flag for Discussion
        </button>
      </div>
    </div>
  )
}

export function FellowReview() {
  const { token } = useParams<{ token: string }>()
  const { sessions, loadSessions } = useBrandGuideStore()
  const { sections: reviewSections, loadReview, setReviewStatus } = useReviewStore()
  const [session, setSession] = useState<typeof sessions[0] | null>(null)

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (!token || sessions.length === 0) return
    const found = sessions.find(s => s.reviewToken === token)
    if (found) {
      setSession(found)
      loadReview(found.id)
    }
  }, [token, sessions, loadReview])

  if (!session) {
    return (
      <div className="min-h-screen bg-brand-bg font-body flex items-center justify-center">
        <p className="text-brand-text-muted">Review not found. Check the link and try again.</p>
      </div>
    )
  }

  const orgName = session.brandData.orgName || 'Brand Guide'
  const approvedSections = SECTIONS.filter(s => session.sections[s.id]?.approvedDraft)
  const reviewedCount = Object.values(reviewSections).filter(s => s.status !== 'not_reviewed').length
  const approvedCount = Object.values(reviewSections).filter(s => s.status === 'approved').length

  return (
    <div className="min-h-screen bg-brand-bg font-body">
      <div className="bg-brand-primary text-white px-6 py-4">
        <h1 className="font-heading text-xl font-semibold">{orgName} — Brand Guide Review</h1>
        <p className="text-white/70 text-sm mt-1">
          {reviewedCount} of {approvedSections.length} reviewed · {approvedCount} approved
        </p>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {approvedSections.map(section => {
          const draft = session.sections[section.id]?.approvedDraft
          if (!draft) return null
          const reviewState = reviewSections[section.id] ?? { status: 'not_reviewed' as const }
          return (
            <ReviewSection
              key={section.id}
              sectionId={section.id}
              title={section.title}
              draft={draft}
              reviewStatus={reviewState.status}
              notes={reviewState.notes}
              onAction={(status, notes) => setReviewStatus(section.id, status, notes)}
            />
          )
        })}
      </div>
    </div>
  )
}
```

**Step 4: Add review token generation**

In `src/stores/brandGuideStore.ts`, add a `submitForReview` action:

```ts
submitForReview: async () => {
  const { session } = get()
  if (!session) return
  const reviewToken = crypto.randomUUID()
  await updateSession(session.id, { reviewToken })
  set({ session: { ...session, reviewToken, updatedAt: new Date().toISOString() } })
  return reviewToken
},
```

**Step 5: Wire up route**

In `src/app.tsx`, replace the `Placeholder` fellow review route:

```tsx
import { FellowReview } from './pages/FellowReview'
// Replace:
<Route path="/review/:token" element={<FellowReview />} />
```

**Step 6: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/pages/FellowReview.tsx src/stores/reviewStore.ts src/stores/brandGuideStore.ts src/services/storage.ts src/app.tsx
git commit -m "feat: add fellow review page with approval/changes/flag flow"
```

---

## Task 9: Reflection Document Generator

**Files:**
- Modify: `src/services/documentGenerator.ts` — add reflection document export
- Create: `src/services/__tests__/reflectionDocGenerator.test.ts`

**Step 1: Write the test**

```ts
// src/services/__tests__/reflectionDocGenerator.test.ts
import { describe, it, expect } from 'vitest'
import { generateReflectionMarkdown } from '../documentGenerator'
import type { Session, ReflectionEntry } from '../../types'

describe('generateReflectionMarkdown', () => {
  it('generates markdown from reflection entries', () => {
    const session: Session = {
      id: 'test', path: 'intern', brandData: { orgName: 'TestOrg' },
      sections: {}, currentSection: 'basics',
      internMeta: { internName: 'Jordan', fellowName: 'Maria', startDate: '2026-03-01' },
      createdAt: '', updatedAt: '',
    }
    const entries: ReflectionEntry[] = [
      { sectionId: 'story', text: 'I learned about origin stories.', timestamp: '2026-03-15' },
      { sectionId: 'values', text: 'Values guide decisions.', timestamp: '2026-03-16' },
    ]
    const md = generateReflectionMarkdown(session, entries)
    expect(md).toContain('Jordan')
    expect(md).toContain('Maria')
    expect(md).toContain('Your Story')
    expect(md).toContain('I learned about origin stories.')
    expect(md).toContain('What You Stand For')
    expect(md).toContain('Values guide decisions.')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/__tests__/reflectionDocGenerator.test.ts`
Expected: FAIL

**Step 3: Implement**

In `src/services/documentGenerator.ts`, add:

```ts
import type { ReflectionEntry } from '../types'

export function generateReflectionMarkdown(session: Session, entries: ReflectionEntry[]): string {
  const internName = session.internMeta?.internName ?? 'Intern'
  const fellowName = session.internMeta?.fellowName ?? 'Fellow'
  const orgName = session.brandData.orgName || 'the organization'

  const lines: string[] = []
  lines.push(`# Reflection Document`)
  lines.push('')
  lines.push(`**${internName}** — Brand guide project for **${fellowName}** (${orgName})`)
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const entry of entries) {
    const section = SECTIONS.find(s => s.id === entry.sectionId)
    const title = section?.title ?? entry.sectionId
    lines.push(`## ${title}`)
    lines.push('')
    lines.push(entry.text)
    lines.push('')
  }

  return lines.join('\n')
}

export function downloadReflectionMarkdown(session: Session, entries: ReflectionEntry[]) {
  const md = generateReflectionMarkdown(session, entries)
  const filename = `${(session.internMeta?.internName || 'intern').replace(/\s+/g, '-').toLowerCase()}-reflections.md`
  const blob = new Blob([md], { type: 'text/markdown' })
  saveAs(blob, filename)
}
```

**Step 4: Run test**

Run: `npx vitest run src/services/__tests__/reflectionDocGenerator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/documentGenerator.ts src/services/__tests__/reflectionDocGenerator.test.ts
git commit -m "feat: add reflection document generator for intern path"
```

---

## Task 10: Submit for Review UI + Sidebar Polish

Add a "Submit for Fellow Review" button to the intern's guide preview page. Update the sidebar to show the fellow's name for intern sessions.

**Files:**
- Modify: `src/pages/GuidePreview.tsx` — add submit for review button + reflection download
- Modify: `src/components/layout/Header.tsx` — show path-specific label
- Modify: `src/components/layout/Sidebar.tsx` — show "Building for [fellowName]" for intern path

**Step 1: Update Header**

In `src/components/layout/Header.tsx`, read `session.path` and `session.internMeta`:
- Entrepreneur: show "Your Brand"
- Intern: show "Building for [fellowName]"

**Step 2: Update GuidePreview**

Add to `GuidePreview.tsx`:
- For intern path: "Submit for Fellow Review" button that calls `submitForReview()` and shows the shareable URL
- For intern path: "Download Reflections" button that calls `downloadReflectionMarkdown`

**Step 3: Run type check and manual test**

Run: `npx tsc --noEmit`
Run: `npm run dev` and test the full intern flow end-to-end

**Step 4: Commit**

```bash
git add src/pages/GuidePreview.tsx src/components/layout/Header.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add submit for review + reflection download + intern path labels"
```

---

## Task 11: Run All Tests + Type Check

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Fix any failures**

Address any test or type errors found.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: address any test/type issues from Phase 2 integration"
```

---

## Summary

| Task | What it builds | Key files |
|------|---------------|-----------|
| 1 | Research task templates | `src/data/researchTasks.ts` |
| 2 | Intern setup page | `src/pages/InternSetup.tsx`, store + routing changes |
| 3 | Task card + list UI | `src/components/research/TaskCard.tsx`, `TaskList.tsx` |
| 4 | Reflection component | `src/components/reflection/ReflectionPrompt.tsx` |
| 5 | Storage for tasks + reflections | `src/stores/reflectionStore.ts`, storage extensions |
| 6 | Intern prompt builder | `src/services/prompts/builder.ts`, section prompt updates |
| 7 | Intern mode in WizardSection | `src/pages/WizardSection.tsx` (the big one) |
| 8 | Fellow review page | `src/pages/FellowReview.tsx`, `src/stores/reviewStore.ts` |
| 9 | Reflection document generator | `src/services/documentGenerator.ts` |
| 10 | Submit for review + sidebar polish | `GuidePreview.tsx`, `Header.tsx`, `Sidebar.tsx` |
| 11 | Full test + type check pass | All files |
