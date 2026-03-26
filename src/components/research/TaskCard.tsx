// src/components/research/TaskCard.tsx
import type { ResearchTask, ResearchTaskType } from '../../types'

const TYPE_CONFIG: Record<ResearchTaskType, { label: string; color: string; icon: string }> = {
  interview: { label: 'Interview', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🎤' },
  observe: { label: 'Observe', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '👀' },
  reflect: { label: 'Reflect', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '✍️' },
  research: { label: 'Research', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🔍' },
}

export function TaskCard({ task, onToggle, onNotesChange }: {
  task: ResearchTask
  onToggle: () => void
  onNotesChange: (notes: string) => void
}) {
  const config = TYPE_CONFIG[task.type]

  return (
    <div className={`bg-white rounded-xl border border-brand-border p-5 ${task.completed ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            task.completed ? 'bg-brand-accent-sage border-brand-accent-sage text-white' : 'border-brand-border-dark hover:border-brand-primary'
          }`}
        >
          {task.completed && <span className="text-xs">✓</span>}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${config.color}`}>
              {config.icon} {config.label}
            </span>
          </div>
          <p className={`text-[15px] text-brand-text leading-relaxed ${task.completed ? 'line-through text-brand-text-muted' : ''}`}>
            {task.description}
          </p>
          <textarea
            value={task.notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Your notes..."
            className="mt-3 w-full min-h-[80px] text-sm leading-relaxed text-brand-text-secondary bg-brand-bg rounded-lg p-3 border border-brand-border outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y font-body"
          />
        </div>
      </div>
    </div>
  )
}
