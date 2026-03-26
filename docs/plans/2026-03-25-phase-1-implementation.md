# Phase 1: Entrepreneur Core + Storage — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Working entrepreneur path for Story, Values, and Personality sections with AI-driven adaptive interview, section review, persistent storage, and document download.

**Architecture:** Vite + React 18 SPA. Zustand stores hydrate from Dexie.js (IndexedDB) on load and write-through on mutation. Anthropic JS SDK calls Claude Sonnet 4.6 directly from the browser with streaming. Three-panel layout: dark header, left sidebar, main content area that switches between chat (interview) and structured review card.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand, Dexie.js, React Router 7, @anthropic-ai/sdk, docx (npm), Vitest

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/app.tsx`, `src/index.css`, `components.json`

**Step 1: Scaffold Vite + React + TypeScript project**

```bash
cd /Users/timgamory/Sites/brand-guide-builder
npm create vite@latest . -- --template react-ts
```

Select "Ignore files and continue" if prompted about existing files.

**Step 2: Install core dependencies**

```bash
npm install react-router-dom zustand dexie @anthropic-ai/sdk docx file-saver
npm install -D @types/file-saver vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 3: Install and initialize Tailwind CSS 4**

```bash
npm install tailwindcss @tailwindcss/vite
```

Update `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

Replace `src/index.css` with:

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #1e293b;
  --color-brand-accent-coral: #e07a5f;
  --color-brand-accent-sage: #81b29a;
  --color-brand-accent-gold: #f2cc8f;
  --color-brand-bg: #faf8f5;
  --color-brand-bg-warm: #f3f0eb;
  --color-brand-border: #e8e4df;
  --color-brand-border-dark: #d6d0c8;
  --color-brand-text: #1e293b;
  --color-brand-text-secondary: #334155;
  --color-brand-text-muted: #64748b;
  --color-brand-text-faint: #94a3b8;

  --font-heading: 'Fraunces', serif;
  --font-body: 'DM Sans', sans-serif;
}
```

**Step 4: Install shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Then install the components we need:

```bash
npx shadcn@latest add button card input textarea select badge scroll-area separator
```

**Step 5: Create test setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

**Step 6: Create app shell with router**

Update `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

Update `src/app.tsx`:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'

function Placeholder({ name }: { name: string }) {
  return <div className="flex items-center justify-center h-screen font-body text-brand-text-muted">{name}</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder name="Path Selection" />} />
      <Route path="/setup" element={<Placeholder name="API Key Setup" />} />
      <Route path="/wizard" element={<Placeholder name="Wizard" />} />
      <Route path="/wizard/:sectionId" element={<Placeholder name="Wizard Section" />} />
      <Route path="/review/:token" element={<Placeholder name="Fellow Review" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

Update `index.html` to load fonts:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>Brand Guide Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 7: Verify the app runs**

```bash
npm run dev
```

Expected: App loads at localhost:5173 showing "Path Selection" placeholder.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS + Tailwind + shadcn project"
```

---

## Task 2: Types & Section Data

**Files:**
- Create: `src/types/index.ts`
- Create: `src/data/sections.ts`

**Step 1: Define core types**

Create `src/types/index.ts`:

```ts
// === Paths ===

export type Path = 'entrepreneur' | 'intern'

// === Sections ===

export type FieldType = 'text' | 'textarea' | 'select' | 'color'

export type Field = {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  help?: string
  options?: string[]
  defaultValue?: string
}

export type Section = {
  id: string
  title: string
  subtitle: string
  optional: boolean
  fields: Field[]
}

export type SectionStatus = 'not_started' | 'in_progress' | 'approved'

export type SectionState = {
  status: SectionStatus
  approvedDraft: string | null
  reviewFeedback: string | null
}

// === Brand Data ===

export type BrandData = Record<string, string>

// === Sessions ===

export type Session = {
  id: string
  path: Path
  brandData: BrandData
  sections: Record<string, SectionState>
  currentSection: string
  internMeta?: InternMeta
  reviewToken?: string
  createdAt: string
  updatedAt: string
}

export type InternMeta = {
  internName: string
  fellowName: string
  startDate: string
}

// === Conversations ===

export type MessageRole = 'user' | 'assistant'

export type Message = {
  role: MessageRole
  content: string
}

export type ResearchTaskType = 'interview' | 'observe' | 'reflect' | 'research'

export type ResearchTask = {
  id: string
  description: string
  type: ResearchTaskType
  completed: boolean
  notes: string
}

export type Conversation = {
  id: string // sessionId:sectionId
  messages: Message[]
  researchTasks?: ResearchTask[]
}

// === Reflections ===

export type ReflectionEntry = {
  sectionId: string
  text: string
  timestamp: string
}

export type Reflections = {
  id: string // sessionId
  entries: ReflectionEntry[]
  finalSynthesis?: string
}

// === Fellow Review ===

export type ReviewStatus = 'approved' | 'changes_requested' | 'flagged' | 'not_reviewed'

export type SectionReviewState = {
  status: ReviewStatus
  notes?: string
  reviewedAt?: string
}

export type Review = {
  id: string // sessionId
  sections: Record<string, SectionReviewState>
}

// === AI Response Types ===

export type SectionReviewResponse = {
  draft: string
  suggestions: string[]
  alternatives: { option: string; rationale: string }[]
  teachingMoment: string
}

// === Wizard Mode ===

export type EntrepreneurMode = 'interview' | 'review'
export type InternMode = 'research' | 'synthesis' | 'review'
export type WizardMode = EntrepreneurMode | InternMode | 'fallback'
```

**Step 2: Define section data**

Create `src/data/sections.ts` — ported from existing wizard's STEPS array with type safety:

