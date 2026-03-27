# Home Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the landing page from a bare path-selector into an editorial story page that addresses user objections and communicates product value.

**Architecture:** Single file rewrite of `src/pages/PathSelection.tsx`. Extract each page section (Hero, WhySection, HowItWorks, WhatYouGet, ChoosePath) as local components within the same file. Keep existing state logic (slug, sessions, pendingPath, name modal) intact — only the rendered JSX changes.

**Tech Stack:** React, Tailwind CSS 4, existing brand design tokens (`brand-*` classes)

**Design doc:** `docs/plans/2026-03-27-home-page-redesign-design.md`

---

### Task 1: Restructure page layout from centered flex to scrollable sections

**Files:**
- Modify: `src/pages/PathSelection.tsx:109-177`

**Step 1: Change the outer wrapper**

Replace `flex flex-col items-center justify-center` (centers everything in viewport) with a scrollable page layout. The page is no longer a single-screen centered view — it's a multi-section scrollable page.

```tsx
// OLD: line 110
<div className="min-h-screen bg-brand-bg font-body flex flex-col items-center justify-center p-8">

// NEW:
<div className="min-h-screen bg-brand-bg font-body">
```

Remove the closing `</div>` adjustments accordingly. All sections will be full-width with their own padding and max-width constraints.

**Step 2: Run type check**

Run: `npx tsc -b`
Expected: Clean

**Step 3: Verify in browser**

Run dev server, check page loads without errors. Content will look broken (no centering) — that's expected.

**Step 4: Commit**

```
feat(home): restructure page layout for multi-section scrollable design
```

---

### Task 2: Build Hero section

**Files:**
- Modify: `src/pages/PathSelection.tsx`

**Step 1: Add Hero component**

Add a `Hero` component above the `PathSelection` export. This replaces the current title/subtitle block.

```tsx
function Hero() {
  return (
    <section className="px-6 pt-24 pb-16 md:pt-32 md:pb-20">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-text leading-tight mb-6">
          Your brand already exists.<br />It just needs a guide.
        </h1>
        <p className="text-brand-text-secondary text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
          You already know what your business stands for. Brand Guide Builder draws it out
          through conversation and turns it into a professional document you can share with
          your team, your designer, or your website.
        </p>
        <a
          href="#get-started"
          className="inline-block px-8 py-4 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors"
        >
          Build Your Brand Guide
        </a>
      </div>
    </section>
  )
}
```

**Step 2: Replace old title block with `<Hero />`**

Remove lines 111-114 (the old `<div className="text-center mb-10">` block) and replace with `<Hero />`.

**Step 3: Run type check**

Run: `npx tsc -b`
Expected: Clean

**Step 4: Verify in browser**

Check hero renders with large Fraunces heading, subtext, and CTA button. Button should have `href="#get-started"`.

**Step 5: Commit**

```
feat(home): add editorial hero section with value-oriented headline
```

---

### Task 3: Build "Why a brand guide?" section

**Files:**
- Modify: `src/pages/PathSelection.tsx`

**Step 1: Add WhySection component**

