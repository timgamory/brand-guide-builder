# Phase 4: Polish — Design

Four features: presentation view, consistency check, optional section skip, and long conversation summarization.

## 1. Presentation View

New route `/presentation`. Full-screen slide-style view for intern-fellow review meetings. Shows approved draft content per section — no alternatives (those are ephemeral, not persisted).

**Layout**: Dark background (`bg-brand-primary`), centered white card. One section per slide. Section title + approved draft content. Slide counter ("Section 2 of 9").

**Navigation**: Prev/next buttons, keyboard arrows, Escape to exit. Accessible from intern path guide preview via "Present to Fellow" button.

**Data**: Reads `session.sections` for approved drafts. No new storage needed.

## 2. Cross-Section Consistency Check

"Check Consistency" button on guide preview page, visible when >= 3 sections approved.

Sends all approved drafts to Claude with a specialized prompt asking for inconsistencies (tone shifts, contradictory claims, terminology mismatches). Returns JSON with issues and verdict.

Result displayed as a dismissible card: green if consistent, amber with bullet list if issues found. Not persisted. Not a gate — download buttons stay enabled.

Uses existing `sendMessage` but collects full response (no streaming to UI).

## 3. Optional Section Skip

New `'skipped'` value on `SectionStatus` type.

"Skip this section" text button in WizardSection header for optional sections (`social_media`, `photography`). Sets status to `skipped`, advances to next section.

Sidebar shows dash icon for skipped sections. Clicking a skipped section reopens it — skip is reversible. Once the user interacts, status flips to `in_progress`.

Document generation and consistency checks naturally exclude skipped sections (they check `status === 'approved'`).

## 4. Long Conversation Summarization

In `handleSend`, when `messages.length > 20`:
1. Summarize oldest messages (keeping most recent 10) via a Claude API call
2. Replace old messages with a single summary message in the API call only
3. Full conversation preserved in Dexie for scrollback

Summary cached as `conversationSummary?: string` on the `Conversation` type to avoid re-summarizing every turn.

Fallback: if summary API call fails, hard-truncate to most recent 20 messages.
