import { create } from 'zustand'
import type { Message, ResearchTask, ResearchTaskType } from '../types'
import { getConversation, saveConversation } from '../services/storage'
import { track } from '../services/analytics'

type ConversationState = {
  messages: Message[]
  isStreaming: boolean
  currentSessionId: string | null
  currentSectionId: string | null
  researchTasks: ResearchTask[]
  loadConversation: (sessionId: string, sectionId: string) => Promise<void>
  addMessage: (message: Message) => Promise<void>
  setStreaming: (streaming: boolean) => void
  clearConversation: () => Promise<void>
  loadResearchTasks: (sessionId: string, sectionId: string, templates: { id: string; description: string; type: ResearchTaskType }[]) => Promise<void>
  toggleTask: (taskId: string) => Promise<void>
  updateTaskNotes: (taskId: string, notes: string) => Promise<void>
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentSessionId: null,
  currentSectionId: null,
  researchTasks: [],

  loadConversation: async (sessionId, sectionId) => {
    set({ messages: [], currentSessionId: sessionId, currentSectionId: sectionId })
    const convo = await getConversation(sessionId, sectionId)
    set({ messages: convo?.messages ?? [] })
  },

  addMessage: async (message) => {
    const { messages, researchTasks, currentSessionId, currentSectionId } = get()
    if (!currentSessionId || !currentSectionId) return
    const updated = [...messages, message]
    set({ messages: updated })
    await saveConversation(currentSessionId, currentSectionId, { messages: updated, researchTasks })
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  clearConversation: async () => {
    const { currentSessionId, currentSectionId } = get()
    if (!currentSessionId || !currentSectionId) return
    set({ messages: [], researchTasks: [] })
    await saveConversation(currentSessionId, currentSectionId, { messages: [], researchTasks: [] })
  },

  loadResearchTasks: async (sessionId, sectionId, templates) => {
    const convo = await getConversation(sessionId, sectionId)
    let tasks: ResearchTask[]
    if (convo?.researchTasks && convo.researchTasks.length > 0) {
      tasks = convo.researchTasks
    } else {
      tasks = templates.map(t => ({
        id: t.id,
        description: t.description,
        type: t.type,
        completed: false,
        notes: '',
      }))
    }
    set({ researchTasks: tasks, currentSessionId: sessionId, currentSectionId: sectionId })
    await saveConversation(sessionId, sectionId, { messages: convo?.messages ?? [], researchTasks: tasks })
  },

  toggleTask: async (taskId) => {
    const { researchTasks, messages, currentSessionId, currentSectionId } = get()
    if (!currentSessionId || !currentSectionId) return
    const updated = researchTasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
    set({ researchTasks: updated })
    const task = updated.find(t => t.id === taskId)
    if (task?.completed) {
      track('research.task_completed', {
        sectionId: currentSectionId,
        taskId,
        hasNotes: !!task.notes,
      }, currentSessionId ?? undefined)
    }
    await saveConversation(currentSessionId, currentSectionId, { messages, researchTasks: updated })
  },

  updateTaskNotes: async (taskId, notes) => {
    const { researchTasks, messages, currentSessionId, currentSectionId } = get()
    if (!currentSessionId || !currentSectionId) return
    const updated = researchTasks.map(t =>
      t.id === taskId ? { ...t, notes } : t
    )
    set({ researchTasks: updated })
    await saveConversation(currentSessionId, currentSectionId, { messages, researchTasks: updated })
  },
}))
