# Phase 3: Full 11-Section Coverage — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add section prompts (entrepreneur + intern), research tasks, and reflection prompts for the remaining 7 sections: Colors, Logo & Name, Typography, Messaging, Application, Social Media, Photography.

**Architecture:** Pure data additions. No structural changes. Create one prompt file per section in `src/services/prompts/sections/`, add research tasks to `src/data/researchTasks.ts`, add reflection prompts to `src/components/reflection/ReflectionPrompt.tsx`, wire into the index, and extend the context block in the prompt builder to include new brand data fields.

**Tech Stack:** Same as Phase 1/2 — TypeScript, Vitest

---

## Task 1: Colors Section Prompt + Research Tasks

**Files:**
- Create: `src/services/prompts/sections/colors.ts`
- Modify: `src/data/researchTasks.ts` — add `visuals_colors` tasks
- Modify: `src/components/reflection/ReflectionPrompt.tsx` — add `visuals_colors` prompt

**Step 1: Create colors prompt file**

```ts
// src/services/prompts/sections/colors.ts
import type { SectionPrompt } from './index'

export const colorsEntrepreneur: SectionPrompt = {
  goal: 'Define the brand color palette: primary color, accent colors, and background color with names and usage context.',
  opener: "Now let's talk about color. Color is one of the most immediate ways people recognize a brand. Do you already have a main brand color, or are we starting fresh?",
  fields: ['primaryColor', 'primaryColorName', 'accentColor1', 'accentColor1Name', 'accentColor2', 'accentColor2Name', 'bgColor'],
  reviewInstruction: `Generate a section review for "Colors" section. Return JSON with NO markdown fences:
{"draft": "A color palette section describing: the primary brand color with its name and emotional meaning, 1-2 accent colors with usage guidance (buttons, highlights, etc.), and the background color. Include practical usage rules (when to use each color, minimum contrast ratios, what NOT to pair). Professional quality.", "suggestions": ["1-2 color refinements or usage tips"], "alternatives": [{"option": "An alternative accent color direction", "rationale": "Why this palette might feel different"}], "teachingMoment": "1-2 sentences on how color affects brand recognition and emotional response."}`,
}

export const colorsIntern: SectionPrompt = {
  goal: "Guide the intern to define the fellow's brand color palette based on their research and observations.",
  opener: "Let's work on the color palette. When you looked at the fellow's existing materials — website, social media, business cards — what colors did you see? Do they have established colors, or is this uncharted territory?",
  fields: ['primaryColor', 'primaryColorName', 'accentColor1', 'accentColor1Name', 'accentColor2', 'accentColor2Name', 'bgColor'],
  reviewInstruction: `Generate a section review for "Colors" section. Return JSON with NO markdown fences:
{"draft": "A color palette section describing: the primary brand color with its name and emotional meaning, 1-2 accent colors with usage guidance, and the background color. Include practical usage rules. Built from intern's research.", "suggestions": ["1-2 refinements"], "alternatives": [{"option": "An alternative palette direction", "rationale": "Why this might work"}], "teachingMoment": "1-2 sentences on how color drives brand recognition."}`,
}
```

**Step 2: Add research tasks for `visuals_colors`**

In `src/data/researchTasks.ts`, add to `RESEARCH_TASKS`:

```ts
visuals_colors: [
  { id: 'colors-observe-1', description: "Collect screenshots of the fellow's website, social media, and any marketing materials. What colors appear most? Are they consistent?", type: 'observe' },
  { id: 'colors-research-1', description: 'Look at 2-3 competitors. What colors do they use? How can the fellow stand out while still fitting the industry?', type: 'research' },
  { id: 'colors-reflect-1', description: 'What emotions do the fellow\'s current colors evoke? Do those match the brand personality you defined earlier?', type: 'reflect' },
],
```

**Step 3: Add reflection prompt for `visuals_colors`**

In `src/components/reflection/ReflectionPrompt.tsx`, add to `REFLECTION_PROMPTS`:

```ts
visuals_colors: 'How do colors communicate without words? What did you notice about how the fellow\'s color choices (or lack of them) affect how the brand feels?',
```

