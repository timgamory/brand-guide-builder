# UX/UI Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 9 UX/UI improvements from the audit covering navigation flow, button hierarchy, sidebar indicators, chat layout, and input affordances.

**Architecture:** All changes are component-level JSX/CSS in existing React files. No backend, store, or data model changes. The project has no component-level tests (tests cover services, stores, hooks, and data modules), so verification is visual via dev server.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4 (with custom theme tokens in `src/index.css`), Lucide React icons, `cn()` utility from `src/lib/utils.ts`

---

### Task 1: Add helper function to get next section info

We need a utility to determine what comes after a given section. The existing `nextSection()` in the store navigates but doesn't return info. We need the next section's `id` and `title` for the CTA button.

**Files:**
- Modify: `src/data/sections.ts:147-149`
- Modify: `src/data/__tests__/sections.test.ts` (add test)

**Step 1: Write the failing test**

Add to `src/data/__tests__/sections.test.ts`:

```typescript
import { getNextSection } from '../sections'

describe('getNextSection', () => {
  it('returns the next section after a given id', () => {
    const next = getNextSection('basics')
    expect(next).toEqual({ id: 'story', title: 'Your Story' })
  })

  it('returns null for the last section', () => {
    const next = getNextSection('photography')
    expect(next).toBeNull()
  })

  it('returns null for unknown section id', () => {
    const next = getNextSection('nonexistent')
    expect(next).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/sections.test.ts`
Expected: FAIL — `getNextSection` is not exported

**Step 3: Write the implementation**

Add to `src/data/sections.ts` after the existing `getSectionIndex` function:

```typescript
export function getNextSection(currentId: string): { id: string; title: string } | null {
  const index = SECTIONS.findIndex(s => s.id === currentId)
  if (index === -1 || index >= SECTIONS.length - 1) return null
  const next = SECTIONS[index + 1]
  return { id: next.id, title: next.title }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/sections.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/sections.ts src/data/__tests__/sections.test.ts
git commit -m "feat: add getNextSection helper for navigation CTA"
```

---

### Task 2: Redesign approved section view — Next Section CTA, button hierarchy, Save & Exit

This is the big one — redesigns the entire approved section block in `WizardSection.tsx`.

**Files:**
- Modify: `src/pages/WizardSection.tsx:1-10` (add import)
- Modify: `src/pages/WizardSection.tsx:272-303` (approved section block)

**Step 1: Add import for getNextSection**

At the top of `src/pages/WizardSection.tsx`, add to the existing import from `../data/sections`:

```typescript
import { getSection, getNextSection } from '../data/sections'
```

**Step 2: Replace the approved section block**

Replace lines 272-303 (the `session.sections[sectionId ?? '']?.status === 'approved' && mode !== 'review'` branch) with:

```tsx
{session.sections[sectionId ?? '']?.status === 'approved' && mode !== 'review' ? (
  <div className="overflow-y-auto h-full">
    <div className="max-w-full md:max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Save & Exit link */}
      <button
        onClick={() => navigate('/dashboard')}
        className="text-sm text-brand-text-muted hover:text-brand-text transition-colors"
      >
        &larr; Save &amp; Exit
      </button>

      {/* Success banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
        <span>&#10003;</span> This section has been approved.
      </div>

      {/* Approved draft card */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 md:p-6">
        <h3 className="font-heading text-lg font-semibold text-brand-text mb-3">Approved Draft</h3>
        <div className="text-body leading-relaxed text-brand-text-secondary whitespace-pre-wrap">
          {session.sections[sectionId ?? '']?.approvedDraft}
        </div>
      </div>

      {/* Refine / Start over actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRefine}
          className="px-4 py-2 rounded-lg border border-brand-primary text-brand-primary text-sm font-medium hover:bg-brand-primary/5 transition-colors"
        >
          Refine this section
        </button>
        <button
          onClick={() => {
            if (window.confirm('Are you sure? This will discard your approved draft and start the conversation over.')) {
              handleStartOver()
            }
          }}
          className="text-sm text-red-400/70 hover:text-red-600 transition-colors"
        >
          Start over
        </button>
      </div>

      {/* Next Section CTA */}
      {(() => {
        const next = sectionId ? getNextSection(sectionId) : null
        return next ? (
          <button
            onClick={() => navigate(`/wizard/${next.id}`)}
            className="w-full py-3.5 rounded-xl bg-brand-accent-coral text-white font-semibold text-body hover:bg-brand-accent-coral/90 transition-colors"
          >
            Continue to {next.title} &rarr;
          </button>
        ) : (
          <button
            onClick={() => navigate('/preview')}
            className="w-full py-3.5 rounded-xl bg-brand-accent-coral text-white font-semibold text-body hover:bg-brand-accent-coral/90 transition-colors"
          >
            Preview Brand Guide &rarr;
          </button>
        )
      })()}
    </div>
  </div>
)
```

