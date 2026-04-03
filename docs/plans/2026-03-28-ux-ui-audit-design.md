# UX/UI Audit — Design Document

Date: 2026-03-28
Status: Approved

## Overview

Ten UX/UI improvements to the wizard flow, derived from a visual audit. Changes touch the approved section view, sidebar navigation, chat layout, and input affordances. No backend or data model changes required — all work is in React components and CSS.

## Changes

### 1. "Next Section" CTA on Approved Sections (HIGH)

**Problem**: After approving a section, users must manually click the sidebar to advance. No forward navigation.

**Design**: Add a prominent primary button below the action links on every approved section view.

- Label: "Continue to [Next Section Name] →" (dynamic, from section definitions)
- When all sections complete: "Preview Brand Guide →" linking to `/preview`
- Style: Full-width (within `max-w-2xl`), coral accent background (`bg-brand-accent-coral`), white text, large padding, rounded
- Position: Bottom of the approved section content, below Refine/Start over links
- Visually dominant — the primary action on the page

**Files**: `src/pages/WizardSection.tsx`

### 2. Button Hierarchy for Refine / Start Over (MEDIUM-HIGH)

**Problem**: "Refine this section" and "Start over" are both unstyled text links with no visual distinction.

**Design**:

- **"Refine this section"**: Outlined/secondary button. `border border-brand-primary text-brand-primary` with padding and rounded corners.
- **"Start over"**: Subtle text link in muted destructive color (`text-red-600/70`, smaller text). Positioned to the right of Refine or on its own line.
- **Confirmation on Start over**: `window.confirm("Are you sure? This will discard your approved draft and start the conversation over.")` before executing.

**Visual hierarchy** (top to bottom):
1. Green success banner ("This section has been approved")
2. Approved Draft card
3. Refine button (outlined) + Start over link (muted red)
4. **Continue to [Next Section] →** (primary CTA, most prominent)

**Files**: `src/pages/WizardSection.tsx`

### 3. Sidebar Status Indicators (MEDIUM-HIGH)

**Problem**: Plain text symbols (✓, ●, ○) aren't self-explanatory. The orange dot for in-progress looks like an error state.

**Design**: Replace text symbols with styled indicator components:

| State | Visual | Implementation |
|-------|--------|----------------|
| Completed | Green filled circle + white check icon | `bg-brand-accent-sage text-white` 20px circle, Lucide `Check` icon (12px) |
| In Progress | Coral ring or filled coral dot | `border-2 border-brand-accent-coral` hollow circle, or filled coral |
| Not Started | Gray hollow circle | `border-2 border-brand-text-faint` hollow circle |
| Skipped | Gray circle with dash | Same gray border, mdash inside |

Additional:
- Active section row gets subtle background highlight (`bg-brand-bg/60`) or left border accent in coral
- `aria-label` on each indicator: "completed", "in progress", "not started", "skipped"

**Files**: `src/components/layout/Sidebar.tsx`

### 4. Bottom-Anchored Chat Layout (MEDIUM)

**Problem**: When a section starts with just one AI prompt bubble, there's massive dead space between the message and the input bar.

**Design**: Transform ChatWindow from top-down to bottom-anchored (like iMessage/WhatsApp).

- Message container: change to `flex flex-col justify-end`
- Few messages → they sit just above the input bar, empty space above
- Many messages → overflow scrolls, auto-scroll to bottom on new messages
- Input bar stays fixed at bottom (already is)

This is primarily a CSS change on the message container flex properties.

**Files**: `src/components/chat/ChatWindow.tsx`

### 5. "Optional" Labels in Sidebar (MEDIUM)

**Problem**: "OPT" badges are cryptic and too small to read.

**Design**: Replace `OPT` with `(optional)` in `text-fine` (11px), `text-brand-text-faint`, lowercase. Render on the same line after the section name, or on a second line below if space is tight on mobile.

**Files**: `src/components/layout/Sidebar.tsx`

### 6. Persistent "Save & Exit" (MEDIUM)

**Problem**: Save & Exit only appears in the ChatWindow top bar during active chat. Missing on approved sections and review mode.

**Design**: Add a consistent "Save & Exit" affordance in all section states:

- **Approved sections**: Small text link ("Save & Exit" or "← Dashboard") top-left of section content, above the approved draft card. Muted styling, non-competing with primary CTA.
- **Review mode**: Same small text link at top-left.
- **Chat mode**: Keep existing placement in ChatWindow top bar.

Links to `/dashboard` in all cases.

**Files**: `src/pages/WizardSection.tsx`

### 7. Content Card Max-Width (LOW-MEDIUM)

**Problem**: Approved draft text may run too wide for comfortable reading.

**Current state**: Container already has `max-w-2xl` (672px). Verify this is sufficient. If the prose text inside the card still exceeds ~75 characters per line, add `max-w-prose` (65ch) on the text content element.

**Files**: `src/pages/WizardSection.tsx` (verification, possible small tweak)

### 8. Duplicate Sign-Out Button (LOW)

**Status**: Already resolved in commit `356e525`. No work needed.

### 9. Voice Button Near Input (LOW)

**Problem**: Microphone button floats in the ChatWindow top bar, disconnected from the input it controls.

**Design**: Move voice button into ChatInput component:

- Position: Icon button to the left of the Send button, inside the input row
- Style: Lucide `Mic` icon, same sizing as Send button, muted color with hover highlight
- ChatWindow top bar simplifies to just Save & Exit when voice is available (no voice button there)

This creates clear visual association: type or speak, both right here.

**Files**: `src/components/chat/ChatInput.tsx`, `src/components/chat/ChatWindow.tsx`

### 10. Mobile Responsiveness for Chat Input (LOW)

**Problem**: Potential issues with virtual keyboards obscuring the fixed input bar, sidebar overlay blocking content, and approved cards not reflowing on narrow viewports.

**Design**: Verification and fix task:

- Test virtual keyboard behavior — may need `dvh` units or `visualViewport` API listener
- Verify sidebar hamburger overlay doesn't block main content
- Verify approved draft cards reflow cleanly on small screens
- Fix any issues found

**Files**: Various (based on findings)

## Non-Changes

- No backend, Supabase, or data model changes
- No changes to AI prompts or conversation logic
- No changes to the intern path research/synthesis flow
- Document generation unaffected

## Implementation Order

1. #1 + #2 + #6 (approved section view — all touch `WizardSection.tsx`)
2. #3 + #5 (sidebar — both in `Sidebar.tsx`)
3. #4 (chat layout — `ChatWindow.tsx`)
4. #9 (voice button — `ChatInput.tsx` + `ChatWindow.tsx`)
5. #7 (max-width verification)
6. #10 (mobile responsiveness verification)