**Step 4: Run type check**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/services/prompts/sections/colors.ts src/data/researchTasks.ts src/components/reflection/ReflectionPrompt.tsx
git commit -m "feat: add colors section prompts, research tasks, and reflection"
```

---

## Task 2: Logo & Name Section Prompt + Research Tasks

**Files:**
- Create: `src/services/prompts/sections/logo.ts`
- Modify: `src/data/researchTasks.ts` — add `visuals_logo` tasks
- Modify: `src/components/reflection/ReflectionPrompt.tsx` — add `visuals_logo` prompt

**Step 1: Create logo prompt file**

```ts
// src/services/prompts/sections/logo.ts
import type { SectionPrompt } from './index'

export const logoEntrepreneur: SectionPrompt = {
  goal: 'Document logo status, description, and name spelling/usage rules.',
  opener: "Let's talk about your logo and how your name should be treated. Do you already have a logo?",
  fields: ['hasLogo', 'logoDescription', 'nameSpelling'],
  reviewInstruction: `Generate a section review for "Logo & Name" section. Return JSON with NO markdown fences:
{"draft": "A logo and name guidelines section covering: logo description and what it represents (or guidance for future logo creation), name spelling rules and common mistakes to avoid, usage guidelines (minimum size, clear space, what NOT to do with the logo). Professional quality.", "suggestions": ["1-2 refinements for logo/name usage"], "alternatives": [{"option": "An alternative approach to name treatment", "rationale": "Why this might work better"}], "teachingMoment": "1-2 sentences on why consistent name and logo usage builds brand trust."}`,
}

export const logoIntern: SectionPrompt = {
  goal: "Guide the intern to document the fellow's logo and name usage rules based on their research.",
  opener: "Now let's document how the fellow's name and logo should be used. From your research, do they have a logo? How do they currently use their name across different materials?",
  fields: ['hasLogo', 'logoDescription', 'nameSpelling'],
  reviewInstruction: `Generate a section review for "Logo & Name" section. Return JSON with NO markdown fences:
{"draft": "A logo and name guidelines section covering: logo description, name spelling rules, and usage guidelines. Built from intern's research observations.", "suggestions": ["1-2 refinements"], "alternatives": [{"option": "An alternative name treatment", "rationale": "Why this might work"}], "teachingMoment": "1-2 sentences on why name consistency matters for brand recognition."}`,
}
```

**Step 2: Add research tasks**

```ts
visuals_logo: [
  { id: 'logo-observe-1', description: "Look at how the fellow's name appears across their website, social media, business cards, and emails. Is it spelled the same way everywhere?", type: 'observe' },
  { id: 'logo-interview-1', description: 'Ask the fellow: "Is there a specific way your name should always be written? Any common misspellings that bother you?"', type: 'interview' },
],
```

**Step 3: Add reflection prompt**

```ts
visuals_logo: 'Why does it matter that a name is spelled exactly the same way everywhere? What did you notice about how the fellow currently handles their name and logo?',
```

**Step 4: Type check and commit**

```bash
git add src/services/prompts/sections/logo.ts src/data/researchTasks.ts src/components/reflection/ReflectionPrompt.tsx
git commit -m "feat: add logo & name section prompts, research tasks, and reflection"
```

---

## Task 3: Typography Section Prompt + Research Tasks

**Files:**
- Create: `src/services/prompts/sections/typography.ts`
- Modify: `src/data/researchTasks.ts` — add `typography` tasks
- Modify: `src/components/reflection/ReflectionPrompt.tsx` — add `typography` prompt

**Step 1: Create typography prompt file**

```ts
// src/services/prompts/sections/typography.ts
import type { SectionPrompt } from './index'

export const typographyEntrepreneur: SectionPrompt = {
  goal: 'Define headline and body fonts, typography feel, and usage guidelines.',
  opener: "Typography is the voice of your visual identity — it says a lot before anyone reads a word. Do you already have specific fonts you use, or is this something we need to figure out?",
  fields: ['hasTypography', 'headlineFont', 'bodyFont', 'typographyFeel'],
  reviewInstruction: `Generate a section review for "Typography" section. Return JSON with NO markdown fences:
{"draft": "A typography section covering: headline font choice with rationale, body font choice with readability notes, the overall typographic feel, and practical usage guidelines (when to use each, sizing hierarchy, what to avoid). Professional quality.", "suggestions": ["1-2 font pairing or usage tips"], "alternatives": [{"option": "An alternative font direction", "rationale": "Why this pairing might create a different mood"}], "teachingMoment": "1-2 sentences on how typography shapes perception of a brand."}`,
}

