import { cn } from '../../lib/utils'
import type { MessageRole } from '../../types'

function renderMarkdown(text: string) {
  // Split into paragraphs, then render inline markdown
  return text.split('\n\n').map((para, i) => {
    const lines = para.split('\n').map((line, j) => {
      // Bold: **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/).map((segment, k) => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
          return <strong key={k} className="font-semibold">{segment.slice(2, -2)}</strong>
        }
        return <span key={k}>{segment}</span>
      })
      return j > 0 ? [<br key={`br-${j}`} />, ...parts] : parts
    })
    return <p key={i} className={i > 0 ? 'mt-3' : ''}>{lines}</p>
  })
}

export function MessageBubble({ role, content, isStreaming }: {
  role: MessageRole
  content: string
  isStreaming?: boolean
}) {
  const isAssistant = role === 'assistant'

  return (
    <div className={cn('flex mb-4', isAssistant ? 'justify-start' : 'justify-end')}>
      <div className={cn(
        'max-w-[90%] md:max-w-[80%] rounded-2xl px-3.5 py-3 md:px-5 md:py-3.5 text-body leading-relaxed',
        isAssistant
          ? 'bg-white border border-brand-border text-brand-text-secondary'
          : 'bg-brand-primary text-white'
      )}>
        <div>{renderMarkdown(content)}</div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-brand-text-muted/40 ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  )
}
