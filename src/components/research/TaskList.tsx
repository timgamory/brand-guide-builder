// src/components/research/TaskList.tsx
import type { ResearchTask } from '../../types'
import { TaskCard } from './TaskCard'

export function TaskList({ tasks, onToggle, onNotesChange, onProceed }: {
  tasks: ResearchTask[]
  onToggle: (taskId: string) => void
  onNotesChange: (taskId: string, notes: string) => void
  onProceed: () => void
}) {
  const completedCount = tasks.filter(t => t.completed).length
  const halfDone = completedCount >= Math.ceil(tasks.length / 2)

  return (
    <div className="max-w-full md:max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-brand-text-muted font-body">
          {completedCount} of {tasks.length} tasks done
        </p>
      </div>

      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={() => onToggle(task.id)}
          onNotesChange={(notes) => onNotesChange(task.id, notes)}
        />
      ))}

      <button
        onClick={onProceed}
        disabled={!halfDone}
        className="w-full mt-4 px-6 py-4 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        I've done my research — let's discuss →
      </button>
      {!halfDone && (
        <p className="text-center text-sm text-brand-text-faint">
          Complete at least half the tasks to continue
        </p>
      )}
    </div>
  )
}
