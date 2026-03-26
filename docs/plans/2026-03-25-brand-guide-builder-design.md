# Brand Guide Builder: Technical Design

## Overview

AI-powered brand guide builder with two paths: Entrepreneur (direct AI interview) and Intern (guided research + coaching). Standalone React SPA hosted on Vercel/Netlify, no backend. Anthropic API called directly from the browser.

**PRD**: `/Users/timgamory/Downloads/brand-guide-builder-prd-v2.docx`
**Existing wizard reference**: `/Users/timgamory/Downloads/brand-guide-wizard (1).jsx`

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Standalone SPA (not Claude.ai artifact) | Artifact size limits, need real persistence across weeks, future Syngine integration |
| Stack | Vite + React 18 + TypeScript + Tailwind + shadcn/ui | Fast build, strong typing, consistent UI components |
| State | Zustand stores backed by Dexie.js (IndexedDB) | Reactive UI + durable persistence without a backend |
| AI model | claude-sonnet-4-6-20250627 | Latest, best at persona instructions and polished copy |
| API key | User-entered, stored in localStorage | No backend needed for v1. Proxy endpoint planned for later (Vercel Edge Function) |
| Document generation | Client-side via docx-js + markdown | No server dependency |
| Existing wizard | Inherit content design + visual DNA, rebuild architecture | Form-based vs. AI-driven is a fundamental shift |

## Tech Stack

- **Build**: Vite
- **UI**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **State**: Zustand (reactive layer) + Dexie.js (IndexedDB persistence)
- **Routing**: React Router
- **AI**: Anthropic JS SDK (browser), streaming responses
- **Documents**: docx-js (Word), raw string (markdown)
- **Fonts**: Fraunces (headings) + DM Sans (body) — carried from existing wizard

## Project Structure

```
src/
  app.tsx                    # Router setup
  main.tsx                   # Entry point

  components/
    layout/                  # Shell, Sidebar, Header
    chat/                    # ChatWindow, MessageBubble, QuickChips, TypingIndicator
    review/                  # SectionReview (draft/suggestions/alternatives/teaching)
    research/                # TaskCard, TaskList (intern path)
    reflection/              # ReflectionPrompt, ReflectionEntry
    fellow-review/           # ReviewSection, ApprovalToolbar, ReviewDashboard
    shared/                  # Buttons, Cards, Inputs (shadcn wrappers)

  pages/
    PathSelection.tsx        # Two-card choice screen
    ApiKeySetup.tsx          # Enter Anthropic API key
    Wizard.tsx               # Main wizard shell (both paths)
    FellowReview.tsx         # Fellow review view (via token link)

  stores/
    brandGuideStore.ts       # Path, sections, brand data, current section
    conversationStore.ts     # Per-section chat history
    reflectionStore.ts       # Intern reflections
    reviewStore.ts           # Fellow approval status

  services/
    ai.ts                    # Anthropic API wrapper, streaming, retry
    prompts/                 # System prompt builders per path + section
      builder.ts             # Assembles persona + context + section + research blocks
      persona.ts             # Entrepreneur and intern persona definitions
      sections/              # Per-section prompt configs (entrepreneur + intern variants)
    storage.ts               # Dexie.js setup, persistence middleware
    documentGenerator.ts     # Compile approved drafts -> .docx and .md

  data/
    sections.ts              # 11 section definitions, field schemas, order, optional flags
    researchTasks.ts         # Per-section research task templates (intern path)

  types/
    index.ts                 # Shared TypeScript types
```

## Data Layer

### Section Definitions

The existing wizard's `STEPS` array maps to typed section definitions:

```ts
type Field = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'color';
  placeholder?: string;
  help?: string;
  options?: string[];
  defaultValue?: string;
}

type Section = {
  id: string;           // 'basics', 'story', 'values', etc.
  title: string;
  subtitle: string;
  optional: boolean;
  fields: Field[];      // Data schema + fallback form fields
}
```

Fields serve double duty: they define the data shape the AI populates, and they power the fallback form-based mode if the API is unavailable.

### Brand Data

Flat object keyed by field keys — same shape as the existing wizard's data state:

```ts
type BrandData = Record<string, string>
// e.g. { orgName: "Bright Path", originStory: "...", value1Name: "Community First", ... }
```