export const typographyIntern: SectionPrompt = {
  goal: "Guide the intern to define typography choices based on their research into the fellow's current usage and brand personality.",
  opener: "Let's talk about fonts and typography. From your research, does the fellow already use specific fonts? What did their existing materials look like typographically?",
  fields: ['hasTypography', 'headlineFont', 'bodyFont', 'typographyFeel'],
  reviewInstruction: `Generate a section review for "Typography" section. Return JSON with NO markdown fences:
{"draft": "A typography section covering: headline and body font choices, the overall feel, and usage guidelines. Built from intern's research.", "suggestions": ["1-2 refinements"], "alternatives": [{"option": "An alternative font direction", "rationale": "Why this might work"}], "teachingMoment": "1-2 sentences on how fonts carry brand personality."}`,
}
```

**Step 2: Add research tasks**

```ts
typography: [
  { id: 'typography-observe-1', description: "Screenshot the fellow's website and marketing materials. What fonts are they using? Are headlines and body text different?", type: 'observe' },
  { id: 'typography-research-1', description: 'Find 2-3 font pairings that match the brand personality you defined. Use Google Fonts to explore options.', type: 'research' },
],
```

**Step 3: Add reflection prompt**

```ts
typography: 'How do fonts affect the way a message is received? What did you learn about the difference between headline and body typography?',
```

**Step 4: Type check and commit**

```bash
git add src/services/prompts/sections/typography.ts src/data/researchTasks.ts src/components/reflection/ReflectionPrompt.tsx
git commit -m "feat: add typography section prompts, research tasks, and reflection"
```

---

## Task 4: Messaging Section Prompt + Research Tasks

**Files:**
- Create: `src/services/prompts/sections/messaging.ts`
- Modify: `src/data/researchTasks.ts` — add `messaging` tasks
- Modify: `src/components/reflection/ReflectionPrompt.tsx` — add `messaging` prompt

**Step 1: Create messaging prompt file**

```ts
// src/services/prompts/sections/messaging.ts
import type { SectionPrompt } from './index'

export const messagingEntrepreneur: SectionPrompt = {
  goal: 'Craft a tagline, elevator pitch, and three key talking points.',
  opener: "Now we're getting to the words that will represent you everywhere. Let's start with the big one — do you have a tagline or slogan? Something short that captures what you're all about?",
  fields: ['tagline', 'elevatorPitch', 'threeThings'],
  reviewInstruction: `Generate a section review for "Key Messages" section. Return JSON with NO markdown fences:
{"draft": "A messaging section with: a polished tagline (3-8 words, memorable and on-brand), a 30-second elevator pitch that clearly communicates who/what/why/how, and 3 key talking points that become go-to messages for all communications. Professional copywriting quality.", "suggestions": ["1-2 messaging refinements"], "alternatives": [{"option": "A safe tagline option", "rationale": "Conservative, clear"}, {"option": "A bold tagline option", "rationale": "Memorable, distinctive"}, {"option": "A playful tagline option", "rationale": "Approachable, human"}], "teachingMoment": "1-2 sentences on why consistent messaging builds brand recognition over time."}`,
}