```ts
import type { Section } from '../types'

export const SECTIONS: Section[] = [
  {
    id: 'basics',
    title: 'The Basics',
    subtitle: 'Tell us about your organization',
    optional: false,
    fields: [
      { key: 'orgName', label: "What's the name of your organization?", type: 'text', placeholder: 'e.g. Bright Path Consulting', help: 'This is the name you want people to know you by.' },
      { key: 'orgType', label: 'What kind of organization is this?', type: 'select', options: ['Nonprofit', 'Small Business', 'Startup', 'Agency / Consultancy', 'Community Organization', 'Other'], help: 'This helps us tailor the language in your guide.' },
      { key: 'industry', label: 'What field or industry are you in?', type: 'text', placeholder: 'e.g. Education, Healthcare, Food Service, Technology', help: 'A few words describing what space you work in.' },
    ],
  },
  {
    id: 'story',
    title: 'Your Story',
    subtitle: 'Every brand starts with a reason',
    optional: false,
    fields: [
      { key: 'originStory', label: 'Why did you start this? What problem were you trying to solve?', type: 'textarea', placeholder: "Tell it like you'd tell a friend over coffee. There's no wrong answer here.", help: 'This becomes the heart of your brand story. A couple of sentences is great.' },
      { key: 'whatYouDo', label: 'In one or two sentences, what do you actually do?', type: 'textarea', placeholder: 'e.g. We help first-generation college students navigate the application process.', help: "Imagine someone at a dinner party asks what you do. What do you say?" },
      { key: 'whoYouServe', label: 'Who do you serve? Who benefits from your work?', type: 'textarea', placeholder: 'e.g. Young professionals in the Bronx looking to start businesses', help: "Be as specific as you can. It's okay if you serve more than one group." },
    ],
  },
  {
    id: 'values',
    title: 'What You Stand For',
    subtitle: 'The beliefs that guide every decision',
    optional: false,
    fields: [
      { key: 'value1Name', label: 'Value #1: Give it a name', type: 'text', placeholder: 'e.g. Community First' },
      { key: 'value1Desc', label: 'What does this value mean to you in practice?', type: 'textarea', placeholder: "e.g. We always ask 'does this serve the community?' before making decisions." },
      { key: 'value2Name', label: 'Value #2: Give it a name', type: 'text', placeholder: 'e.g. Transparency' },
      { key: 'value2Desc', label: 'What does this value mean in practice?', type: 'textarea', placeholder: 'How does this show up in your daily work?' },
      { key: 'value3Name', label: 'Value #3: Give it a name', type: 'text', placeholder: 'e.g. Boldness' },
      { key: 'value3Desc', label: 'What does this value mean in practice?', type: 'textarea', placeholder: 'One more. If you have more than 3, that\'s great, but start with 3.' },
    ],
  },
  {
    id: 'personality',
    title: 'Brand Personality',
    subtitle: 'If your brand were a person, who would they be?',
    optional: false,
    fields: [
      { key: 'personalityTraits', label: 'Pick 3-5 words that describe how your brand should feel to people', type: 'textarea', placeholder: 'e.g. Warm, trustworthy, bold, approachable, smart', help: 'Think about the vibe you want people to get when they interact with you.' },
      { key: 'brandVoice', label: 'How do you want to sound when you write or talk to people?', type: 'select', options: ['Friendly and conversational', 'Professional and polished', 'Bold and energetic', 'Calm and reassuring', 'Playful and fun', 'Direct and no-nonsense'], help: 'This guides how you write emails, social posts, and marketing materials.' },
      { key: 'brandNot', label: 'What is your brand definitely NOT?', type: 'textarea', placeholder: "e.g. We're never corporate or stiff. We don't talk down to people.", help: "Sometimes it's easier to define yourself by what you're not. What tone or style would feel wrong for your brand?" },
    ],
  },
  {
    id: 'visuals_colors',
    title: 'Colors',
    subtitle: 'The colors people will associate with you',
    optional: false,
    fields: [
      { key: 'primaryColor', label: "What's your main brand color?", type: 'color', defaultValue: '#1e293b', help: "This is the color that shows up most. If you already have one, enter it. If not, pick one that feels right." },
      { key: 'primaryColorName', label: 'Give it a name (optional)', type: 'text', placeholder: 'e.g. Deep Navy, Sunset Orange' },
      { key: 'accentColor1', label: 'Pick an accent color that complements your main color', type: 'color', defaultValue: '#e07a5f', help: 'This is for buttons, highlights, and calls to action.' },
      { key: 'accentColor1Name', label: 'Name this accent color (optional)', type: 'text', placeholder: 'e.g. Coral, Sage Green' },
      { key: 'accentColor2', label: 'One more accent color (optional)', type: 'color', defaultValue: '#81b29a' },
      { key: 'accentColor2Name', label: 'Name it (optional)', type: 'text', placeholder: 'e.g. Forest, Gold' },
      { key: 'bgColor', label: 'What background color feels right?', type: 'color', defaultValue: '#faf8f5', help: 'Pure white can feel cold. A warm off-white or light cream often feels more inviting.' },
    ],
  },
  {
    id: 'visuals_logo',
    title: 'Logo & Name',
    subtitle: 'How your name and logo should be treated',
    optional: false,
    fields: [
      { key: 'hasLogo', label: 'Do you already have a logo?', type: 'select', options: ['Yes', 'No, not yet', 'Working on it'], help: "That's okay either way. This section helps document rules for however your logo is used." },
      { key: 'logoDescription', label: 'If you have a logo, describe what it looks like and what it represents', type: 'textarea', placeholder: "e.g. It's a tree with deep roots forming a letter B. The roots represent our community foundation.", help: "If you don't have one yet, describe what you'd want it to convey." },
      { key: 'nameSpelling', label: 'Is there a specific way your name should always be written?', type: 'textarea', placeholder: "e.g. Always 'BrightPath' as one word, capital B and P. Never 'Bright Path' or 'BRIGHTPATH'.", help: 'This prevents your name from being misspelled in marketing, on partner sites, etc.' },
    ],
  },
  {
    id: 'typography',
    title: 'Typography',
    subtitle: 'The fonts that carry your message',
    optional: false,
    fields: [
      { key: 'hasTypography', label: 'Do you already use specific fonts?', type: 'select', options: ['Yes, I have brand fonts', 'No, I need suggestions', 'I use whatever looks good'], help: "Many businesses haven't thought about this yet, and that's totally fine." },
      { key: 'headlineFont', label: 'What font do you use (or want) for headlines and titles?', type: 'text', placeholder: 'e.g. Fraunces, Playfair Display, Montserrat', help: "If you're not sure, just describe the feel: modern, classic, bold, elegant?" },
      { key: 'bodyFont', label: 'What font do you use (or want) for regular text and paragraphs?', type: 'text', placeholder: 'e.g. DM Sans, Open Sans, Lato', help: 'Body fonts should be easy to read. Clean and simple usually works best.' },
      { key: 'typographyFeel', label: 'What feeling should your typography give people?', type: 'select', options: ['Modern and clean', 'Classic and trustworthy', 'Bold and attention-grabbing', 'Warm and approachable', 'Elegant and refined', 'Fun and creative'] },
    ],
  },
  {
    id: 'messaging',
    title: 'Key Messages',
    subtitle: 'The words you want people to remember',
    optional: false,
    fields: [
      { key: 'tagline', label: "Do you have a tagline or slogan? If not, what would you want it to say?", type: 'text', placeholder: "e.g. 'Where Connections Become Community'", help: "A short phrase that captures what you're all about. 3-8 words is the sweet spot." },
      { key: 'elevatorPitch', label: 'Give us your 30-second pitch. If you had one elevator ride, what would you say?', type: 'textarea', placeholder: 'We help [who] do [what] by [how]. Unlike [alternatives], we [unique difference].', help: "Don't overthink it. Just talk about what makes you special." },
      { key: 'threeThings', label: 'What are the 3 things you most want people to know about you?', type: 'textarea', placeholder: "1. We're community-rooted\n2. We actually listen\n3. We measure what matters", help: 'These become your go-to talking points for everything from websites to pitch decks.' },
    ],
  },
  {
    id: 'application',
    title: 'Putting It All Together',
    subtitle: 'Where your brand shows up in the real world',
    optional: false,
    fields: [
      { key: 'primaryChannels', label: 'Where do people usually find you or interact with you?', type: 'textarea', placeholder: 'e.g. Website, Instagram, email newsletters, community events, Zoom calls', help: 'List the places your brand shows up most. This helps us write usage guidelines for each.' },
      { key: 'doList', label: 'What should people ALWAYS do when representing your brand?', type: 'textarea', placeholder: 'e.g. Use warm, welcoming language. Show real people, not stock photos. Lead with stories.', help: 'Think about what makes your brand feel right when someone uses it well.' },
      { key: 'dontList', label: 'What should people NEVER do when representing your brand?', type: 'textarea', placeholder: "e.g. Never use all caps for our name. Don't use corporate jargon. Avoid cold, transactional language.", help: 'What would make you cringe if you saw it on a flyer or social post?' },
    ],
  },
  {
    id: 'social_media',
    title: 'Social Media',
    subtitle: 'How you show up online',
    optional: true,
    fields: [
      { key: 'socialPlatforms', label: 'Which social media platforms do you use (or plan to use)?', type: 'textarea', placeholder: 'e.g. Instagram, LinkedIn, Facebook, TikTok, X/Twitter', help: "List the ones that matter most to you. You don't need to be everywhere." },
      { key: 'socialVoice', label: 'Does your social media voice differ from your general brand voice? How?', type: 'textarea', placeholder: "e.g. On Instagram we're a bit more casual and visual. On LinkedIn we're more professional but still warm.", help: "It's normal for your tone to shift slightly depending on the platform. Describe how." },
      { key: 'socialDo', label: 'What kind of content should you post? What works for your audience?', type: 'textarea', placeholder: 'e.g. Behind-the-scenes moments, community wins, short tips, event recaps, member spotlights', help: 'Think about what your followers would actually want to see and engage with.' },
      { key: 'socialDont', label: 'What should you avoid posting?', type: 'textarea', placeholder: "e.g. Don't post memes that don't align with our values. Avoid overly polished stock imagery. Never post without proofreading.", help: 'What kind of content would hurt your brand if it showed up on your feed?' },
      { key: 'socialHashtags', label: 'Are there branded hashtags or tags you use consistently?', type: 'text', placeholder: 'e.g. #BrightPathCommunity #BuildTogether', help: 'Branded hashtags help people find your content and build community around your posts.' },
      { key: 'socialFrequency', label: 'How often do you want to post?', type: 'select', options: ['Daily', 'A few times a week', 'Weekly', 'A few times a month', 'Still figuring it out'], help: "There's no perfect answer. Consistency matters more than volume." },
    ],
  },
  {
    id: 'photography',
    title: 'Photography & Imagery',
    subtitle: 'The visual feel of your brand beyond the logo',
    optional: true,
    fields: [
      { key: 'photoStyle', label: 'What kind of photos best represent your brand?', type: 'select', options: ['Candid, in-the-moment shots', 'Clean and professional portraits', 'Bold and artistic imagery', 'Warm, lifestyle photography', 'Documentary style', 'A mix of styles'], help: "Think about the photos you've seen that feel like 'you.'" },
      { key: 'photoSubjects', label: 'What should your photos show? What subjects matter?', type: 'textarea', placeholder: 'e.g. Real community members, our events, the Bronx neighborhood, people working together, our products', help: "Be specific. 'People at events' is more useful than 'people.'" },
      { key: 'photoAvoid', label: 'What kind of imagery should you avoid?', type: 'textarea', placeholder: "e.g. No generic stock photos. No staged smiles. Avoid images that don't reflect our community's diversity.", help: 'What kind of images would feel fake or off-brand?' },
      { key: 'photoMood', label: 'What mood or feeling should your photos create?', type: 'textarea', placeholder: 'e.g. Hopeful, energetic, real, connected, grounded', help: 'Imagine scrolling through your website or social feed. What should it feel like?' },
      { key: 'photoEditing', label: 'Do you have preferences for how photos should be edited?', type: 'textarea', placeholder: 'e.g. Warm tones, slightly desaturated, bright and airy, moody and rich', help: "If you're not sure, describe a visual vibe: bright and warm, dark and moody, natural and unfiltered?" },
      { key: 'iconStyle', label: 'If you use icons or illustrations, what style should they be?', type: 'select', options: ['Simple line icons', 'Filled / solid icons', 'Hand-drawn or organic', 'Geometric and modern', 'Not sure yet', "We don't use icons"], help: 'Icons add personality to websites, presentations, and social posts.' },
    ],
  },
]

export const PHASE_1_SECTION_IDS = ['basics', 'story', 'values', 'personality'] as const
export const ALL_SECTION_IDS = SECTIONS.map(s => s.id)

export function getSection(id: string): Section | undefined {
  return SECTIONS.find(s => s.id === id)
}

export function getSectionIndex(id: string): number {
  return SECTIONS.findIndex(s => s.id === id)
}
```

**Step 3: Write test for section data**

Create `src/data/__tests__/sections.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SECTIONS, getSection, getSectionIndex, ALL_SECTION_IDS } from '../sections'

describe('sections', () => {
  it('has 11 sections', () => {
    expect(SECTIONS).toHaveLength(11)
  })

  it('each section has required fields', () => {
    for (const section of SECTIONS) {
      expect(section.id).toBeTruthy()
      expect(section.title).toBeTruthy()
      expect(section.subtitle).toBeTruthy()
      expect(typeof section.optional).toBe('boolean')
      expect(Array.isArray(section.fields)).toBe(true)
    }
  })

  it('only social_media and photography are optional', () => {
    const optional = SECTIONS.filter(s => s.optional)
    expect(optional.map(s => s.id)).toEqual(['social_media', 'photography'])
  })

  it('all field keys are unique across sections', () => {
    const allKeys = SECTIONS.flatMap(s => s.fields.map(f => f.key))
    const uniqueKeys = new Set(allKeys)
    expect(allKeys.length).toBe(uniqueKeys.size)
  })

  it('getSection returns correct section', () => {
    expect(getSection('story')?.title).toBe('Your Story')
    expect(getSection('nonexistent')).toBeUndefined()
  })

  it('getSectionIndex returns correct index', () => {
    expect(getSectionIndex('basics')).toBe(0)
    expect(getSectionIndex('story')).toBe(1)
    expect(getSectionIndex('nonexistent')).toBe(-1)
  })

  it('ALL_SECTION_IDS matches section order', () => {
    expect(ALL_SECTION_IDS).toEqual(SECTIONS.map(s => s.id))
  })
})
```

**Step 4: Run tests**

