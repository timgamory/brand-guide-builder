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