export const messagingIntern: SectionPrompt = {
  goal: "Guide the intern to craft messaging based on their deep understanding of the fellow's brand story, values, and personality.",
  opener: "Now let's build the messaging framework. Based on everything you've learned about the fellow's brand — their story, values, personality — how would you summarize what they do in one sentence? What's the core message?",
  fields: ['tagline', 'elevatorPitch', 'threeThings'],
  reviewInstruction: `Generate a section review for "Key Messages" section. Return JSON with NO markdown fences:
{"draft": "A messaging section with: a polished tagline, elevator pitch, and 3 key talking points. Built from the intern's synthesis of all prior sections.", "suggestions": ["1-2 refinements"], "alternatives": [{"option": "A safe tagline", "rationale": "Why"}, {"option": "A bold tagline", "rationale": "Why"}], "teachingMoment": "1-2 sentences on how messaging ties together all the brand work done so far."}`,
}
```

**Step 2: Add research tasks**

```ts
messaging: [
  { id: 'messaging-interview-1', description: 'Ask the fellow: "If you had 30 seconds in an elevator, how would you describe what you do and why it matters?"', type: 'interview' },
  { id: 'messaging-observe-1', description: 'Look at the fellow\'s website homepage, social bios, and email signatures. What language do they already use to describe themselves?', type: 'observe' },
  { id: 'messaging-research-1', description: 'Find 3 taglines from brands the fellow admires. What makes them work? What patterns do you see?', type: 'research' },
],
```

**Step 3: Add reflection prompt**

```ts
messaging: 'How does a tagline differ from a mission statement? What did you learn about distilling a complex organization into a few memorable words?',
```

**Step 4: Type check and commit**

```bash
git add src/services/prompts/sections/messaging.ts src/data/researchTasks.ts src/components/reflection/ReflectionPrompt.tsx
git commit -m "feat: add messaging section prompts, research tasks, and reflection"
```

---

## Task 5: Application Section Prompt + Research Tasks

**Files:**
- Create: `src/services/prompts/sections/application.ts`
- Modify: `src/data/researchTasks.ts` — add `application` tasks
- Modify: `src/components/reflection/ReflectionPrompt.tsx` — add `application` prompt

**Step 1: Create application prompt file**

```ts
// src/services/prompts/sections/application.ts
import type { SectionPrompt } from './index'

export const applicationEntrepreneur: SectionPrompt = {
  goal: 'Define primary brand channels and create do/don\'t usage guidelines.',
  opener: "We've built your brand identity — now let's talk about where it lives in the real world. Where do people usually find you or interact with you?",
  fields: ['primaryChannels', 'doList', 'dontList'],
  reviewInstruction: `Generate a section review for "Putting It All Together" section. Return JSON with NO markdown fences:
{"draft": "A brand application section covering: primary channels where the brand appears (with channel-specific guidance), a clear DO list of brand behaviors to always follow, and a DON'T list of things to avoid. Practical, actionable guidelines that anyone representing the brand can follow. Professional quality.", "suggestions": ["1-2 application refinements"], "alternatives": [{"option": "A different organizational approach for the guidelines", "rationale": "Why this structure might be easier to follow"}], "teachingMoment": "1-2 sentences on why brand guidelines need to be practical and specific to be useful."}`,
}

export const applicationIntern: SectionPrompt = {
  goal: "Guide the intern to create practical brand usage guidelines based on where and how the fellow's brand shows up.",
  opener: "Now we bring everything together into practical guidelines. From your research, where does the fellow's brand show up most — website, social media, events, email? What works well and what feels off-brand?",
  fields: ['primaryChannels', 'doList', 'dontList'],
  reviewInstruction: `Generate a section review for "Putting It All Together" section. Return JSON with NO markdown fences:
{"draft": "A brand application section with channels, do list, and don't list. Built from intern's research and observations.", "suggestions": ["1-2 refinements"], "alternatives": [{"option": "A different guideline structure", "rationale": "Why this might work"}], "teachingMoment": "1-2 sentences on why brand guidelines need to be usable by anyone, not just designers."}`,
}
```

**Step 2: Add research tasks**

```ts
application: [
  { id: 'application-observe-1', description: "Audit the fellow's brand touchpoints: website, email, social, print materials, events. Where does the brand feel strong? Where does it feel inconsistent?", type: 'observe' },
  { id: 'application-interview-1', description: 'Ask the fellow: "What makes you cringe when you see your brand represented poorly? What do you wish everyone just knew?"', type: 'interview' },
],
```

**Step 3: Add reflection prompt**

```ts
application: 'What makes brand guidelines actually useful vs. just a document that sits in a drawer? How would you make these guidelines easy for the fellow\'s team to follow?',
```

**Step 4: Type check and commit**

```bash
git add src/services/prompts/sections/application.ts src/data/researchTasks.ts src/components/reflection/ReflectionPrompt.tsx
git commit -m "feat: add application section prompts, research tasks, and reflection"
```

---

## Task 6: Social Media Section Prompt + Research Tasks

**Files:**
- Create: `src/services/prompts/sections/socialMedia.ts`
- Modify: `src/data/researchTasks.ts` — add `social_media` tasks
- Modify: `src/components/reflection/ReflectionPrompt.tsx` — add `social_media` prompt

**Step 1: Create social media prompt file**

```ts
// src/services/prompts/sections/socialMedia.ts
import type { SectionPrompt } from './index'