```bash
npx vitest run src/data/__tests__/sections.test.ts
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/types/index.ts src/data/sections.ts src/data/__tests__/sections.test.ts
git commit -m "feat: add core types and section definitions"
```

---

## Task 3: Storage Layer (Dexie.js)

**Files:**
- Create: `src/services/storage.ts`
- Create: `src/services/__tests__/storage.test.ts`

**Step 1: Write failing tests for storage**

Create `src/services/__tests__/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db, createSession, getSession, updateSession, listSessions, deleteSession } from '../storage'
import type { Path } from '../../types'

describe('storage', () => {
  beforeEach(async () => {
    await db.sessions.clear()
    await db.conversations.clear()
    await db.reflections.clear()
    await db.reviews.clear()
  })

  it('creates a session with correct defaults', async () => {
    const session = await createSession('entrepreneur')
    expect(session.id).toBeTruthy()
    expect(session.path).toBe('entrepreneur')
    expect(session.brandData).toEqual({})
    expect(session.currentSection).toBe('basics')
    expect(session.sections).toBeDefined()
    expect(session.sections['basics'].status).toBe('not_started')
  })

  it('retrieves a session by id', async () => {
    const created = await createSession('entrepreneur')
    const fetched = await getSession(created.id)
    expect(fetched?.id).toBe(created.id)
    expect(fetched?.path).toBe('entrepreneur')
  })

  it('updates a session', async () => {
    const session = await createSession('entrepreneur')
    await updateSession(session.id, { brandData: { orgName: 'Test Org' } })
    const fetched = await getSession(session.id)
    expect(fetched?.brandData.orgName).toBe('Test Org')
  })

  it('lists all sessions', async () => {
    await createSession('entrepreneur')
    await createSession('intern')
    const sessions = await listSessions()
    expect(sessions).toHaveLength(2)
  })

  it('deletes a session', async () => {
    const session = await createSession('entrepreneur')
    await deleteSession(session.id)
    const fetched = await getSession(session.id)
    expect(fetched).toBeUndefined()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/services/__tests__/storage.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement storage layer**

Create `src/services/storage.ts`:

```ts
import Dexie, { type EntityTable } from 'dexie'
import type { Session, Conversation, Reflections, Review } from '../types'
import { SECTIONS } from '../data/sections'

const db = new Dexie('BrandGuideBuilder') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  conversations: EntityTable<Conversation, 'id'>
  reflections: EntityTable<Reflections, 'id'>
  reviews: EntityTable<Review, 'id'>
}

db.version(1).stores({
  sessions: 'id, path, updatedAt',
  conversations: 'id',
  reflections: 'id',
  reviews: 'id',
})

function generateId(): string {
  return crypto.randomUUID()
}

function buildInitialSections(): Session['sections'] {
  const sections: Session['sections'] = {}
  for (const section of SECTIONS) {
    sections[section.id] = {
      status: 'not_started',
      approvedDraft: null,
      reviewFeedback: null,
    }
  }
  return sections
}

async function createSession(path: Session['path']): Promise<Session> {
  const now = new Date().toISOString()
  const session: Session = {
    id: generateId(),
    path,
    brandData: {},
    sections: buildInitialSections(),
    currentSection: 'basics',
    createdAt: now,
    updatedAt: now,
  }
  await db.sessions.add(session)
  return session
}

async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id)
}

async function updateSession(id: string, updates: Partial<Omit<Session, 'id' | 'createdAt'>>): Promise<void> {
  await db.sessions.update(id, { ...updates, updatedAt: new Date().toISOString() })
}

async function listSessions(): Promise<Session[]> {
  return db.sessions.orderBy('updatedAt').reverse().toArray()
}

async function deleteSession(id: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.conversations, db.reflections, db.reviews], async () => {
    await db.sessions.delete(id)
    // Clean up related data
    const convos = await db.conversations.where('id').startsWith(id).toArray()
    await db.conversations.bulkDelete(convos.map(c => c.id))
    await db.reflections.delete(id)
    await db.reviews.delete(id)
  })
}

// Conversation helpers

async function getConversation(sessionId: string, sectionId: string): Promise<Conversation | undefined> {
  return db.conversations.get(`${sessionId}:${sectionId}`)
}

async function saveConversation(sessionId: string, sectionId: string, conversation: Omit<Conversation, 'id'>): Promise<void> {
  const id = `${sessionId}:${sectionId}`
  await db.conversations.put({ ...conversation, id })
}

export {
  db,
  createSession,
  getSession,
  updateSession,
  listSessions,
  deleteSession,
  getConversation,
  saveConversation,
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/services/__tests__/storage.test.ts
```

Expected: All tests pass. (Dexie uses IndexedDB; in jsdom/node it uses `fake-indexeddb` — if tests fail due to missing IndexedDB, install `fake-indexeddb`):

```bash
npm install -D fake-indexeddb
```

And add to `src/test/setup.ts`:

```ts
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom'
```

**Step 5: Commit**

```bash
git add src/services/storage.ts src/services/__tests__/storage.test.ts src/test/setup.ts
git commit -m "feat: add Dexie.js storage layer with session CRUD"
```

---

## Task 4: Zustand Stores

**Files:**
- Create: `src/stores/brandGuideStore.ts`
- Create: `src/stores/conversationStore.ts`
- Create: `src/stores/__tests__/brandGuideStore.test.ts`

**Step 1: Write failing test for brand guide store**

Create `src/stores/__tests__/brandGuideStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useBrandGuideStore } from '../brandGuideStore'
import { db } from '../../services/storage'

