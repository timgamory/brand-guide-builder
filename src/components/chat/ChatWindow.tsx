import { useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ConversationLauncher } from './ConversationLauncher'
import type { Message } from '../../types'

type PreferredMode = 'undecided' | 'voice' | 'text'

export function ChatWindow({ messages, streamingContent, onSend, isStreaming, showVoiceButton, onVoiceStart, sectionTitle, preferredMode = 'text', onPreferredModeChange, ready = true }: {
  messages: Message[]
  streamingContent: string | null
  onSend: (message: string) => void
  isStreaming: boolean
  showVoiceButton?: boolean
  onVoiceStart?: () => void
  sectionTitle?: string
  preferredMode?: PreferredMode
  onPreferredModeChange?: (mode: PreferredMode) => void
  ready?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const showLauncher = ready && messages.length === 0 && preferredMode === 'undecided' && showVoiceButton

  const handleVoiceFromLauncher = () => {
    onPreferredModeChange?.('voice')
    onVoiceStart?.()
  }

  const handleChooseText = () => {
    onPreferredModeChange?.('text')
  }

  return (
    <div className="flex flex-col h-full">
      {showLauncher ? (
        <ConversationLauncher
          sectionTitle={sectionTitle ?? 'this section'}
          onVoiceStart={handleVoiceFromLauncher}
          onChooseText={handleChooseText}
        />
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6">
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
