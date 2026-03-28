import { useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import type { Message } from '../../types'

export function ChatWindow({ messages, streamingContent, onSend, isStreaming, showVoiceButton, onVoiceStart, onSaveExit }: {
  messages: Message[]
  streamingContent: string | null
  onSend: (message: string) => void
  isStreaming: boolean
  showVoiceButton?: boolean
  onVoiceStart?: () => void
  onSaveExit?: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  return (
    <div className="flex flex-col h-full">
      {(showVoiceButton || onSaveExit) && (
        <div className="flex items-center justify-between border-b border-brand-border px-4 py-2">
          <div>
            {onSaveExit && (
              <button
                onClick={onSaveExit}
                className="flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-text hover:bg-gray-50"
              >
                Save & Exit
              </button>
            )}
          </div>
          <div>
            {showVoiceButton && onVoiceStart && (
              <button
                onClick={onVoiceStart}
                className="flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-text hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
                </svg>
                Voice
              </button>
            )}
          </div>
        </div>
      )}
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
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  )
}
