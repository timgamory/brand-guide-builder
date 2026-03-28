# Voice-First Chat UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the chat UI to be voice-first — empty sections show a large centered mic CTA, and the input bar adapts to the user's preferred mode (voice or text).

**Architecture:** New `ConversationLauncher` component for the empty state, `preferredMode` local state in `ChatWindow`, and `ChatInput` gains two layout variants (voice-prominent and text-prominent). No store changes.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide icons

**Design doc:** `docs/plans/2026-03-28-voice-first-chat-design.md`

---

### Task 1: Create ConversationLauncher component

**Files:**
- Create: `src/components/chat/ConversationLauncher.tsx`

**Step 1: Create the component**

Create `src/components/chat/ConversationLauncher.tsx`:

```tsx
export function ConversationLauncher({ sectionTitle, onVoiceStart, onChooseText }: {
  sectionTitle: string
  onVoiceStart: () => void
  onChooseText: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="text-sm text-brand-text-muted mb-6">
        Let&rsquo;s talk about {sectionTitle.toLowerCase()}
      </p>

      <button
        onClick={onVoiceStart}
        className="w-20 h-20 rounded-full bg-brand-accent-coral text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center animate-pulse-shadow"
        aria-label="Start voice conversation"
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
        </svg>
      </button>

      <p className="text-body font-medium text-brand-text mt-4">Tap to talk</p>

      <div className="flex items-center gap-4 my-6 w-full max-w-[200px]">
        <div className="flex-1 border-t border-brand-border" />
        <span className="text-sm text-brand-text-faint">or</span>
        <div className="flex-1 border-t border-brand-border" />
      </div>

      <button
        onClick={onChooseText}
        className="text-sm text-brand-text-muted hover:text-brand-text underline transition-colors"
      >
        Type instead
      </button>
    </div>
  )
}
```

**Step 2: Add the pulse-shadow animation to CSS**

In `src/index.css`, add after the `@theme {}` block (before any `@layer` rules):

```css
@keyframes pulse-shadow {
  0%, 100% {
    box-shadow: 0 10px 15px -3px rgba(224, 122, 95, 0.3), 0 4px 6px -4px rgba(224, 122, 95, 0.2);
  }
  50% {
    box-shadow: 0 10px 25px -3px rgba(224, 122, 95, 0.5), 0 4px 10px -4px rgba(224, 122, 95, 0.35);
  }
}

.animate-pulse-shadow {
  animation: pulse-shadow 2s ease-in-out infinite;
}
```

**Step 3: Verify compilation**