### Storage Schema (Dexie.js / IndexedDB)

**Table: sessions**
- `id`: string (uuid)
- `path`: 'entrepreneur' | 'intern'
- `brandData`: Record<string, string>
- `sections`: Record<sectionId, { status: SectionStatus, approvedDraft: string, reviewFeedback?: string }>
- `currentSection`: string
- `internMeta?`: { internName, fellowName, startDate }
- `reviewToken?`: string (for fellow review link)
- `createdAt`, `updatedAt`

**Table: conversations**
- `id`: string (sessionId:sectionId)
- `messages`: Array<{ role: 'user' | 'assistant', content: string }>
- `researchTasks?`: Array<{ id, description, type: TaskType, completed, notes }>

**Table: reflections**
- `id`: string (sessionId)
- `entries`: Array<{ sectionId, text, timestamp }>
- `finalSynthesis?`: string

**Table: reviews**
- `id`: string (sessionId)
- `sections`: Record<sectionId, { status: ReviewStatus, notes?: string, reviewedAt?: string }>

Zustand stores hydrate from Dexie on app load and write-through on every mutation.

## Routing & Layout

### Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | PathSelection | Two-card choice or resume existing session |
| `/setup` | ApiKeySetup | Enter Anthropic API key |
| `/wizard` | Wizard | Main wizard shell (redirects to current section) |
| `/wizard/:sectionId` | Wizard | Specific section |
| `/review/:token` | FellowReview | Fellow review view |

### Layout

Three-panel layout inherited from existing wizard:

- **Header** (dark bar): "Brand Guide Builder" + path label + org name + session menu
- **Sidebar** (left, 220px): Section list with status indicators (empty/in-progress/complete), optional badges
- **Main content** (flex): Mode-dependent content area

## Entrepreneur Path

### Mode A: Adaptive Interview

Chat-style interface in main content area:
- AI messages left-aligned, user messages right-aligned
- Single text input at bottom with send button
- Quick-select chips above input for structured choices
- Streaming responses with typing indicator

AI behavior:
- One question at a time
- Max 3 follow-ups per topic before moving on
- Follow-up techniques: specificity, contrast, storytelling, simplification
- 2 consecutive short answers triggers starter options or reframing
- Full context of approved sections in system prompt

Transition: AI decides when enough info is gathered, sends a transition message, UI switches to review.

### Mode B: Section Review

Structured review card with four sections:
1. **Draft** — polished brand guide section, directly editable for quick tweaks
2. **Suggestions** — 1-2 optional refinements
3. **Alternatives** — creative options (e.g., 3 tagline options: safe/moderate/bold with rationale)
4. **Why This Matters** — 1-2 sentence teaching moment

Actions:
- **Approve & Continue** — saves draft, marks complete, advances
- **Ask AI to Revise** — text input for direction, produces new review
- **Start Over** — clears conversation, restarts interview

AI returns review as structured JSON:
```json
{
  "draft": "...",
  "suggestions": ["...", "..."],
  "alternatives": [{ "option": "...", "rationale": "..." }],
  "teachingMoment": "..."
}
```

Fallback: parse as markdown if JSON is malformed.

## Intern Path

### Mode 1: Research Assignment

Task card list in main content area:
- 2-4 tasks per section from `researchTasks.ts` templates
- Four task types, color-coded: Interview (blue), Observe (green), Reflect (amber), Research (purple)
- Each card: description, notes text area, completion checkbox
- Tasks persist across sessions
- "I've done my research — let's discuss" button enabled when >= half tasks done (soft gate)

Scaffolding progression: early sections (Story, Values, Personality) get more tasks and coaching. Later sections expect more initiative.

### Mode 2: Synthesis Conversation

Same chat UI as entrepreneur, different AI behavior:
- Asks about research findings, not direct brand questions
- References intern's task notes in system prompt
- Probes for meaning, corrects misconceptions, draws cross-section connections
- Never answers brand questions the intern should discover through research

### Mode 3: Section Review (with Reflection)

Same review card as entrepreneur path, plus:
- AI-generated reflection prompt below the review card (section-specific)
- Text area for intern's reflection
- Both draft approval AND reflection required to advance

Reflections saved to `reflections` table, compiled into final document.

