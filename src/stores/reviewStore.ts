import { create } from 'zustand'
import type { ReviewStatus, SectionReviewState } from '../types'
import { getReview, saveReviewStatus } from '../services/storage'

type ReviewStoreState = {
  sections: Record<string, SectionReviewState>
  currentSessionId: string | null
  loadReview: (sessionId: string) => Promise<void>
  setReviewStatus: (sectionId: string, status: ReviewStatus, notes?: string) => Promise<void>
}

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  sections: {},
  currentSessionId: null,

  loadReview: async (sessionId) => {
    const review = await getReview(sessionId)
    set({ sections: review?.sections ?? {}, currentSessionId: sessionId })
  },

  setReviewStatus: async (sectionId, status, notes) => {
    const { currentSessionId, sections } = get()
    if (!currentSessionId) return
    await saveReviewStatus(currentSessionId, sectionId, status, notes)
    set({
      sections: {
        ...sections,
        [sectionId]: { status, notes, reviewedAt: new Date().toISOString() },
      },
    })
  },
}))