Run: `npx tsc -b`
Expected: PASS (component is created but not yet imported anywhere — no error since it's standalone)

**Step 4: Commit**

```bash
git add src/components/chat/ConversationLauncher.tsx src/index.css
git commit -m "feat: add ConversationLauncher component with pulse-shadow animation"
```

---

### Task 2: Add preferredMode state to ChatWindow and render ConversationLauncher

**Files:**
- Modify: `src/components/chat/ChatWindow.tsx`

**Step 1: Update ChatWindow**

Replace the entire contents of `src/components/chat/ChatWindow.tsx` with:

```tsx
import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ConversationLauncher } from './ConversationLauncher'
import type { Message } from '../../types'

type PreferredMode = 'undecided' | 'voice' | 'text'

export function ChatWindow({ messages, streamingContent, onSend, isStreaming, showVoiceButton, onVoiceStart, onSaveExit, sectionTitle }: {
  messages: Message[]
  streamingContent: string | null
  onSend: (message: string) => void
  isStreaming: boolean
  showVoiceButton?: boolean
  onVoiceStart?: () => void
  onSaveExit?: () => void
  sectionTitle?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [preferredMode, setPreferredMode] = useState<PreferredMode>(
    showVoiceButton ? 'undecided' : 'text'
  )

  // Reset to undecided when messages are cleared (Start Over)
  useEffect(() => {
    if (messages.length === 0 && showVoiceButton) {
      setPreferredMode('undecided')
    }
  }, [messages.length, showVoiceButton])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const showLauncher = messages.length === 0 && preferredMode === 'undecided' && showVoiceButton

  const handleVoiceFromLauncher = () => {
    setPreferredMode('voice')
    onVoiceStart?.()
  }

  const handleChooseText = () => {
    setPreferredMode('text')
  }

  return (
    <div className="flex flex-col h-full">
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

      {showLauncher ? (
        <ConversationLauncher
          sectionTitle={sectionTitle ?? 'this section'}
          onVoiceStart={handleVoiceFromLauncher}
          onChooseText={handleChooseText}
        />
      ) : (
        <>
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
          <ChatInput
            onSend={onSend}
            disabled={isStreaming}
            showVoiceButton={showVoiceButton}
            onVoiceStart={onVoiceStart}
            preferredMode={preferredMode}
          />
        </>
      )}
    </div>
  )
}
```

Key changes:
- Import `useState` and `ConversationLauncher`
- Add `PreferredMode` type and `preferredMode` state (defaults to `'undecided'` if voice available, `'text'` if not)
- Add `useEffect` to reset mode when messages cleared
- Add `sectionTitle` prop for the launcher context line
- When `showLauncher` is true, render `ConversationLauncher` instead of messages + input
- Pass `preferredMode` to `ChatInput`

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: FAIL — `ChatInput` doesn't accept `preferredMode` prop yet. This is expected; Task 3 fixes it.

**Step 3: Commit (even with type error — it will be fixed in next task)**

```bash
git add src/components/chat/ChatWindow.tsx
git commit -m "feat: add preferredMode state and ConversationLauncher to ChatWindow"
```

---

### Task 3: Update ChatInput with voice-prominent and text-prominent layouts

**Files:**
- Modify: `src/components/chat/ChatInput.tsx`

**Step 1: Update ChatInput**

Replace the entire contents of `src/components/chat/ChatInput.tsx` with:

```tsx
import { useState, useRef, useEffect } from 'react'

type PreferredMode = 'undecided' | 'voice' | 'text'

function MicIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
    </svg>
  )
}

export function ChatInput({ onSend, disabled, quickChips, showVoiceButton, onVoiceStart, preferredMode = 'text' }: {
  onSend: (message: string) => void
  disabled: boolean
  quickChips?: string[]
  showVoiceButton?: boolean
  onVoiceStart?: () => void
  preferredMode?: PreferredMode
}) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [text])

  // Scroll input into view when virtual keyboard opens (iOS)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const handleResize = () => {
      textareaRef.current?.scrollIntoView({ block: 'nearest' })
    }
    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }, [])

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

  const isVoiceMode = preferredMode === 'voice' && showVoiceButton && onVoiceStart

  return (
    <div className="border-t border-brand-border bg-white p-3 md:p-4">
      {quickChips && quickChips.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {quickChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => onSend(chip)}
              disabled={disabled}
              className="text-sm px-3 py-2.5 md:py-1.5 rounded-full border border-brand-border-dark text-brand-text-muted hover:bg-brand-bg-warm hover:text-brand-text transition-colors disabled:opacity-40"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {isVoiceMode ? (
        /* Voice-prominent layout: big mic on left, compact text on right */
        <div className="flex gap-2 items-end">
          <button
            onClick={onVoiceStart}
            className="w-14 h-14 rounded-full bg-brand-accent-coral text-white shadow-md shrink-0 flex items-center justify-center hover:bg-brand-accent-coral/90 transition-colors"
            aria-label="Start voice input"
          >
            <MicIcon className="h-6 w-6" />
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="or type here..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none overflow-hidden px-4 py-3 rounded-xl border border-brand-border-dark bg-brand-bg text-brand-text text-body outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all disabled:opacity-40 font-body"
          />
          {text.trim() && (
            <button
              onClick={handleSubmit}
              disabled={disabled}
              className="px-5 py-3 rounded-xl bg-brand-primary text-white font-medium text-sm hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Send
            </button>
          )}
        </div>
      ) : (
        /* Text-prominent layout: textarea primary, mic button secondary */
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
              className="w-12 h-12 rounded-full border-2 border-brand-accent-coral text-brand-accent-coral hover:bg-brand-accent-coral/10 transition-colors shrink-0 flex items-center justify-center"
              aria-label="Start voice input"
            >
              <MicIcon className="h-5 w-5" />
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
      )}
    </div>
  )
}
```

Key changes:
- Add `PreferredMode` type and `preferredMode` prop (defaults to `'text'`)
- Extract `MicIcon` helper to avoid SVG duplication
- Two layout branches: `isVoiceMode` renders big mic left + compact text right + conditional Send; else renders current text-prominent layout with upgraded coral-outlined mic button (48x48 circle instead of the old square icon)

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: PASS — ChatWindow now passes `preferredMode` to ChatInput which accepts it.

**Step 3: Commit**

```bash
git add src/components/chat/ChatInput.tsx
git commit -m "feat: ChatInput voice-prominent and text-prominent layout variants"
```

---

### Task 4: Wire sectionTitle through WizardSection to ChatWindow

**Files:**
- Modify: `src/pages/WizardSection.tsx` (line 382-390)

**Step 1: Add sectionTitle prop to ChatWindow call**

In `src/pages/WizardSection.tsx`, find the ChatWindow rendering block (around line 382):

```tsx
          <ChatWindow
            messages={messages}
            streamingContent={streamingContent}
            onSend={handleSend}
            isStreaming={isStreaming}
            showVoiceButton={voiceEnabled && mode !== 'review'}
            onVoiceStart={() => setVoiceActive(true)}
            onSaveExit={() => navigate('/dashboard')}
          />
```

Add the `sectionTitle` prop:

```tsx
          <ChatWindow
            messages={messages}
            streamingContent={streamingContent}
            onSend={handleSend}
            isStreaming={isStreaming}
            showVoiceButton={voiceEnabled && mode !== 'review'}
            onVoiceStart={() => setVoiceActive(true)}
            onSaveExit={() => navigate('/dashboard')}
            sectionTitle={section.title}
          />
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: PASS

**Step 3: Run tests**

Run: `npx vitest run`
Expected: 101 passed (2 pre-existing failures in storage.test.ts are unrelated)

**Step 4: Commit**

```bash
git add src/pages/WizardSection.tsx
git commit -m "feat: pass sectionTitle to ChatWindow for ConversationLauncher context"
```

---

### Task 5: Final verification and type check

**Step 1: Full type check**

Run: `npx tsc -b`
Expected: PASS with zero errors

**Step 2: Full test suite**

Run: `npx vitest run`
Expected: 101 passed, 2 failed (pre-existing storage.test.ts)

**Step 3: Verify no unused imports**

Run: `npx tsc -b` (the project's tsconfig catches unused variables/imports)
Expected: Clean

**Step 4: Commit any cleanup if needed**

If no cleanup needed, this task is a no-op verification.