## Fellow Review

### Submission

Intern clicks "Submit for Fellow Review":
1. Locks all section drafts
2. Generates review token (UUID)
3. Shows shareable URL: `/review/:token`

**v1 limitation**: Review link only works on the same browser/device (same IndexedDB origin). Cross-device requires a backend.

### Review UI

Read-only view of brand guide, section by section:
- Summary dashboard at top: X reviewed, Y approved, Z need changes
- Per-section: approved draft + approval toolbar
- Three actions: Approve, Request Changes (opens notes field), Flag for Discussion
- Fellow does NOT see reflections, research notes, or conversation history

### Approval States

| State | Meaning | Next Step |
|-------|---------|-----------|
| Approved | Fellow accepts as-is | Locked, goes to final guide |
| Changes Requested | Fellow wants revisions | Intern sees note, re-enters section with AI coaching |
| Flagged for Discussion | Needs conversation | Stays unlocked for next 1-on-1 |
| Not Yet Reviewed | Fellow hasn't looked | Appears as pending |

### Presentation View

In-tool slide-style view for intern-fellow review meeting:
- One "slide" per section: key decision, rationale, alternatives considered
- Prev/next navigation, full-screen
- Conversation aid, not an export — simple printable version available

## System Prompts & AI Integration

### API Configuration

- Model: `claude-sonnet-4-6-20250627`
- Streaming: enabled
- Max tokens: 1000 (interview turns), 2000 (section reviews and research assignments)
- Retry: exponential backoff, 3 attempts

### Prompt Assembly

Four blocks assembled dynamically by `services/prompts/builder.ts`:

1. **Persona block** — path-specific identity and behavior rules
2. **Context block** — compressed approved brand data (~50-100 tokens per section, aggressive summarization if total exceeds 2000 tokens)
3. **Section block** — current section goals, question strategy, output format
4. **Research block** (intern only) — task assignments, completion status, synthesis guidance

Per-section prompts live in `services/prompts/sections/` — one file per section, exporting entrepreneur and intern variants.

### Token Budget

- System prompt: ~1500-2500 tokens
- Conversation history: current section only
- If section conversation exceeds ~20 turns, older messages summarized
- Approved sections compressed to key decisions in context block

## Fallback Mode

If API unavailable after 3 retries:
- Banner: "AI assistant is temporarily unavailable. You can continue filling in fields manually."
- UI switches to form-based wizard using field definitions from `sections.ts`
- Research tasks and notes still work without API
- When API recovers, user can re-enter sections for AI coaching on existing input

## Document Generation

### Brand Guide (both paths)

Compiled from `approvedDraft` content across all completed sections. Generated client-side on download:
- `.docx` via docx-js (proper Word document)
- `.md` via string template

Structure and styling inherited from existing wizard's generators, but content comes from AI-polished drafts.

### Reflection Document (intern path only)

Compiled from reflection entries + final synthesis:
- Section-by-section reflections
- Final synthesis: "What do you now understand about branding that you did not before?"
- Self-assessment of research and synthesis process
- Downloadable as `.docx`

## Edge Cases

- **Session management**: Path selection shows existing sessions with resume option. Sessions never auto-deleted.
- **Optional sections**: Social Media and Photography show skip option. Skipped sections excluded from final document.
- **Cross-section consistency**: Final AI pass reviews all approved drafts together, flags inconsistencies as optional suggestions (not a gate).
- **Long conversations**: Messages older than 20 turns in a section get summarized to manage context.

## Visual Design

Inherited from existing wizard:
- Background: warm off-white (`#faf8f5`)
- Fonts: Fraunces (serif, headings) + DM Sans (sans-serif, body)
- Primary color: slate (`#1e293b`)
- Accent: coral (`#e07a5f`), sage (`#81b29a`)
- Rounded corners, subtle shadows, generous whitespace
- Tailwind CSS replaces inline styles

## Implementation Phases

Per PRD Section 10:

1. **Phase 1**: Entrepreneur core + storage (Story, Values, Personality sections)
2. **Phase 2**: Intern path foundation (same 3 sections + research + reflections + fellow review)
3. **Phase 3**: Full 11-section coverage for both paths
4. **Phase 4**: Polish, presentation view, consistency checks, user testing