**Step 3: Add Save & Exit to review mode**

Find the review mode block (around line 313-330). Insert a Save & Exit link at the top of the `SectionReview` wrapper. Wrap the existing `<SectionReview>` and `<ReflectionPrompt>` in a container and prepend:

```tsx
) : mode === 'review' && review ? (
  <div className="overflow-y-auto h-full">
    <div className="max-w-full md:max-w-2xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="text-sm text-brand-text-muted hover:text-brand-text transition-colors"
      >
        &larr; Save &amp; Exit
      </button>
    </div>
    <SectionReview
      review={review}
      onApprove={handleApprove}
      onRevise={handleRevise}
      disableApprove={isIntern && !reflectionText.trim()}
    />
    {isIntern && sectionId && (
      <div className="max-w-full md:max-w-2xl mx-auto px-4 md:px-6 pb-6">
        <ReflectionPrompt
          sectionId={sectionId}
          value={reflectionText}
          onChange={setReflectionText}
        />
      </div>
    )}
  </div>
```

**Step 4: Verify the build compiles**

Run: `npx tsc -b`
Expected: no errors

**Step 5: Visual verification**

Run: `npm run dev`
Open the wizard, navigate to an approved section. Verify:
- "← Save & Exit" link appears at top
- Green success banner
- Approved draft card
- "Refine this section" is an outlined button
- "Start over" is a muted red text link
- "Continue to [Next Section] →" is a prominent coral button at bottom
- Clicking "Start over" shows a confirmation dialog

**Step 6: Commit**

```bash
git add src/pages/WizardSection.tsx
git commit -m "feat(ux): redesign approved section with Next CTA, button hierarchy, Save & Exit"
```

---

### Task 3: Redesign sidebar status indicators and optional labels

Replace text-symbol `StatusIcon` with styled circle indicators and change "opt" to "(optional)".

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:1-90` (full rewrite of StatusIcon + optional badge)

**Step 1: Update imports**

Add Lucide `Check` icon import at the top of `Sidebar.tsx`:

```typescript
import { LogOut, Check } from 'lucide-react'
```

**Step 2: Replace StatusIcon component**

Replace the existing `StatusIcon` function (lines 9-20) with:

```tsx
function StatusIcon({ status }: { status: SectionStatus }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-accent-sage text-white shrink-0" aria-label="completed">
        <Check size={12} strokeWidth={3} />
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-brand-accent-coral shrink-0" aria-label="in progress">
        <span className="w-2 h-2 rounded-full bg-brand-accent-coral" />
      </span>
    )
  }
  if (status === 'skipped') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-brand-text-faint text-brand-text-faint text-xs shrink-0" aria-label="skipped">
        &mdash;
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-brand-text-faint shrink-0" aria-label="not started" />
  )
}
```

**Step 3: Replace optional badge**

In the section button's `<span>` (around line 60-65), replace the "opt" badge:

```tsx
{section.optional && (
  <span className="text-fine text-brand-text-faint font-normal">(optional)</span>
)}
```

**Step 4: Add active row background highlight**

In the section button's `className` (around line 53-57), update the active state styling to include a background. Change:

```
'bg-white border-brand-primary font-semibold text-brand-text'
```

to:

```
'bg-white border-brand-accent-coral font-semibold text-brand-text'
```

This changes the left-border from navy to coral for the active item, creating a clear visual connection with the in-progress coral indicator.

**Step 5: Verify build compiles**

Run: `npx tsc -b`
Expected: no errors

**Step 6: Visual verification**

Open the wizard. Verify:
- Completed sections show green filled circle with white checkmark
- In-progress section shows coral ring with coral dot inside
- Not-started sections show gray hollow circles
- Skipped sections show gray circle with dash
- Active row has coral left-border accent
- Optional sections show "(optional)" in small gray text instead of "OPT"

**Step 7: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(ux): styled sidebar status indicators with icons and clearer optional labels"
```

---

### Task 4: Bottom-anchored chat layout

Change the chat message area from top-down to bottom-anchored so messages stack from the bottom.

