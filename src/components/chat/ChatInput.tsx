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
      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none overflow-hidden px-4 py-3 rounded-xl border border-brand-border-dark bg-brand-bg text-brand-text text-[15px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all disabled:opacity-40 font-body"
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
