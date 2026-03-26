import { cn } from '../../lib/utils'
import type { MessageRole } from '../../types'

export function MessageBubble({ role, content, isStreaming }: {
  role: MessageRole
  content: string
  isStreaming?: boolean
}) {
  const isAssistant = role === 'assistant'

  return (
    <div className={cn('flex mb-4', isAssistant ? 'justify-start' : 'justify-end')}>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed',
        isAssistant
          ? 'bg-white border border-brand-border text-brand-text-secondary'
          : 'bg-brand-primary text-white'
      )}>
        <div className="whitespace-pre-wrap">{content}</div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-brand-text-muted/40 ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  )
}