**Files:**
- Modify: `src/components/chat/ChatWindow.tsx:53`

**Step 1: Update message container flex**

In `ChatWindow.tsx` line 53, change:

```tsx
<div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6 space-y-1">
```

to:

```tsx
<div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6 space-y-1 flex flex-col justify-end">
```

The key addition is `flex flex-col justify-end` — this pushes messages to the bottom when they don't fill the container. When they overflow, `overflow-y-auto` kicks in and scrolling works normally.

**Step 2: Wrap messages in a div to preserve space-y behavior**

Since `flex flex-col justify-end` changes layout context, wrap the message list in a div to keep `space-y-1` working correctly. Replace the entire message container:

```tsx
<div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col justify-end">
  <div className="space-y-1">
    {messages.map((msg, i) => (
      <MessageBubble key={i} role={msg.role} content={msg.content} />
    ))}
    {isStreaming && streamingContent && (
      <MessageBubble role="assistant" content={streamingContent} isStreaming />
    )}
  </div>
</div>
```

**Step 3: Verify build compiles**

Run: `npx tsc -b`
Expected: no errors

**Step 4: Visual verification**

Open the wizard, start a new section with a fresh conversation. Verify:
- The first AI message appears just above the input bar, not at the top
- Empty space is above the message, not below
- After several messages, the conversation scrolls normally
- New messages auto-scroll to bottom

**Step 5: Commit**

```bash
git add src/components/chat/ChatWindow.tsx
git commit -m "feat(ux): bottom-anchored chat layout, messages stack from bottom up"
```

---

### Task 5: Move voice button into ChatInput

Move the microphone button from the ChatWindow top bar into the ChatInput component next to the Send button.

**Files:**
- Modify: `src/components/chat/ChatInput.tsx:2-7` (add props)
- Modify: `src/components/chat/ChatInput.tsx:59-77` (add mic button in input row)
- Modify: `src/components/chat/ChatWindow.tsx:6-14` (update ChatInput call)
- Modify: `src/components/chat/ChatWindow.tsx:25-52` (simplify top bar)

**Step 1: Add voice props to ChatInput**

Update the ChatInput component signature to accept voice props:

```typescript
export function ChatInput({ onSend, disabled, quickChips, showVoiceButton, onVoiceStart }: {
  onSend: (message: string) => void
  disabled: boolean
  quickChips?: string[]
  showVoiceButton?: boolean
  onVoiceStart?: () => void
}) {
```

**Step 2: Add mic button to input row**

In ChatInput's input row (the `<div className="flex gap-3 items-end">` around line 59), add a mic button between the textarea and Send button:

```tsx
<div className="flex gap-2 items-end">
  <textarea
    ref={textareaRef}
    value={text}
    onChange={e => setText(e.target.value)}
    onKeyDown={handleKeyDown}
    placeholder="Type your answer..."
    disabled={disabled}
    rows={1}
    className="flex-1 resize-none overflow-hidden px-4 py-3 rounded-xl border border-brand-border-dark bg-brand-bg text-brand-text text-body outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all disabled:opacity-40 font-body"
  />
  {showVoiceButton && onVoiceStart && (
    <button
      onClick={onVoiceStart}
      className="p-3 rounded-xl border border-brand-border-dark bg-white text-brand-text-muted hover:text-brand-text hover:bg-brand-bg transition-colors shrink-0"
      aria-label="Start voice input"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
      </svg>
    </button>
  )}
  <button
    onClick={handleSubmit}
    disabled={disabled || !text.trim()}
    className="px-5 py-3 rounded-xl bg-brand-primary text-white font-medium text-sm hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
  >
    Send
  </button>
</div>
```

Note: the outer `gap-3` changes to `gap-2` to keep the buttons tight.

**Step 3: Pass voice props through ChatWindow to ChatInput**

In `ChatWindow.tsx`, update the `<ChatInput>` call (line 61) to pass through voice props:

```tsx
<ChatInput
  onSend={onSend}
  disabled={isStreaming}
  showVoiceButton={showVoiceButton}
  onVoiceStart={onVoiceStart}
/>
```

**Step 4: Remove voice button from ChatWindow top bar**

In `ChatWindow.tsx`, simplify the top bar (lines 25-52). Remove the voice button entirely from the top bar. The top bar now only renders if `onSaveExit` is provided:

```tsx
{onSaveExit && (
  <div className="flex items-center border-b border-brand-border px-4 py-2">
    <button
      onClick={onSaveExit}
      className="flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-text hover:bg-gray-50"
    >
      Save &amp; Exit
    </button>
  </div>
)}
```