export const socialMediaEntrepreneur: SectionPrompt = {
  goal: 'Define social media platforms, voice, content do/don\'ts, hashtags, and posting frequency.',
  opener: "Let's talk about social media — an optional but powerful section. Which platforms are you on, or planning to be on?",
  fields: ['socialPlatforms', 'socialVoice', 'socialDo', 'socialDont', 'socialHashtags', 'socialFrequency'],
  reviewInstruction: `Generate a section review for "Social Media" section. Return JSON with NO markdown fences:
{"draft": "A social media guidelines section covering: active platforms with platform-specific voice notes, content types to post (with examples), content to avoid, branded hashtags, and posting cadence. Practical and actionable. Professional quality.", "suggestions": ["1-2 social media strategy refinements"], "alternatives": [{"option": "A different posting strategy", "rationale": "Why this cadence might work better"}], "teachingMoment": "1-2 sentences on how social media voice can vary by platform while staying on-brand."}`,
}

export const socialMediaIntern: SectionPrompt = {
  goal: "Guide the intern to create social media guidelines from their audit of the fellow's current social presence.",
  opener: "This section is optional but valuable. From your research, what's the fellow's social media presence like? Which platforms are they active on? What's working and what's not?",
  fields: ['socialPlatforms', 'socialVoice', 'socialDo', 'socialDont', 'socialHashtags', 'socialFrequency'],
  reviewInstruction: `Generate a section review for "Social Media" section. Return JSON with NO markdown fences:
{"draft": "A social media guidelines section with platforms, voice, content do/don'ts, hashtags, and cadence. Built from intern's social media audit.", "suggestions": ["1-2 refinements"], "alternatives": [{"option": "A different content strategy", "rationale": "Why this might work"}], "teachingMoment": "1-2 sentences on why social media needs its own guidelines beyond the general brand voice."}`,
}
```

**Step 2: Add research tasks**

```ts
social_media: [
  { id: 'social-observe-1', description: "Audit the fellow's social media accounts. What are they posting? How often? What gets engagement? What falls flat?", type: 'observe' },
  { id: 'social-research-1', description: 'Find 2 organizations in a similar space with strong social media. What content types, tone, and cadence do they use?', type: 'research' },
],
```

**Step 3: Add reflection prompt**

```ts
social_media: 'How does a brand\'s social media voice differ from its overall brand voice? When is it appropriate to be different on different platforms?',
```

**Step 4: Type check and commit**

```bash
git add src/services/prompts/sections/socialMedia.ts src/data/researchTasks.ts src/components/reflection/ReflectionPrompt.tsx
git commit -m "feat: add social media section prompts, research tasks, and reflection"
```

---

## Task 7: Photography Section Prompt + Research Tasks

**Files:**
- Create: `src/services/prompts/sections/photography.ts`
- Modify: `src/data/researchTasks.ts` — add `photography` tasks
- Modify: `src/components/reflection/ReflectionPrompt.tsx` — add `photography` prompt

**Step 1: Create photography prompt file**

```ts
// src/services/prompts/sections/photography.ts
import type { SectionPrompt } from './index'

export const photographyEntrepreneur: SectionPrompt = {
  goal: 'Define photo style, subjects, mood, editing preferences, and icon style.',
  opener: "Last optional section — photography and imagery. The visual feel of your brand beyond the logo. What kind of photos best represent who you are?",
  fields: ['photoStyle', 'photoSubjects', 'photoAvoid', 'photoMood', 'photoEditing', 'iconStyle'],
  reviewInstruction: `Generate a section review for "Photography & Imagery" section. Return JSON with NO markdown fences:
{"draft": "A photography and imagery guidelines section covering: preferred photo style with examples, key subjects to feature, imagery to avoid, the mood photos should create, editing preferences (tone, saturation, warmth), and icon/illustration style if applicable. Visual and specific. Professional quality.", "suggestions": ["1-2 imagery refinements"], "alternatives": [{"option": "A different visual direction", "rationale": "Why this style might create a different brand impression"}], "teachingMoment": "1-2 sentences on how consistent visual imagery reinforces brand identity beyond words."}`,
}

