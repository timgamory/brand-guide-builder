# Voice-First Chat UI Design

**Date:** 2026-03-28
**Status:** Approved
**Problem:** The voice button is buried as a small icon between the textarea and Send button. Users won't discover it. The product's value proposition is "have a conversation with AI to build your brand guide" — the UI should lead with conversation, not forms.

## Design

### Empty State: Conversation Launcher

When a section starts with zero messages, the entire chat area becomes a centered invitation to talk.

**Layout (vertically centered):**
- Section context line: "Let's talk about [section title]" — small muted text
- Large mic button: 80x80px coral circle, white mic icon (24px), subtle pulsing shadow animation
- Label: "Tap to talk" in medium text
- Divider: horizontal lines with "or" in the middle
- "Type instead" text link — dismisses launcher, reveals standard text input

**Behavior:**
- Tapping mic fires `onVoiceStart()` (opens existing VoiceOverlay), sets `preferredMode = 'voice'`
- Clicking "Type instead" sets `preferredMode = 'text'`, hides launcher, shows text input bar
- The AI's opening prompt is not shown as a bubble in this state — the context line replaces it. Once conversation begins, full message history renders normally.
- Appears only when `messages.length === 0`. Gone once any message exists.

**Edge case — voice not available:** If `voiceEnabled` is false (browser doesn't support it), skip the launcher entirely. Fall through to standard text input.

### Active Conversation: Smart Input Mode

Once messages exist, the input area adapts based on how the user started.

**Voice-prominent layout (`preferredMode = 'voice'`):**
- Large coral mic button on the left: 56x56px, rounded-full, coral background, white mic icon. Primary action.
- Compact text field to the right — visually secondary. Placeholder: "or type here..."
- Send button only visible when text field has content

**Text-prominent layout (`preferredMode = 'text'`):**
- Text field takes main space (current layout)
- Mic button upgraded: 48x48px coral-outlined circle with mic icon. Visible and inviting, not dominant.
- Send button on far right (current behavior)

**Mode switching:**
- `preferredMode` set once on user's first interaction, stays for the section
- Voice-mode users can still type via the compact field without layout jumping
- Resets to `'undecided'` when messages drop to 0 (Start Over)

### Component Architecture

**New state:** `preferredMode: 'undecided' | 'voice' | 'text'` — local state in ChatWindow. Not persisted, not in any store. Resets per ChatWindow instance.

**New component:**
- `src/components/chat/ConversationLauncher.tsx` — centered mic + "Type instead" UI. Receives `onVoiceStart`, `onChooseText`, and `sectionTitle` props.

**Modified components:**
- `ChatWindow.tsx` — adds `preferredMode` state. When `messages.length === 0 && preferredMode === 'undecided'`, renders ConversationLauncher instead of message area + input bar.
- `ChatInput.tsx` — accepts `preferredMode` prop. Renders voice-prominent or text-prominent layout accordingly.
- `WizardSection.tsx` — minor wiring to pass `preferredMode` setter and `sectionTitle` through.

**Not changed:**
- VoiceOverlay (works as-is)
- MessageBubble (works as-is)
- No store changes, no new hooks, no persistence

### Visual Specifications

**ConversationLauncher:**
- Container: `flex flex-col items-center justify-center h-full`
- Context line: `text-sm text-brand-text-muted mb-6`
- Mic button: `w-20 h-20 rounded-full bg-brand-accent-coral text-white shadow-lg` + CSS pulse animation on shadow
- "Tap to talk": `text-body font-medium text-brand-text mt-4`
- Divider: flex row, `border-t` lines each side, "or" in `text-sm text-brand-text-faint`, `my-6`
- "Type instead": `text-sm text-brand-text-muted hover:text-brand-text underline`

**Voice-prominent mic button (active state):**
- `w-14 h-14 rounded-full bg-brand-accent-coral text-white shadow-md shrink-0`

**Text-prominent mic button (active state):**
- `w-12 h-12 rounded-full border-2 border-brand-accent-coral text-brand-accent-coral hover:bg-brand-accent-coral/10 shrink-0`

### What We're NOT Doing

- No changes to VoiceOverlay modal
- No changes to MessageBubble styling
- No persistence of preferred mode across sections or sessions
- No animation on mode transition (clean swap)
- No changes to sidebar, header, or approved section views