**Step 5: Verify build compiles**

Run: `npx tsc -b`
Expected: no errors

**Step 6: Visual verification**

Open the wizard in a conversation section. Verify:
- Mic button appears between the textarea and Send button
- Mic button has a muted style that highlights on hover
- Clicking mic opens voice overlay
- Top bar no longer has voice button, only Save & Exit
- Top bar disappears entirely if no Save & Exit (e.g., if the prop isn't passed)

**Step 7: Commit**

```bash
git add src/components/chat/ChatInput.tsx src/components/chat/ChatWindow.tsx
git commit -m "feat(ux): move voice button into chat input row next to Send"
```

---

### Task 6: Verify content card max-width

The design doc notes the container already has `max-w-2xl` (672px). Verify the prose text doesn't run too wide.

**Files:**
- Possibly modify: `src/pages/WizardSection.tsx` (line 280)

**Step 1: Check rendered line length**

Open the wizard, navigate to an approved section with a long draft (like "Your Story"). Inspect the approved draft text in browser devtools. Check:
- Container width is capped at ~672px
- Prose line length is ~65-75 characters per line

**Step 2: If line length exceeds 75 characters, add max-w-prose**

On the text div inside the approved draft card (WizardSection.tsx, the `whitespace-pre-wrap` div), add `max-w-prose`:

```tsx
<div className="text-body leading-relaxed text-brand-text-secondary whitespace-pre-wrap max-w-prose">
```

If line length is already fine (likely, since `max-w-2xl` = 672px and body text is 17px), no change needed.

**Step 3: Commit if changes were made**

```bash
git add src/pages/WizardSection.tsx
git commit -m "fix(ux): constrain approved draft prose width for readability"
```

---

### Task 7: Verify and fix mobile responsiveness

Check virtual keyboard behavior, sidebar overlay, and approved card reflow on mobile viewports.

**Files:**
- Possibly modify: various (based on findings)

**Step 1: Test virtual keyboard**

The ChatInput component already has a `visualViewport` resize listener (lines 19-27) that scrolls the textarea into view when the keyboard opens. This should handle iOS correctly. Verify by:
- Opening dev server on mobile (or using Chrome DevTools device toolbar)
- Tapping the chat input textarea
- Confirming the input stays visible above the virtual keyboard

**Step 2: Test sidebar hamburger overlay**

Open the wizard at mobile width (375px). Verify:
- Hamburger menu opens a drawer/overlay
- Main content is not blocked when drawer is closed
- Clicking a section in the drawer navigates and closes the drawer

**Step 3: Test approved draft card reflow**

At mobile width, navigate to an approved section. Verify:
- The approved draft card has appropriate padding (p-4)
- Text reflows cleanly without horizontal overflow
- The "Continue to..." button is full-width and tappable (44px+ touch target)
- "Refine this section" button wraps if needed

**Step 4: Fix any issues found**

Common fixes might include:
- Adjusting padding for very small screens
- Ensuring button text doesn't overflow
- Adding `min-h-[44px]` to touch targets if missing

**Step 5: Commit if changes were made**

```bash
git add -A
git commit -m "fix(ux): mobile responsiveness improvements for chat and approved sections"
```

---

### Task 8: Run full test suite and type check

Final verification that nothing is broken.

**Files:** None (verification only)

**Step 1: Type check**

Run: `npx tsc -b`
Expected: no errors

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: all tests pass (68+ tests across 13+ files)

**Step 3: Final visual check**

Open the wizard and walk through:
1. Start a fresh section → bottom-anchored chat, mic button in input
2. Get a review → Save & Exit visible at top
3. Approve a section → outlined Refine button, muted Start over, coral Next CTA
4. Check sidebar → green checkmarks, coral in-progress indicator, "(optional)" labels
5. Navigate via "Continue to..." button → arrives at next section

---

## Summary of files modified

| File | Changes |
|------|---------|
| `src/data/sections.ts` | Add `getNextSection()` helper |
| `src/data/__tests__/sections.test.ts` | Tests for `getNextSection()` |
| `src/pages/WizardSection.tsx` | Approved view redesign, review mode Save & Exit, import |
| `src/components/layout/Sidebar.tsx` | StatusIcon rewrite, optional labels, active highlight |
| `src/components/chat/ChatWindow.tsx` | Bottom-anchored layout, simplified top bar |
| `src/components/chat/ChatInput.tsx` | Voice button in input row |