export const photographyIntern: SectionPrompt = {
  goal: "Guide the intern to define photography guidelines from their observations of the fellow's existing visual identity.",
  opener: "Final optional section — let's talk about the visual side beyond colors and logo. From your research, what kind of images does the fellow currently use? What feels authentic to their brand?",
  fields: ['photoStyle', 'photoSubjects', 'photoAvoid', 'photoMood', 'photoEditing', 'iconStyle'],
  reviewInstruction: `Generate a section review for "Photography & Imagery" section. Return JSON with NO markdown fences:
{"draft": "A photography and imagery guidelines section with style, subjects, mood, editing, and icon guidance. Built from intern's visual audit.", "suggestions": ["1-2 refinements"], "alternatives": [{"option": "A different visual direction", "rationale": "Why this might work"}], "teachingMoment": "1-2 sentences on how photography shapes first impressions of a brand."}`,
}
```

**Step 2: Add research tasks**

```ts
photography: [
  { id: 'photo-observe-1', description: "Collect the fellow's best and worst photos from their website and social media. What patterns do you see? What feels on-brand vs. off-brand?", type: 'observe' },
  { id: 'photo-research-1', description: 'Find 3-5 photos from other brands that capture the mood and style you think fits the fellow. Create a mini mood board.', type: 'research' },
],
```

**Step 3: Add reflection prompt**

```ts
photography: 'How do images shape someone\'s first impression of a brand? What did you learn about the gap between how the fellow sees their visual identity and how others experience it?',
```

**Step 4: Type check and commit**

```bash
git add src/services/prompts/sections/photography.ts src/data/researchTasks.ts src/components/reflection/ReflectionPrompt.tsx
git commit -m "feat: add photography section prompts, research tasks, and reflection"
```

---

## Task 8: Wire All Section Prompts into Index + Update Context Block

**Files:**
- Modify: `src/services/prompts/sections/index.ts` — import and register all 7 new sections
- Modify: `src/services/prompts/builder.ts` — extend `buildContextBlock` for new brand data fields
- Modify: `src/data/sections.ts` — remove `PHASE_1_SECTION_IDS` (no longer needed)
- Modify: `src/data/__tests__/sections.test.ts` — remove any test referencing `PHASE_1_SECTION_IDS`

**Step 1: Update the section prompt index**

In `src/services/prompts/sections/index.ts`, add imports and register all new prompts:

```ts
import { colorsEntrepreneur, colorsIntern } from './colors'
import { logoEntrepreneur, logoIntern } from './logo'
import { typographyEntrepreneur, typographyIntern } from './typography'
import { messagingEntrepreneur, messagingIntern } from './messaging'
import { applicationEntrepreneur, applicationIntern } from './application'
import { socialMediaEntrepreneur, socialMediaIntern } from './socialMedia'
import { photographyEntrepreneur, photographyIntern } from './photography'
```

Add to `entrepreneurPrompts`:
```ts
visuals_colors: colorsEntrepreneur,
visuals_logo: logoEntrepreneur,
typography: typographyEntrepreneur,
messaging: messagingEntrepreneur,
application: applicationEntrepreneur,
social_media: socialMediaEntrepreneur,
photography: photographyEntrepreneur,
```

Add to `internPrompts`:
```ts
visuals_colors: colorsIntern,
visuals_logo: logoIntern,
typography: typographyIntern,
messaging: messagingIntern,
application: applicationIntern,
social_media: socialMediaIntern,
photography: photographyIntern,
```

**Step 2: Extend `buildContextBlock` in `src/services/prompts/builder.ts`**

Add lines for the new fields:

```ts
if (d.primaryColor) lines.push(`- Primary color: ${d.primaryColor}${d.primaryColorName ? ` (${d.primaryColorName})` : ''}`)
if (d.accentColor1) lines.push(`- Accent: ${d.accentColor1}${d.accentColor1Name ? ` (${d.accentColor1Name})` : ''}`)
if (d.hasLogo) lines.push(`- Logo: ${d.hasLogo}`)
if (d.headlineFont) lines.push(`- Headline font: ${d.headlineFont}`)
if (d.bodyFont) lines.push(`- Body font: ${d.bodyFont}`)
if (d.tagline) lines.push(`- Tagline: "${d.tagline}"`)
if (d.elevatorPitch) lines.push(`- Pitch: ${d.elevatorPitch.slice(0, 150)}`)
if (d.primaryChannels) lines.push(`- Channels: ${d.primaryChannels.slice(0, 100)}`)
```

Note: some of these (primaryColor, tagline) may already be there. Don't duplicate — just add the missing ones.

**Step 3: Remove `PHASE_1_SECTION_IDS`**

In `src/data/sections.ts`, remove:
```ts
export const PHASE_1_SECTION_IDS = ['basics', 'story', 'values', 'personality'] as const
```

Check if anything imports it — if so, remove those imports too.

**Step 4: Run tests**

Run: `npx vitest run`
Expected: All tests pass

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/services/prompts/sections/index.ts src/services/prompts/builder.ts src/data/sections.ts src/data/__tests__/sections.test.ts
git commit -m "feat: wire all 11 sections into prompt index + extend context block"
```