```tsx
function WhySection() {
  const cards = [
    {
      headline: 'Stop explaining yourself differently every time',
      body: 'Your website says one thing, your social media says another, and your elevator pitch changes weekly. A brand guide locks in the language so everyone\u2019s on the same page.',
    },
    {
      headline: 'Give your designer something to work with',
      body: 'When you hire someone to build your website or design a flyer, a brand guide tells them exactly what your brand sounds like, looks like, and stands for\u2009\u2014\u2009no guesswork.',
    },
    {
      headline: 'Look like you\u2019ve been doing this for years',
      body: 'A clear, consistent brand makes a two-person shop look as polished as a company ten times its size.',
    },
  ]

  return (
    <section className="bg-brand-bg-warm px-6 py-16 md:py-20">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-brand-text text-center mb-12">
          Why a brand guide?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-7 border border-brand-border">
              <h3 className="font-heading text-lg font-semibold text-brand-text mb-3 leading-snug">
                {card.headline}
              </h3>
              <p className="text-brand-text-secondary text-[15px] leading-relaxed">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Add `<WhySection />` after `<Hero />` in the render**

**Step 3: Run type check and verify in browser**

Run: `npx tsc -b`
Check: Three cards on warm background, responsive.

**Step 4: Commit**

```
feat(home): add 'why a brand guide?' section with three value cards
```

---

### Task 4: Build "How it works" section

**Files:**
- Modify: `src/pages/PathSelection.tsx`

**Step 1: Add HowItWorks component**

```tsx
function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Have a conversation',
      body: 'Answer questions about your business the way you\u2019d talk to a friend. The AI asks follow-ups, offers suggestions when you\u2019re stuck, and never uses jargon.',
    },
    {
      number: '02',
      title: 'Review your drafts',
      body: 'After each topic, you\u2019ll see a polished draft of that section. Edit it, ask for revisions, or approve it and move on.',
    },
    {
      number: '03',
      title: 'Download your guide',
      body: 'When all sections are complete, download a professional brand guide document ready to share with your team or designer.',
    },
  ]

  return (
    <section className="px-6 py-16 md:py-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-brand-text text-center mb-12">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number}>
              <span className="font-heading text-4xl font-bold text-brand-accent-coral">
                {step.number}
              </span>
              <h3 className="font-heading text-lg font-semibold text-brand-text mt-3 mb-2">
                {step.title}
              </h3>
              <p className="text-brand-text-secondary text-[15px] leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
        <p className="text-center text-brand-text-muted text-[15px] mt-10">
          Most people finish in 2&#8211;3 sessions. No branding experience needed.
        </p>
      </div>
    </section>
  )
}
```

**Step 2: Add `<HowItWorks />` after `<WhySection />`**

**Step 3: Run type check and verify in browser**

Run: `npx tsc -b`
Check: Three numbered steps with coral numbers, reassurance line below.

**Step 4: Commit**

```
feat(home): add 'how it works' three-step process section
```

---

### Task 5: Build "What you'll get" section with mockup and section grid

**Files:**
- Modify: `src/pages/PathSelection.tsx`

**Step 1: Add WhatYouGet component**

```tsx
function WhatYouGet() {
  const sections = [
    { title: 'The Basics', desc: 'Name, industry, and who you serve' },
    { title: 'Your Story', desc: 'Why you started and what drives you' },
    { title: 'What You Stand For', desc: 'The values behind every decision' },
    { title: 'Brand Personality', desc: 'How your brand acts and feels' },
    { title: 'Colors', desc: 'Your palette and when to use each color' },
    { title: 'Logo', desc: 'Usage rules and what to avoid' },
    { title: 'Typography', desc: 'Fonts that match your voice' },
    { title: 'Messaging', desc: 'Tagline, elevator pitch, key messages' },
    { title: 'Application', desc: 'Real-world usage examples' },
    { title: 'Social Media', desc: 'Voice and style for each platform' },
    { title: 'Photography', desc: 'The visual feel of your brand' },
  ]

  return (
    <section className="bg-brand-bg-warm px-6 py-16 md:py-20">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-brand-text text-center mb-12">
          What you&#8217;ll get
        </h2>

        {/* Brand guide mockup */}
        <div className="flex justify-center mb-14">
          <div className="bg-white rounded-2xl border border-brand-border shadow-md p-8 md:p-10 max-w-sm w-full rotate-[-1deg]">
            <p className="text-brand-text-faint text-xs tracking-widest uppercase mb-1">Brand Guide</p>
            <p className="font-heading text-xl font-bold text-brand-text mb-6">Bright Path Consulting</p>

            <div className="mb-5">
              <p className="font-heading text-sm font-semibold text-brand-text mb-1">Brand Story</p>
              <div className="w-full h-px bg-brand-border mb-2" />
              <p className="text-brand-text-secondary text-[13px] leading-relaxed">
                We started Bright Path because first-generation college students deserve a guide who&#8217;s been there.
              </p>
            </div>

            <div className="mb-5">
              <p className="font-heading text-sm font-semibold text-brand-text mb-1">Values</p>
              <div className="w-full h-px bg-brand-border mb-2" />
              <p className="text-brand-text-secondary text-[13px]">
                Community First &middot; Transparency &middot; Boldness
              </p>
            </div>

            <div>
              <p className="font-heading text-sm font-semibold text-brand-text mb-1">Voice</p>
              <div className="w-full h-px bg-brand-border mb-2" />
              <p className="text-brand-text-secondary text-[13px]">
                Warm, direct, and encouraging. Never corporate or stiff.
              </p>
            </div>
          </div>
        </div>

        {/* Section grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <div key={s.title} className="bg-white/60 rounded-xl px-5 py-4 border border-brand-border/60">
              <p className="font-heading text-[15px] font-semibold text-brand-text">{s.title}</p>
              <p className="text-brand-text-muted text-[13px] mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Add `<WhatYouGet />` after `<HowItWorks />`**

**Step 3: Run type check and verify in browser**

Run: `npx tsc -b`
Check: Mockup card with subtle rotation, 11-section grid below.

**Step 4: Commit**

```
feat(home): add 'what you'll get' section with brand guide mockup and section grid
```

---

### Task 6: Wrap path cards and sessions in a ChoosePath section

**Files:**
- Modify: `src/pages/PathSelection.tsx`

**Step 1: Wrap existing path cards and session list in a section**

The existing session cards and path cards remain — just wrap them in a properly styled section with an `id="get-started"` anchor (for the hero CTA).

```tsx
{/* Inside the return, after <WhatYouGet /> */}
<section id="get-started" className="px-6 py-16 md:py-20">
  <div className="max-w-4xl mx-auto">
    <h2 className="font-heading text-2xl md:text-3xl font-semibold text-brand-text text-center mb-10">
      Ready to start?
    </h2>

    {/* Existing sessions block — keep as-is */}
    {sessions.length > 0 && (
      <div className="max-w-2xl mx-auto mb-10 space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand-text mb-2">Continue where you left off</h3>
        {sessions.map(s => (
          <SessionCard key={s.id} session={s} onResume={() => handleResume(s.id)} onDelete={() => handleDelete(s.id)} />
        ))}
      </div>
    )}

    {/* Existing path cards — keep as-is */}
    <div className="flex gap-6 flex-wrap justify-center">
      <PathCard ... />
      <PathCard ... />
    </div>

    <p className="text-center text-brand-text-muted text-[15px] mt-8">
      Your progress is saved automatically. Come back anytime.
    </p>
  </div>
</section>
```

**Step 2: Remove the old standalone session and path card blocks**

They've been moved into the section wrapper above.

**Step 3: Run type check and verify in browser**

Run: `npx tsc -b`
Check: Path cards now sit inside a proper section with "Ready to start?" heading and reassurance line.

**Step 4: Commit**

```
feat(home): wrap path selection in 'ready to start?' section with anchor
```

---

### Task 7: Final polish and responsive verification

**Files:**
- Modify: `src/pages/PathSelection.tsx`

**Step 1: Verify smooth scroll**

Click the "Build Your Brand Guide" CTA in the hero. It should smooth-scroll to the `#get-started` section. If the browser doesn't smooth-scroll by default, add `scroll-behavior: smooth` to the html element in `src/index.css`:

```css
html {
  @apply font-sans;
  scroll-behavior: smooth;
}
```

**Step 2: Check mobile viewport**

Use preview tools to check at mobile width (375px). Verify:
- Hero text wraps cleanly
- Why cards stack to single column
- How-it-works steps stack
- Section grid goes to 1 column
- Path cards stack
- Mockup card centered

**Step 3: Check desktop viewport**

Verify at 1280px:
- Hero centered with constrained width
- 3-column grids for why/how/sections
- Path cards side by side
- Alternating bg colors create visual rhythm

**Step 4: Run full type check and tests**

Run: `npx tsc -b && npx vitest run`
Expected: Clean type check, all tests pass.

**Step 5: Commit**

```
feat(home): final polish, smooth scroll, responsive verification
```

---

### Task 8: Push and verify deployed version

**Step 1: Push**

```bash
git push origin main
```

**Step 2: Verify on Vercel**

Wait for deploy, check `elevate-brand.vercel.app`. Scroll through all sections. Test the CTA button. Test clicking a path card (name modal should appear). Test on mobile viewport.