describe('brandGuideStore', () => {
  beforeEach(async () => {
    await db.sessions.clear()
    useBrandGuideStore.getState().reset()
  })

  it('starts with no session', () => {
    const state = useBrandGuideStore.getState()
    expect(state.session).toBeNull()
    expect(state.isLoading).toBe(false)
  })

  it('creates a new session', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    const state = useBrandGuideStore.getState()
    expect(state.session).not.toBeNull()
    expect(state.session!.path).toBe('entrepreneur')
  })

  it('updates brand data', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().updateBrandData({ orgName: 'Test Org' })
    const state = useBrandGuideStore.getState()
    expect(state.session!.brandData.orgName).toBe('Test Org')
  })

  it('navigates to a section', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().navigateToSection('story')
    const state = useBrandGuideStore.getState()
    expect(state.session!.currentSection).toBe('story')
  })

  it('approves a section draft', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().approveSectionDraft('story', 'Polished story draft...')
    const state = useBrandGuideStore.getState()
    expect(state.session!.sections['story'].status).toBe('approved')
    expect(state.session!.sections['story'].approvedDraft).toBe('Polished story draft...')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/stores/__tests__/brandGuideStore.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement brand guide store**

Create `src/stores/brandGuideStore.ts`:

```ts
import { create } from 'zustand'
import type { Session, Path, SectionStatus, BrandData } from '../types'
import { createSession, getSession, updateSession, listSessions, deleteSession } from '../services/storage'
import { SECTIONS } from '../data/sections'

type BrandGuideState = {
  session: Session | null
  sessions: Session[]
  isLoading: boolean

  // Session lifecycle
  createNewSession: (path: Path) => Promise<void>
  loadSession: (id: string) => Promise<void>
  loadSessions: () => Promise<void>
  deleteSessionById: (id: string) => Promise<void>
  reset: () => void

  // Brand data
  updateBrandData: (data: Partial<BrandData>) => Promise<void>

  // Navigation
  navigateToSection: (sectionId: string) => Promise<void>
  nextSection: () => Promise<void>

  // Section management
  updateSectionStatus: (sectionId: string, status: SectionStatus) => Promise<void>
  approveSectionDraft: (sectionId: string, draft: string) => Promise<void>
}

export const useBrandGuideStore = create<BrandGuideState>((set, get) => ({
  session: null,
  sessions: [],
  isLoading: false,

  createNewSession: async (path) => {
    set({ isLoading: true })
    const session = await createSession(path)
    set({ session, isLoading: false })
  },

  loadSession: async (id) => {
    set({ isLoading: true })
    const session = await getSession(id)
    set({ session: session ?? null, isLoading: false })
  },

  loadSessions: async () => {
    const sessions = await listSessions()
    set({ sessions })
  },

  deleteSessionById: async (id) => {
    await deleteSession(id)
    const { session } = get()
    if (session?.id === id) {
      set({ session: null })
    }
    await get().loadSessions()
  },

  reset: () => {
    set({ session: null, sessions: [], isLoading: false })
  },

  updateBrandData: async (data) => {
    const { session } = get()
    if (!session) return
    const brandData = { ...session.brandData, ...data }
    await updateSession(session.id, { brandData })
    set({ session: { ...session, brandData, updatedAt: new Date().toISOString() } })
  },

  navigateToSection: async (sectionId) => {
    const { session } = get()
    if (!session) return
    await updateSession(session.id, { currentSection: sectionId })
    set({ session: { ...session, currentSection: sectionId, updatedAt: new Date().toISOString() } })
  },

  nextSection: async () => {
    const { session } = get()
    if (!session) return
    const currentIndex = SECTIONS.findIndex(s => s.id === session.currentSection)
    if (currentIndex < SECTIONS.length - 1) {
      const nextId = SECTIONS[currentIndex + 1].id
      await get().navigateToSection(nextId)
    }
  },

  updateSectionStatus: async (sectionId, status) => {
    const { session } = get()
    if (!session) return
    const sections = {
      ...session.sections,
      [sectionId]: { ...session.sections[sectionId], status },
    }
    await updateSession(session.id, { sections })
    set({ session: { ...session, sections, updatedAt: new Date().toISOString() } })
  },

  approveSectionDraft: async (sectionId, draft) => {
    const { session } = get()
    if (!session) return
    const sections = {
      ...session.sections,
      [sectionId]: { ...session.sections[sectionId], status: 'approved' as const, approvedDraft: draft },
    }
    await updateSession(session.id, { sections })
    set({ session: { ...session, sections, updatedAt: new Date().toISOString() } })
  },
}))
```

**Step 4: Implement conversation store**

Create `src/stores/conversationStore.ts`:

```ts
import { create } from 'zustand'
import type { Message } from '../types'
import { getConversation, saveConversation } from '../services/storage'

type ConversationState = {
  messages: Message[]
  isStreaming: boolean
  currentSessionId: string | null
  currentSectionId: string | null

  loadConversation: (sessionId: string, sectionId: string) => Promise<void>
  addMessage: (message: Message) => Promise<void>
  setStreaming: (streaming: boolean) => void
  clearConversation: () => Promise<void>
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentSessionId: null,
  currentSectionId: null,

  loadConversation: async (sessionId, sectionId) => {
    const convo = await getConversation(sessionId, sectionId)
    set({
      messages: convo?.messages ?? [],
      currentSessionId: sessionId,
      currentSectionId: sectionId,
    })
  },

  addMessage: async (message) => {
    const { messages, currentSessionId, currentSectionId } = get()
    if (!currentSessionId || !currentSectionId) return
    const updated = [...messages, message]
    set({ messages: updated })
    await saveConversation(currentSessionId, currentSectionId, { messages: updated })
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  clearConversation: async () => {
    const { currentSessionId, currentSectionId } = get()
    if (!currentSessionId || !currentSectionId) return
    set({ messages: [] })
    await saveConversation(currentSessionId, currentSectionId, { messages: [] })
  },
}))
```

**Step 5: Run tests**

```bash
npx vitest run src/stores/__tests__/brandGuideStore.test.ts
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/stores/brandGuideStore.ts src/stores/conversationStore.ts src/stores/__tests__/brandGuideStore.test.ts
git commit -m "feat: add Zustand stores for brand guide and conversation state"
```

---

## Task 5: Layout Components (Header, Sidebar, Shell)

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/WizardShell.tsx`

**Step 1: Build the Header component**

Create `src/components/layout/Header.tsx`:

```tsx
import { useBrandGuideStore } from '../../stores/brandGuideStore'

export function Header() {
  const session = useBrandGuideStore(s => s.session)

  const pathLabel = session?.path === 'intern'
    ? `Building for ${session.internMeta?.fellowName ?? 'Fellow'}`
    : 'Your Brand'

  return (
    <header className="bg-brand-primary px-8 py-5 flex items-center justify-between">
      <div>
        <h1 className="font-heading text-xl font-semibold text-white">Brand Guide Builder</h1>
        {session && (
          <p className="text-brand-text-faint text-sm mt-0.5">{pathLabel}</p>
        )}
      </div>
      {session?.brandData.orgName && (
        <span className="font-heading text-brand-accent-gold text-[15px] font-medium">
          {session.brandData.orgName}
        </span>
      )}
    </header>
  )
}
```

**Step 2: Build the Sidebar component**

Create `src/components/layout/Sidebar.tsx`:

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useBrandGuideStore } from '../../stores/brandGuideStore'
import { SECTIONS } from '../../data/sections'
import { cn } from '../../lib/utils'
import type { SectionStatus } from '../../types'

function StatusIcon({ status }: { status: SectionStatus }) {
  if (status === 'approved') {
    return <span className="text-brand-accent-sage text-xs">&#10003;</span>
  }
  if (status === 'in_progress') {
    return <span className="text-brand-accent-coral text-xs">&#9679;</span>
  }
  return <span className="text-brand-text-faint text-xs">&#9675;</span>
}

export function Sidebar() {
  const session = useBrandGuideStore(s => s.session)
  const navigateToSection = useBrandGuideStore(s => s.navigateToSection)
  const navigate = useNavigate()
  const { sectionId } = useParams()

  const currentSectionId = sectionId ?? session?.currentSection ?? 'basics'

  const handleClick = async (id: string) => {
    await navigateToSection(id)
    navigate(`/wizard/${id}`)
  }

  return (
    <nav className="w-[220px] shrink-0 bg-brand-bg-warm border-r border-brand-border py-6 overflow-y-auto">
      {SECTIONS.map((section, i) => {
        const isActive = section.id === currentSectionId
        const sectionState = session?.sections[section.id]
        const status = sectionState?.status ?? 'not_started'

        return (
          <button
            key={section.id}
            onClick={() => handleClick(section.id)}
            className={cn(
              'block w-full text-left px-5 py-2.5 border-l-[3px] transition-all font-body text-[13px]',
              isActive
                ? 'bg-white border-brand-primary font-semibold text-brand-text'
                : 'border-transparent text-brand-text-muted hover:text-brand-text hover:bg-white/50'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <StatusIcon status={status} />
              {section.title}
              {section.optional && (
                <span className="text-[9px] text-brand-text-faint font-normal uppercase tracking-wider">opt</span>
              )}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
```

**Step 3: Build the WizardShell**

Create `src/components/layout/WizardShell.tsx`:

```tsx
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function WizardShell() {
  return (
    <div className="min-h-screen bg-brand-bg font-body flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

**Step 4: Verify `cn` util exists**

The shadcn init should have created `src/lib/utils.ts` with the `cn` function. Verify it exists:

```bash
cat src/lib/utils.ts
```

If missing, create it:

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 5: Update router to use WizardShell**

Update `src/app.tsx`:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { WizardShell } from './components/layout/WizardShell'

function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-full font-body text-brand-text-muted p-12">
      {name}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder name="Path Selection" />} />
      <Route path="/setup" element={<Placeholder name="API Key Setup" />} />
      <Route path="/wizard" element={<WizardShell />}>
        <Route index element={<Placeholder name="Select a section" />} />
        <Route path=":sectionId" element={<Placeholder name="Section Content" />} />
      </Route>
      <Route path="/review/:token" element={<Placeholder name="Fellow Review" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

**Step 6: Verify layout renders**

```bash
npm run dev
```

Navigate to `http://localhost:5173/wizard` — should see dark header, sidebar with 11 sections, and main area with placeholder text.

**Step 7: Commit**

```bash
git add src/components/layout/ src/app.tsx
git commit -m "feat: add Header, Sidebar, and WizardShell layout components"
```

---

## Task 6: Path Selection Page

**Files:**
- Create: `src/pages/PathSelection.tsx`
- Modify: `src/app.tsx`

**Step 1: Build PathSelection page**

Create `src/pages/PathSelection.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import type { Path, Session } from '../types'

function PathCard({
  title,
  description,
  details,
  onClick,
}: {
  title: string
  description: string
  details: string[]
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-8 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left max-w-sm w-full cursor-pointer"
    >
      <h2 className="font-heading text-2xl font-semibold text-brand-text mb-2">{title}</h2>
      <p className="text-brand-text-secondary text-[15px] leading-relaxed mb-4">{description}</p>
      <ul className="space-y-1.5">
        {details.map((d, i) => (
          <li key={i} className="text-brand-text-muted text-sm flex items-start gap-2">
            <span className="text-brand-accent-sage mt-0.5">&#10003;</span>
            {d}
          </li>
        ))}
      </ul>
    </button>
  )
}

function SessionCard({ session, onResume, onDelete }: { session: Session; onResume: () => void; onDelete: () => void }) {
  const updated = new Date(session.updatedAt).toLocaleDateString()
  const approvedCount = Object.values(session.sections).filter(s => s.status === 'approved').length

  return (
    <div className="bg-white rounded-xl p-5 border border-brand-border flex items-center justify-between">
      <div>
        <p className="font-body font-semibold text-brand-text">
          {session.brandData.orgName || 'Untitled'}
        </p>
        <p className="text-brand-text-muted text-sm">
          {session.path === 'entrepreneur' ? 'Your Brand' : 'Intern Path'} &middot; {approvedCount}/11 sections &middot; Updated {updated}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={onDelete} className="text-brand-text-faint text-sm hover:text-red-500 transition-colors px-2">Delete</button>
        <button onClick={onResume} className="bg-brand-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-text-secondary transition-colors">Resume</button>
      </div>
    </div>
  )
}

export function PathSelection() {
  const navigate = useNavigate()
  const { createNewSession, loadSession, loadSessions, deleteSessionById, sessions } = useBrandGuideStore()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadSessions().then(() => setLoaded(true))
  }, [loadSessions])

  const apiKey = localStorage.getItem('anthropic-api-key')

  const handleSelect = async (path: Path) => {
    if (!apiKey) {
      // Store chosen path, redirect to setup
      localStorage.setItem('pending-path', path)
      navigate('/setup')
      return
    }
    await createNewSession(path)
    navigate('/wizard/basics')
  }

  const handleResume = async (id: string) => {
    await loadSession(id)
    const session = useBrandGuideStore.getState().session
    navigate(`/wizard/${session?.currentSection ?? 'basics'}`)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this session? This cannot be undone.')) {
      await deleteSessionById(id)
    }
  }

  if (!loaded) return null

  return (
    <div className="min-h-screen bg-brand-bg font-body flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold text-brand-text mb-2">Brand Guide Builder</h1>
        <p className="text-brand-text-muted text-lg">Create professional brand guidelines, step by step.</p>
      </div>

      {sessions.length > 0 && (
        <div className="w-full max-w-2xl mb-10 space-y-3">
          <h2 className="font-heading text-lg font-semibold text-brand-text mb-2">Continue where you left off</h2>
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

      <div className="flex gap-6 flex-wrap justify-center">
        <PathCard
          title="I'm building my own brand guide"
          description="Work directly with an AI brand strategist who'll draw out what you already know and turn it into polished brand language."
          details={['15-25 minute guided interview', 'Professional brand guide download', 'No design experience needed']}
          onClick={() => handleSelect('entrepreneur')}
        />
        <PathCard
          title="I'm building a brand guide for someone else"
          description="Get guided through a research process: what questions to ask, what to observe, and how to synthesize your findings into professional brand language."
          details={['Structured research assignments', 'AI coaching through synthesis', 'Fellow review and approval flow', 'Reflection document for your portfolio']}
          onClick={() => handleSelect('intern')}
        />
      </div>
    </div>
  )
}
```

**Step 2: Update router**

In `src/app.tsx`, replace the `"/"` route:

```tsx
import { PathSelection } from './pages/PathSelection'

// In Routes:
<Route path="/" element={<PathSelection />} />
```

**Step 3: Verify it renders**

```bash
npm run dev
```

Navigate to `http://localhost:5173/` — should see the two-card path selection screen.

**Step 4: Commit**

```bash
git add src/pages/PathSelection.tsx src/app.tsx
git commit -m "feat: add path selection page with session resume"
```

---

## Task 7: API Key Setup Page

**Files:**
- Create: `src/pages/ApiKeySetup.tsx`
- Modify: `src/app.tsx`

**Step 1: Build API key setup page**

Create `src/pages/ApiKeySetup.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import type { Path } from '../types'

export function ApiKeySetup() {
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const createNewSession = useBrandGuideStore(s => s.createNewSession)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = apiKey.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setError('API key should start with "sk-ant-"')
      return
    }
    localStorage.setItem('anthropic-api-key', trimmed)
    const pendingPath = localStorage.getItem('pending-path') as Path | null
    localStorage.removeItem('pending-path')
    if (pendingPath) {
      await createNewSession(pendingPath)
      navigate('/wizard/basics')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg font-body flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="font-heading text-2xl font-semibold text-brand-text mb-2">Connect to Claude</h1>
        <p className="text-brand-text-muted text-[15px] leading-relaxed mb-6">
          The Brand Guide Builder uses Claude to conduct your brand interview. Enter your Anthropic API key to get started. Your key is stored locally in your browser and never sent to any server except Anthropic.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Anthropic API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setError('') }}
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text font-body text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all"
          />
          {error && <p className="text-red-500 text-sm mt-1.5">{error}</p>}
          <button
            type="submit"
            disabled={!apiKey.trim()}
            className="mt-4 w-full py-3 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
        <p className="text-brand-text-faint text-xs mt-4 leading-relaxed">
          Don't have an API key? Get one at <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="underline hover:text-brand-text-muted">console.anthropic.com</a>
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Update router**

In `src/app.tsx`:

```tsx
import { ApiKeySetup } from './pages/ApiKeySetup'

// In Routes:
<Route path="/setup" element={<ApiKeySetup />} />
```

**Step 3: Verify**

Navigate to `/setup` — should see key input form.

**Step 4: Commit**

```bash
git add src/pages/ApiKeySetup.tsx src/app.tsx
git commit -m "feat: add API key setup page"
```

---

## Task 8: AI Service & System Prompts

**Files:**
- Create: `src/services/ai.ts`
- Create: `src/services/prompts/builder.ts`
- Create: `src/services/prompts/persona.ts`
- Create: `src/services/prompts/sections/story.ts`
- Create: `src/services/prompts/sections/values.ts`
- Create: `src/services/prompts/sections/personality.ts`
- Create: `src/services/prompts/sections/basics.ts`
- Create: `src/services/prompts/sections/index.ts`
- Create: `src/services/__tests__/prompts.test.ts`

**Step 1: Write persona definitions**

Create `src/services/prompts/persona.ts`:

```ts
export const ENTREPRENEUR_PERSONA = `You are a warm, experienced brand consultant who has worked with hundreds of small businesses. You never assume the user knows branding terminology. You speak plainly but with evident expertise. You celebrate strong answers and reframe weak ones constructively.

Rules:
- Ask ONE question at a time. Never ask multiple questions in a single message.
- Maximum 3 follow-up questions per topic before moving on.
- Follow-up techniques: specificity ("Can you give me an example?"), contrast ("What would be the opposite?"), storytelling ("Tell me about a moment with a customer"), simplification ("How would you explain this to a 12-year-old?")
- If the user gives very short answers for 2 consecutive questions, offer starter options, reframe the question, or suggest skipping and coming back.
- Explain why each question matters in plain language.
- Use the user's own words when reflecting back what they've said.
- Never use jargon without defining it.
- Reference earlier sections naturally when relevant.`

export const INTERN_COACH_PERSONA = `You are an experienced mentor who has supervised many brand projects. You are encouraging but honest. You do not do the work for the intern. You ask questions that guide the intern toward their own conclusions. When the intern is stuck, you offer frameworks rather than answers. When the intern produces good work, you name specifically what was strong so they can replicate it.

Rules:
- Never answer a brand question the intern should discover through research.
- Teach frameworks, not facts. Instead of "Brands have values," say "Values are the beliefs your fellow uses to make hard decisions. When two options both seem good, values are the tiebreaker."
- Celebrate the process, not just the output.
- Scaffold progressively: early sections get more guidance, later sections expect more initiative.
- One question at a time.`
```

**Step 2: Write section-specific prompts (Phase 1 sections)**

Create `src/services/prompts/sections/basics.ts`:

```ts
import type { BrandData } from '../../../types'

export const basicsEntrepreneur = {
  goal: 'Gather the organization name, type, and industry.',
  opener: "Let's start with the basics about your organization. What's the name of your business or organization?",
  fields: ['orgName', 'orgType', 'industry'],
  reviewInstruction: `Generate a section review for "The Basics" section. Return JSON:
{
  "draft": "A brief introductory paragraph about the organization that weaves together the name, type, and industry into a professional description.",
  "suggestions": ["1-2 optional refinements"],
  "alternatives": [{"option": "An alternative framing", "rationale": "Why this might work"}],
  "teachingMoment": "1-2 sentences on why getting the basics right matters for a brand guide."
}`,
}

export const basicsIntern = {
  ...basicsEntrepreneur,
  opener: "Let's start by gathering some basic information about your fellow's organization. What's the name of the business or organization you're working with?",
}
```

Create `src/services/prompts/sections/story.ts`:

```ts
export const storyEntrepreneur = {
  goal: 'Uncover the origin story, core offering, and target audience.',
  opener: "Now let's get into the heart of things — your story. Every brand starts with a reason. Why did you start this? What were you trying to solve or change?",
  fields: ['originStory', 'whatYouDo', 'whoYouServe'],
  reviewInstruction: `Generate a section review for "Your Story" section. Return JSON:
{
  "draft": "A compelling brand story section (3-4 paragraphs) covering: the origin and motivation, what the organization does, and who it serves. Written at professional copywriting level — not a summary of user input, but a polished elevation of it. Use the user's own words and energy where possible.",
  "suggestions": ["1-2 optional refinements to strengthen the narrative"],
  "alternatives": [{"option": "A different narrative angle or emphasis", "rationale": "Why this angle might resonate differently"}],
  "teachingMoment": "1-2 sentences on why origin stories matter for brand identity."
}`,
}

export const storyIntern = {
  ...storyEntrepreneur,
  opener: "Let's talk about what you learned from your research about the fellow's story. When you asked them why they started this, what did they say?",
}
```

Create `src/services/prompts/sections/values.ts`:

```ts
export const valuesEntrepreneur = {
  goal: 'Identify 3 core brand values with practical descriptions.',
  opener: "Let's talk about what you stand for. Values are the beliefs that guide your decisions — especially the hard ones. Think of a time you had to make a tough choice in your business. What principle guided you?",
  fields: ['value1Name', 'value1Desc', 'value2Name', 'value2Desc', 'value3Name', 'value3Desc'],
  reviewInstruction: `Generate a section review for "Brand Values" section. Return JSON:
{
  "draft": "A values section with 3 clearly named values, each with a 2-3 sentence description of what it means in practice. Values should be distinctive and specific to this organization, not generic (avoid 'Quality', 'Excellence', 'Innovation' unless the user's words truly support them).",
  "suggestions": ["1-2 refinements to make values more distinctive or actionable"],
  "alternatives": [{"option": "An alternative framing of a value", "rationale": "Why this framing might be stronger"}],
  "teachingMoment": "1-2 sentences on how values differentiate brands and guide decisions."
}`,
}

export const valuesIntern = {
  ...valuesEntrepreneur,
  opener: "Values are where the brand gets real. What did you discover about what your fellow truly stands for? When you asked about something they'd never compromise on, what did they say?",
}
```

Create `src/services/prompts/sections/personality.ts`:

```ts
export const personalityEntrepreneur = {
  goal: 'Define personality traits, brand voice, and anti-traits.',
  opener: "If your brand were a person at a dinner party, how would other people describe them? Not what you do, but the energy and personality people feel when they interact with your brand.",
  fields: ['personalityTraits', 'brandVoice', 'brandNot'],
  reviewInstruction: `Generate a section review for "Brand Personality" section. Return JSON:
{
  "draft": "A personality section covering: 3-5 personality traits with brief explanations, a voice description that captures how the brand should sound in all communications, and a 'What We Are Not' section that draws clear boundaries. The voice description should be vivid and practical, not just adjectives.",
  "suggestions": ["1-2 refinements to sharpen the personality or resolve contradictions"],
  "alternatives": [{"option": "A different personality framing or voice description", "rationale": "Why this might resonate better"}],
  "teachingMoment": "1-2 sentences on why brand personality matters beyond just tone of voice."
}`,
}

export const personalityIntern = {
  ...personalityEntrepreneur,
  opener: "Brand personality is about how the brand feels to people. Based on your research — reading their social media, watching how they interact with customers — what adjectives would you use to describe the fellow's brand personality?",
}
```

Create `src/services/prompts/sections/index.ts`:

```ts
import { basicsEntrepreneur, basicsIntern } from './basics'
import { storyEntrepreneur, storyIntern } from './story'
import { valuesEntrepreneur, valuesIntern } from './values'
import { personalityEntrepreneur, personalityIntern } from './personality'

export type SectionPrompt = {
  goal: string
  opener: string
  fields: string[]
  reviewInstruction: string
}

const entrepreneurPrompts: Record<string, SectionPrompt> = {
  basics: basicsEntrepreneur,
  story: storyEntrepreneur,
  values: valuesEntrepreneur,
  personality: personalityEntrepreneur,
}

const internPrompts: Record<string, SectionPrompt> = {
  basics: basicsIntern,
  story: storyIntern,
  values: valuesIntern,
  personality: personalityIntern,
}

export function getSectionPrompt(sectionId: string, path: 'entrepreneur' | 'intern'): SectionPrompt | undefined {
  return path === 'entrepreneur' ? entrepreneurPrompts[sectionId] : internPrompts[sectionId]
}
```

**Step 3: Build prompt assembly**

Create `src/services/prompts/builder.ts`:

```ts
import type { Session } from '../../types'
import { SECTIONS } from '../../data/sections'
import { ENTREPRENEUR_PERSONA, INTERN_COACH_PERSONA } from './persona'
import { getSectionPrompt } from './sections'

function buildContextBlock(session: Session): string {
  const approvedSections = SECTIONS.filter(s => session.sections[s.id]?.status === 'approved')
  if (approvedSections.length === 0) return ''

  const lines = ['Previously approved brand data:']
  const d = session.brandData

  if (d.orgName) lines.push(`- Name: ${d.orgName}${d.orgType ? ` (${d.orgType})` : ''}${d.industry ? `, ${d.industry}` : ''}`)
  if (d.originStory) lines.push(`- Story: ${d.originStory.slice(0, 150)}...`)
  if (d.value1Name) {
    const vals = [d.value1Name, d.value2Name, d.value3Name].filter(Boolean).join(', ')
    lines.push(`- Values: ${vals}`)
  }
  if (d.personalityTraits) lines.push(`- Personality: ${d.personalityTraits}`)
  if (d.brandVoice) lines.push(`- Voice: ${d.brandVoice}`)
  if (d.brandNot) lines.push(`- Not: ${d.brandNot.slice(0, 100)}`)
  if (d.tagline) lines.push(`- Tagline: "${d.tagline}"`)
  if (d.primaryColor) lines.push(`- Primary color: ${d.primaryColor}`)

  return lines.join('\n')
}

export function buildSystemPrompt(session: Session, sectionId: string): string {
  const persona = session.path === 'entrepreneur' ? ENTREPRENEUR_PERSONA : INTERN_COACH_PERSONA
  const context = buildContextBlock(session)
  const sectionPrompt = getSectionPrompt(sectionId, session.path)

  const parts = [
    '# Persona\n\n' + persona,
  ]

  if (context) {
    parts.push('# Context\n\n' + context)
  }

  if (sectionPrompt) {
    parts.push(`# Current Section\n\nGoal: ${sectionPrompt.goal}\n\nData fields to populate through conversation: ${sectionPrompt.fields.join(', ')}`)
  }

  parts.push(`# Constraints\n\n- Ask one question at a time\n- Explain why each question matters in plain language\n- Use the user's own language when reflecting back\n- Never use jargon without defining it\n- When you have gathered enough information for all fields in this section, tell the user you're ready to put together a draft and produce the section review.`)

  if (sectionPrompt) {
    parts.push(`# Review Output\n\nWhen ready to produce the section review, respond with ONLY the following JSON (no markdown fences, no extra text):\n\n${sectionPrompt.reviewInstruction}`)
  }

  return parts.join('\n\n---\n\n')
}

export function getOpener(session: Session, sectionId: string): string {
  const sectionPrompt = getSectionPrompt(sectionId, session.path)
  return sectionPrompt?.opener ?? "Let's work on this section. Tell me what you know so far."
}
```

**Step 4: Build AI service**

Create `src/services/ai.ts`:

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { Message } from '../types'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (client) return client
  const apiKey = localStorage.getItem('anthropic-api-key')
  if (!apiKey) throw new Error('No API key configured')
  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  return client
}

export function resetClient() {
  client = null
}

export async function sendMessage(
  systemPrompt: string,
  messages: Message[],
  onChunk: (text: string) => void,
): Promise<string> {
  const anthropic = getClient()

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6-20250627',
    max_tokens: 2000,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  let fullText = ''

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text
      onChunk(fullText)
    }
  }

  return fullText
}

export function parseSectionReview(text: string): {
  draft: string
  suggestions: string[]
  alternatives: { option: string; rationale: string }[]
  teachingMoment: string
} | null {
  try {
    // Try direct JSON parse
    const parsed = JSON.parse(text)
    if (parsed.draft) return parsed
  } catch {
    // Try extracting JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.draft) return parsed
      } catch { /* fall through */ }
    }
  }
  return null
}
```

**Step 5: Write prompt builder test**

Create `src/services/__tests__/prompts.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, getOpener } from '../prompts/builder'
import type { Session } from '../../types'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test',
    path: 'entrepreneur',
    brandData: {},
    sections: {
      basics: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
      story: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
      values: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
      personality: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
    },
    currentSection: 'basics',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('buildSystemPrompt', () => {
  it('includes entrepreneur persona for entrepreneur path', () => {
    const prompt = buildSystemPrompt(makeSession(), 'story')
    expect(prompt).toContain('warm, experienced brand consultant')
  })

  it('includes intern persona for intern path', () => {
    const prompt = buildSystemPrompt(makeSession({ path: 'intern' }), 'story')
    expect(prompt).toContain('experienced mentor')
  })

  it('includes context block when sections are approved', () => {
    const prompt = buildSystemPrompt(makeSession({
      brandData: { orgName: 'Test Org', orgType: 'Nonprofit' },
      sections: {
        basics: { status: 'approved', approvedDraft: 'test', reviewFeedback: null },
        story: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
        values: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
        personality: { status: 'not_started', approvedDraft: null, reviewFeedback: null },
      },
    }), 'story')
    expect(prompt).toContain('Test Org')
    expect(prompt).toContain('Nonprofit')
  })

  it('includes section goal', () => {
    const prompt = buildSystemPrompt(makeSession(), 'story')
    expect(prompt).toContain('origin story')
  })
})

describe('getOpener', () => {
  it('returns section-specific opener for entrepreneur', () => {
    const opener = getOpener(makeSession(), 'story')
    expect(opener).toContain('heart of things')
  })

  it('returns section-specific opener for intern', () => {
    const opener = getOpener(makeSession({ path: 'intern' }), 'story')
    expect(opener).toContain('research')
  })
})
```

**Step 6: Run tests**

```bash
npx vitest run src/services/__tests__/prompts.test.ts
```

Expected: All tests pass.

**Step 7: Commit**

```bash
git add src/services/ai.ts src/services/prompts/
git commit -m "feat: add AI service with streaming and system prompt builders"
```

---

## Task 9: Chat Components

**Files:**
- Create: `src/components/chat/ChatWindow.tsx`
- Create: `src/components/chat/MessageBubble.tsx`
- Create: `src/components/chat/ChatInput.tsx`

**Step 1: Build MessageBubble**

Create `src/components/chat/MessageBubble.tsx`:

```tsx
import { cn } from '../../lib/utils'
import type { MessageRole } from '../../types'

export function MessageBubble({ role, content, isStreaming }: {
  role: MessageRole
  content: string
  isStreaming?: boolean
}) {
  const isAssistant = role === 'assistant'

  return (
    <div className={cn('flex mb-4', isAssistant ? 'justify-start' : 'justify-end')}>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed',
        isAssistant
          ? 'bg-white border border-brand-border text-brand-text-secondary'
          : 'bg-brand-primary text-white'
      )}>
        <div className="whitespace-pre-wrap">{content}</div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-brand-text-muted/40 ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  )
}
```

**Step 2: Build ChatInput**

Create `src/components/chat/ChatInput.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react'

export function ChatInput({ onSend, disabled, quickChips }: {
  onSend: (message: string) => void
  disabled: boolean
  quickChips?: string[]
}) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [text])

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-brand-border bg-white p-4">
      {quickChips && quickChips.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {quickChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => onSend(chip)}
              disabled={disabled}
              className="text-sm px-3 py-1.5 rounded-full border border-brand-border-dark text-brand-text-muted hover:bg-brand-bg-warm hover:text-brand-text transition-colors disabled:opacity-40"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none px-4 py-3 rounded-xl border border-brand-border-dark bg-brand-bg text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all disabled:opacity-40 font-body"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="px-5 py-3 rounded-xl bg-brand-primary text-white font-medium text-sm hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

**Step 3: Build ChatWindow**

Create `src/components/chat/ChatWindow.tsx`:

```tsx
import { useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import type { Message } from '../../types'

export function ChatWindow({ messages, streamingContent, onSend, isStreaming }: {
  messages: Message[]
  streamingContent: string | null
  onSend: (message: string) => void
  isStreaming: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-1">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {isStreaming && streamingContent && (
          <MessageBubble role="assistant" content={streamingContent} isStreaming />
        )}
      </div>
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/components/chat/
git commit -m "feat: add chat components (ChatWindow, MessageBubble, ChatInput)"
```

---

## Task 10: Section Review Component

**Files:**
- Create: `src/components/review/SectionReview.tsx`

**Step 1: Build SectionReview**

Create `src/components/review/SectionReview.tsx`:

```tsx
import { useState } from 'react'
import type { SectionReviewResponse } from '../../types'

export function SectionReview({ review, onApprove, onRevise, onStartOver }: {
  review: SectionReviewResponse
  onApprove: (draft: string) => void
  onRevise: (direction: string) => void
  onStartOver: () => void
}) {
  const [editedDraft, setEditedDraft] = useState(review.draft)
  const [reviseInput, setReviseInput] = useState('')
  const [showRevise, setShowRevise] = useState(false)

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* Draft */}
      <div className="bg-white rounded-2xl border border-brand-border p-6">
        <h3 className="font-heading text-lg font-semibold text-brand-text mb-3 flex items-center gap-2">
          Draft
        </h3>
        <textarea
          value={editedDraft}
          onChange={e => setEditedDraft(e.target.value)}
          className="w-full min-h-[200px] text-[15px] leading-relaxed text-brand-text-secondary bg-brand-bg rounded-xl p-4 border border-brand-border outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y font-body"
        />
      </div>

      {/* Suggestions */}
      {review.suggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-border p-6">
          <h3 className="font-heading text-lg font-semibold text-brand-text mb-3">Suggestions</h3>
          <ul className="space-y-2">
            {review.suggestions.map((s, i) => (
              <li key={i} className="text-[15px] text-brand-text-secondary leading-relaxed flex items-start gap-2">
                <span className="text-brand-accent-coral mt-0.5 shrink-0">&#9679;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternatives */}
      {review.alternatives.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-border p-6">
          <h3 className="font-heading text-lg font-semibold text-brand-text mb-3">Creative Alternatives</h3>
          <div className="space-y-3">
            {review.alternatives.map((a, i) => (
              <div key={i} className="bg-brand-bg rounded-xl p-4">
                <p className="text-[15px] font-medium text-brand-text">{a.option}</p>
                <p className="text-sm text-brand-text-muted mt-1">{a.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Moment */}
      {review.teachingMoment && (
        <div className="bg-brand-bg-warm rounded-2xl border border-brand-border p-6">
          <h3 className="font-heading text-lg font-semibold text-brand-text mb-2">Why This Matters</h3>
          <p className="text-[15px] text-brand-text-secondary leading-relaxed">{review.teachingMoment}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => onApprove(editedDraft)}
          className="px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors"
        >
          Approve &amp; Continue
        </button>
        {showRevise ? (
          <div className="flex-1 flex gap-2 min-w-[240px]">
            <input
              value={reviseInput}
              onChange={e => setReviseInput(e.target.value)}
              placeholder="What should change?"
              className="flex-1 px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text text-sm outline-none focus:border-brand-primary font-body"
              onKeyDown={e => {
                if (e.key === 'Enter' && reviseInput.trim()) {
                  onRevise(reviseInput.trim())
                  setReviseInput('')
                  setShowRevise(false)
                }
              }}
            />
            <button
              onClick={() => { if (reviseInput.trim()) { onRevise(reviseInput.trim()); setReviseInput(''); setShowRevise(false) } }}
              className="px-4 py-3 rounded-xl bg-brand-bg border border-brand-border-dark text-brand-text text-sm font-medium hover:bg-white transition-colors"
            >
              Send
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRevise(true)}
            className="px-6 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text font-medium text-[15px] hover:bg-brand-bg transition-colors"
          >
            Ask AI to Revise
          </button>
        )}
        <button
          onClick={onStartOver}
          className="px-6 py-3 rounded-xl text-brand-text-muted text-[15px] hover:text-brand-text transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/review/SectionReview.tsx
git commit -m "feat: add SectionReview component with draft editing and actions"
```

---

## Task 11: Wizard Page (Orchestrating Modes)

**Files:**
- Create: `src/pages/WizardSection.tsx`
- Create: `src/components/shared/FallbackForm.tsx`
- Modify: `src/app.tsx`

**Step 1: Build FallbackForm component**

Create `src/components/shared/FallbackForm.tsx`:

```tsx
import type { Field } from '../../types'

export function FallbackForm({ fields, data, onChange }: {
  fields: Field[]
  data: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="max-w-[620px] mx-auto p-6 space-y-7">
      {fields.map(field => (
        <div key={field.key}>
          <label className="block font-body text-[15px] font-semibold text-brand-text mb-1.5 leading-snug">
            {field.label}
          </label>
          {field.help && (
            <p className="text-sm text-brand-text-faint italic mb-2.5 leading-relaxed">{field.help}</p>
          )}
          {field.type === 'textarea' ? (
            <textarea
              value={data[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y font-body leading-relaxed"
            />
          ) : field.type === 'select' ? (
            <select
              value={data[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all font-body appearance-none cursor-pointer"
            >
              <option value="">Choose one...</option>
              {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : field.type === 'color' ? (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={data[field.key] || field.defaultValue || '#1e293b'}
                onChange={e => onChange(field.key, e.target.value)}
                className="w-13 h-11 border-2 border-brand-border-dark rounded-xl cursor-pointer p-0.5 bg-white"
              />
              <code className="text-sm text-brand-text-muted font-body">
                {data[field.key] || field.defaultValue || '#1e293b'}
              </code>
            </div>
          ) : (
            <input
              type="text"
              value={data[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all font-body"
            />
          )}
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Build WizardSection page**

Create `src/pages/WizardSection.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { useConversationStore } from '../stores/conversationStore'
import { getSection } from '../data/sections'
import { buildSystemPrompt, getOpener } from '../services/prompts/builder'
import { sendMessage, parseSectionReview } from '../services/ai'
import { ChatWindow } from '../components/chat/ChatWindow'
import { SectionReview } from '../components/review/SectionReview'
import { FallbackForm } from '../components/shared/FallbackForm'
import type { Message, SectionReviewResponse, EntrepreneurMode } from '../types'

export function WizardSection() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const navigate = useNavigate()
  const session = useBrandGuideStore(s => s.session)
  const updateBrandData = useBrandGuideStore(s => s.updateBrandData)
  const approveSectionDraft = useBrandGuideStore(s => s.approveSectionDraft)
  const updateSectionStatus = useBrandGuideStore(s => s.updateSectionStatus)
  const nextSection = useBrandGuideStore(s => s.nextSection)

  const { messages, isStreaming, loadConversation, addMessage, setStreaming, clearConversation } = useConversationStore()

  const [mode, setMode] = useState<EntrepreneurMode | 'fallback'>('interview')
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [review, setReview] = useState<SectionReviewResponse | null>(null)
  const [apiError, setApiError] = useState(false)

  const section = sectionId ? getSection(sectionId) : undefined

  // Load conversation when section changes
  useEffect(() => {
    if (!session || !sectionId) return
    loadConversation(session.id, sectionId)
    setReview(null)
    setMode('interview')
    setApiError(false)

    // If section already approved, show review mode
    if (session.sections[sectionId]?.status === 'approved') {
      // Could show a "section complete" state, but for now just stay in interview
    }
  }, [session?.id, sectionId, loadConversation])

  // Send AI opener when entering a fresh section
  useEffect(() => {
    if (!session || !sectionId || messages.length > 0 || isStreaming) return
    const opener = getOpener(session, sectionId)
    addMessage({ role: 'assistant', content: opener })
  }, [session, sectionId, messages.length, isStreaming, addMessage])

  const handleSend = useCallback(async (text: string) => {
    if (!session || !sectionId) return

    const userMsg: Message = { role: 'user', content: text }
    await addMessage(userMsg)
    await updateSectionStatus(sectionId, 'in_progress')

    setStreaming(true)
    setStreamingContent('')

    try {
      const systemPrompt = buildSystemPrompt(session, sectionId)
      const allMessages = [...messages, userMsg]
      const response = await sendMessage(systemPrompt, allMessages, setStreamingContent)

      setStreamingContent(null)
      setStreaming(false)

      // Check if response is a section review (JSON)
      const parsed = parseSectionReview(response)
      if (parsed) {
        await addMessage({ role: 'assistant', content: 'Here\'s my draft for this section. Take a look and let me know what you think.' })
        setReview(parsed)
        setMode('review')
      } else {
        await addMessage({ role: 'assistant', content: response })
      }

      setApiError(false)
    } catch (err) {
      console.error('AI error:', err)
      setStreamingContent(null)
      setStreaming(false)
      setApiError(true)
      await addMessage({ role: 'assistant', content: 'I\'m having trouble connecting right now. You can continue filling in the fields manually, or try again in a moment.' })
      setMode('fallback')
    }
  }, [session, sectionId, messages, addMessage, setStreaming, updateSectionStatus])

  const handleApprove = useCallback(async (draft: string) => {
    if (!sectionId) return
    await approveSectionDraft(sectionId, draft)
    const store = useBrandGuideStore.getState()
    await store.nextSection()
    const next = useBrandGuideStore.getState().session?.currentSection
    if (next) navigate(`/wizard/${next}`)
  }, [sectionId, approveSectionDraft, nextSection, navigate])

  const handleRevise = useCallback(async (direction: string) => {
    setMode('interview')
    setReview(null)
    await handleSend(`Please revise the draft: ${direction}`)
  }, [handleSend])

  const handleStartOver = useCallback(async () => {
    await clearConversation()
    setReview(null)
    setMode('interview')
  }, [clearConversation])

  const handleFallbackChange = useCallback(async (key: string, value: string) => {
    await updateBrandData({ [key]: value })
  }, [updateBrandData])

  if (!section || !session) {
    return <div className="flex items-center justify-center h-full text-brand-text-muted font-body">Loading...</div>
  }

  return (
    <div className="h-full flex flex-col">
      {/* Section header */}
      <div className="px-6 pt-6 pb-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold text-brand-text">{section.title}</h2>
          {section.optional && (
            <span className="text-[11px] font-semibold text-brand-text-faint uppercase tracking-wider bg-brand-bg-warm px-2.5 py-0.5 rounded-md">Optional</span>
          )}
        </div>
        <p className="text-brand-text-muted text-[15px] mt-1">{section.subtitle}</p>
      </div>

      {/* API error banner */}
      {apiError && (
        <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          AI assistant is temporarily unavailable. You can continue filling in fields manually.
          <button
            onClick={() => { setApiError(false); setMode('interview') }}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'review' && review ? (
          <div className="overflow-y-auto h-full">
            <SectionReview
              review={review}
              onApprove={handleApprove}
              onRevise={handleRevise}
              onStartOver={handleStartOver}
            />
          </div>
        ) : mode === 'fallback' ? (
          <div className="overflow-y-auto h-full">
            <FallbackForm
              fields={section.fields}
              data={session.brandData}
              onChange={handleFallbackChange}
            />
          </div>
        ) : (
          <ChatWindow
            messages={messages}
            streamingContent={streamingContent}
            onSend={handleSend}
            isStreaming={isStreaming}
          />
        )}
      </div>
    </div>
  )
}
```

**Step 3: Update router**

In `src/app.tsx`, update the wizard route:

```tsx
import { PathSelection } from './pages/PathSelection'
import { ApiKeySetup } from './pages/ApiKeySetup'
import { WizardShell } from './components/layout/WizardShell'
import { WizardSection } from './pages/WizardSection'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PathSelection />} />
      <Route path="/setup" element={<ApiKeySetup />} />
      <Route path="/wizard" element={<WizardShell />}>
        <Route index element={<WizardSection />} />
        <Route path=":sectionId" element={<WizardSection />} />
      </Route>
      <Route path="/review/:token" element={<Placeholder name="Fellow Review" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

Keep the `Placeholder` component for the review route.

**Step 4: Verify end-to-end**

```bash
npm run dev
```

1. Go to `/` → select entrepreneur path → enter API key → should land on `/wizard/basics`
2. See chat with AI opener message
3. Type responses, AI should stream back
4. When AI produces a review, the review card should appear

**Step 5: Commit**

```bash
git add src/pages/WizardSection.tsx src/components/shared/FallbackForm.tsx src/app.tsx
git commit -m "feat: add WizardSection with chat, review, and fallback modes"
```

---

## Task 12: Document Generation

**Files:**
- Create: `src/services/documentGenerator.ts`
- Create: `src/services/__tests__/documentGenerator.test.ts`
- Create: `src/pages/GuidePreview.tsx`

**Step 1: Write failing test**

Create `src/services/__tests__/documentGenerator.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateMarkdown } from '../documentGenerator'
import type { Session } from '../../types'

function makeSession(): Session {
  return {
    id: 'test',
    path: 'entrepreneur',
    brandData: { orgName: 'Test Org', orgType: 'Nonprofit', industry: 'Education' },
    sections: {
      basics: { status: 'approved', approvedDraft: 'Test Org is a nonprofit in the education space.', reviewFeedback: null },
      story: { status: 'approved', approvedDraft: 'Founded to help students succeed.', reviewFeedback: null },
      values: { status: 'approved', approvedDraft: '**Community First**: We always put community needs first.', reviewFeedback: null },
      personality: { status: 'approved', approvedDraft: 'Warm, trustworthy, and bold.', reviewFeedback: null },
    },
    currentSection: 'personality',
    createdAt: '',
    updatedAt: '',
  }
}

describe('generateMarkdown', () => {
  it('includes org name in title', () => {
    const md = generateMarkdown(makeSession())
    expect(md).toContain('# Test Org')
  })

  it('includes all approved section drafts', () => {
    const md = generateMarkdown(makeSession())
    expect(md).toContain('Test Org is a nonprofit')
    expect(md).toContain('Founded to help students succeed')
    expect(md).toContain('Community First')
    expect(md).toContain('Warm, trustworthy, and bold')
  })

  it('skips sections without approved drafts', () => {
    const session = makeSession()
    session.sections.story.status = 'not_started'
    session.sections.story.approvedDraft = null
    const md = generateMarkdown(session)
    expect(md).not.toContain('Founded to help students')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/services/__tests__/documentGenerator.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement document generator**

Create `src/services/documentGenerator.ts`:

```ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import { SECTIONS } from '../data/sections'
import type { Session } from '../types'

const SECTION_TITLES: Record<string, string> = {
  basics: 'Introduction',
  story: 'Brand Story',
  values: 'Brand Values',
  personality: 'Brand Personality',
  visuals_colors: 'Color Palette',
  visuals_logo: 'Logo & Name',
  typography: 'Typography',
  messaging: 'Key Messages',
  application: 'Brand in Use',
  social_media: 'Social Media Guidelines',
  photography: 'Photography & Imagery',
}

export function generateMarkdown(session: Session): string {
  const orgName = session.brandData.orgName || 'Your Organization'
  const lines: string[] = []

  lines.push(`# ${orgName}`)
  lines.push('')
  lines.push('## Brand Guidelines')
  lines.push('')
  lines.push('*Version 1.0*')
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const section of SECTIONS) {
    const state = session.sections[section.id]
    if (!state || state.status !== 'approved' || !state.approvedDraft) continue

    const title = SECTION_TITLES[section.id] || section.title
    lines.push(`## ${title}`)
    lines.push('')
    lines.push(state.approvedDraft)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  lines.push(`*${orgName} Brand Guidelines v1.0*`)
  return lines.join('\n')
}

export function downloadMarkdown(session: Session) {
  const md = generateMarkdown(session)
  const filename = `${(session.brandData.orgName || 'brand').replace(/\s+/g, '-').toLowerCase()}-brand-guide.md`
  const blob = new Blob([md], { type: 'text/markdown' })
  saveAs(blob, filename)
}

export async function downloadDocx(session: Session) {
  const orgName = session.brandData.orgName || 'Your Organization'

  const children: Paragraph[] = []

  // Cover page
  children.push(new Paragraph({ spacing: { before: 4000 } }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: orgName, bold: true, size: 72, font: 'Arial' })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    children: [new TextRun({ text: 'Brand Guidelines', size: 32, color: '64748b', font: 'Arial' })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({ text: 'Version 1.0', size: 20, color: '94a3b8', font: 'Arial' })],
  }))
  children.push(new Paragraph({ children: [new PageBreak()] }))

  // Sections
  for (const section of SECTIONS) {
    const state = session.sections[section.id]
    if (!state || state.status !== 'approved' || !state.approvedDraft) continue

    const title = SECTION_TITLES[section.id] || section.title

    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: title, bold: true, size: 36, font: 'Arial' })],
    }))

    // Split draft by paragraphs
    const paragraphs = state.approvedDraft.split('\n\n').filter(Boolean)
    for (const p of paragraphs) {
      children.push(new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: p.replace(/\n/g, ' '), size: 24, font: 'Arial' })],
      }))
    }

    // Section separator
    children.push(new Paragraph({
      spacing: { before: 300, after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e8e4df', space: 1 } },
    }))
  }

  // Footer
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({ text: `${orgName} Brand Guidelines v1.0`, size: 18, color: '94a3b8', font: 'Arial' })],
  }))

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  })

  const buffer = await Packer.toBlob(doc)
  const filename = `${(orgName).replace(/\s+/g, '-').toLowerCase()}-brand-guide.docx`
  saveAs(buffer, filename)
}
```

**Step 4: Run tests**

```bash
npx vitest run src/services/__tests__/documentGenerator.test.ts
```

Expected: All tests pass.

**Step 5: Build GuidePreview page**

Create `src/pages/GuidePreview.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { SECTIONS } from '../data/sections'
import { downloadMarkdown, downloadDocx } from '../services/documentGenerator'

const SECTION_TITLES: Record<string, string> = {
  basics: 'Introduction',
  story: 'Brand Story',
  values: 'Brand Values',
  personality: 'Brand Personality',
  visuals_colors: 'Color Palette',
  visuals_logo: 'Logo & Name',
  typography: 'Typography',
  messaging: 'Key Messages',
  application: 'Brand in Use',
  social_media: 'Social Media Guidelines',
  photography: 'Photography & Imagery',
}

export function GuidePreview() {
  const navigate = useNavigate()
  const session = useBrandGuideStore(s => s.session)

  if (!session) {
    navigate('/')
    return null
  }

  const approvedSections = SECTIONS.filter(s => {
    const state = session.sections[s.id]
    return state?.status === 'approved' && state.approvedDraft
  })

  return (
    <div className="min-h-screen bg-brand-bg font-body">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-heading text-2xl font-semibold text-brand-text">
            {session.brandData.orgName || 'Your'} Brand Guide
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/wizard/${session.currentSection}`)}
              className="px-5 py-2.5 rounded-xl border border-brand-border-dark bg-white text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors"
            >
              Back to Wizard
            </button>
            <button
              onClick={() => downloadMarkdown(session)}
              className="px-5 py-2.5 rounded-xl border border-brand-border-dark bg-white text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors"
            >
              Download .md
            </button>
            <button
              onClick={() => downloadDocx(session)}
              className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-text-secondary transition-colors"
            >
              Download .docx
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-10 space-y-10">
          {approvedSections.length === 0 ? (
            <p className="text-brand-text-muted text-center py-12">No sections completed yet. Complete sections in the wizard to see your brand guide here.</p>
          ) : (
            approvedSections.map(section => {
              const state = session.sections[section.id]
              const title = SECTION_TITLES[section.id] || section.title
              return (
                <div key={section.id}>
                  <h2 className="font-heading text-xl font-semibold text-brand-text mb-3 pb-2 border-b border-brand-border">{title}</h2>
                  <div className="text-[15px] leading-relaxed text-brand-text-secondary whitespace-pre-wrap">
                    {state.approvedDraft}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 6: Add route**

In `src/app.tsx`, add:

```tsx
import { GuidePreview } from './pages/GuidePreview'

// Add inside Routes, before the catch-all:
<Route path="/preview" element={<GuidePreview />} />
```

**Step 7: Commit**

```bash
git add src/services/documentGenerator.ts src/services/__tests__/documentGenerator.test.ts src/pages/GuidePreview.tsx src/app.tsx
git commit -m "feat: add document generation (markdown + docx) and guide preview page"
```

---

## Task 13: Final Wiring & Verification

**Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 2: Run the full app**

```bash
npm run dev
```

Walk through the full flow:
1. Path selection → Entrepreneur
2. API key entry
3. Basics section: chat with AI, answer questions, review draft, approve
4. Story section: same flow
5. Values section: same flow
6. Personality section: same flow
7. Navigate to `/preview` → see compiled guide
8. Download .md and .docx

**Step 3: Fix any TypeScript errors**

```bash
npx tsc --noEmit
```

Fix any type errors found.

**Step 4: Create CLAUDE.md**

Create `CLAUDE.md` at project root:

```markdown
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

**Data flow**: Zustand stores (reactive UI) ← hydrate/write-through → Dexie.js (IndexedDB persistence). No backend. Anthropic API called directly from browser with user-provided API key.

**Key patterns**:
- Section definitions in `src/data/sections.ts` drive both the AI conversation (field keys = data to extract) and fallback form mode
- System prompts assembled dynamically in `src/services/prompts/builder.ts` from persona + context + section blocks
- AI responses for section reviews are structured JSON parsed by `parseSectionReview()` in `src/services/ai.ts`
- Documents generated client-side from approved drafts, not raw field data

**Two paths share**: layout, sidebar, section definitions, review UI, document generators. They differ in: AI persona, conversation strategy, and the intern path adds research tasks + reflections.

## Design Docs

- `docs/plans/2026-03-25-brand-guide-builder-design.md` — Full technical design
- `docs/plans/2026-03-25-phase-1-implementation.md` — Phase 1 implementation plan

## Visual Identity

Warm off-white background (#faf8f5), Fraunces (headings) + DM Sans (body), slate primary (#1e293b), coral accent (#e07a5f), sage accent (#81b29a). Inherited from the original form-based wizard.
```

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: add CLAUDE.md and finalize Phase 1 wiring"
```

---

## Summary

Phase 1 delivers 13 tasks producing a working entrepreneur path with:
- Project scaffolding (Vite + React + TS + Tailwind + shadcn)
- Core types and 11 section definitions
- IndexedDB persistence via Dexie.js
- Zustand stores with write-through persistence
- Three-panel layout (Header, Sidebar, WizardShell)
- Path selection with session resume
- API key setup
- AI service with streaming and system prompt assembly
- Chat UI (MessageBubble, ChatInput, ChatWindow)
- Section review component (draft editing, suggestions, alternatives, teaching moment)
- Wizard orchestration (interview → review → approve → next section)
- Fallback form mode when API is unavailable
- Document generation (markdown + docx) and preview page

Phase 2 (Intern Path) and Phase 3 (Full 11-section coverage) follow as separate plans.