---

## Task 9: Test Coverage for All Section Prompts

**Files:**
- Modify: `src/services/__tests__/prompts.test.ts` — add tests for all 11 sections

**Step 1: Add comprehensive prompt test**

Read the existing prompts test first, then add tests that verify all 11 sections have entrepreneur and intern prompts:

```ts
import { ALL_SECTION_IDS } from '../../data/sections'

describe('section prompt coverage', () => {
  it('has entrepreneur prompts for all sections', () => {
    for (const id of ALL_SECTION_IDS) {
      const prompt = getSectionPrompt(id, 'entrepreneur')
      expect(prompt, `Missing entrepreneur prompt for ${id}`).toBeDefined()
      expect(prompt!.goal).toBeTruthy()
      expect(prompt!.opener).toBeTruthy()
      expect(prompt!.fields.length).toBeGreaterThan(0)
      expect(prompt!.reviewInstruction).toBeTruthy()
    }
  })

  it('has intern prompts for all sections', () => {
    for (const id of ALL_SECTION_IDS) {
      const prompt = getSectionPrompt(id, 'intern')
      expect(prompt, `Missing intern prompt for ${id}`).toBeDefined()
      expect(prompt!.goal).toBeTruthy()
      expect(prompt!.opener).toBeTruthy()
      expect(prompt!.fields.length).toBeGreaterThan(0)
      expect(prompt!.reviewInstruction).toBeTruthy()
    }
  })
})
```

Also add a research task coverage test in `src/data/__tests__/researchTasks.test.ts`:

```ts
import { ALL_SECTION_IDS } from '../sections'

it('has research tasks for all sections', () => {
  for (const id of ALL_SECTION_IDS) {
    const tasks = getResearchTasks(id)
    expect(tasks.length, `Missing research tasks for ${id}`).toBeGreaterThanOrEqual(2)
  }
})
```

**Step 2: Run tests**

Run: `npx vitest run`
Expected: All pass

**Step 3: Commit**

```bash
git add src/services/__tests__/prompts.test.ts src/data/__tests__/researchTasks.test.ts
git commit -m "test: add full coverage tests for all 11 section prompts and research tasks"
```

---

## Summary

| Task | Section | Files |
|------|---------|-------|
| 1 | Colors | `sections/colors.ts`, researchTasks, reflections |
| 2 | Logo & Name | `sections/logo.ts`, researchTasks, reflections |
| 3 | Typography | `sections/typography.ts`, researchTasks, reflections |
| 4 | Messaging | `sections/messaging.ts`, researchTasks, reflections |
| 5 | Application | `sections/application.ts`, researchTasks, reflections |
| 6 | Social Media | `sections/socialMedia.ts`, researchTasks, reflections |
| 7 | Photography | `sections/photography.ts`, researchTasks, reflections |
| 8 | Wire index + context block | `sections/index.ts`, `builder.ts`, `sections.ts` |
| 9 | Test coverage | prompts.test.ts, researchTasks.test.ts |
