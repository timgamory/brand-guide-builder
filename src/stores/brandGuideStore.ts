import { create } from 'zustand'
import type { Session, Path, SectionStatus, BrandData, InternMeta } from '../types'
import { createSession, getSession, updateSession, listSessions, deleteSession } from '../services/storage'
import { getUserSlug } from '../services/userSlug'
import { SECTIONS } from '../data/sections'
import { generateMarkdown } from '../services/documentGenerator'

type BrandGuideState = {
  session: Session | null
  sessions: Session[]
  isLoading: boolean
  createNewSession: (path: Path) => Promise<void>
  loadSession: (id: string) => Promise<void>
  loadSessions: () => Promise<void>
  deleteSessionById: (id: string) => Promise<void>
  reset: () => void
  updateBrandData: (data: Partial<BrandData>) => Promise<void>
  navigateToSection: (sectionId: string) => Promise<void>
  nextSection: () => Promise<void>
  updateSectionStatus: (sectionId: string, status: SectionStatus) => Promise<void>
  approveSectionDraft: (sectionId: string, draft: string) => Promise<void>
  setInternMeta: (meta: InternMeta) => Promise<void>
  skipSection: (sectionId: string) => Promise<void>
  submitForReview: () => Promise<string | undefined>
  loadMostRecentSession: () => Promise<void>
}

export const useBrandGuideStore = create<BrandGuideState>((set, get) => ({
  session: null,
  sessions: [],
  isLoading: false,

  createNewSession: async (path) => {
    set({ isLoading: true })
    const userSlug = getUserSlug() ?? undefined
    const session = await createSession(path, userSlug)
    set({ session, isLoading: false })
  },

  loadSession: async (id) => {
    set({ isLoading: true })
    const session = await getSession(id)
    set({ session: session ?? null, isLoading: false })
  },

  loadSessions: async () => {
    const userSlug = getUserSlug() ?? undefined
    const sessions = await listSessions(userSlug)
    set({ sessions })
  },

  deleteSessionById: async (id) => {
    await deleteSession(id)
    const { session } = get()
    if (session?.id === id) {
      set({ session: null })
    }
    await get().loadSessions()
  },

  reset: () => {
    set({ session: null, sessions: [], isLoading: false })
  },

  updateBrandData: async (data) => {
    const { session } = get()
    if (!session) return
    const brandData: BrandData = { ...session.brandData, ...data } as BrandData
    await updateSession(session.id, { brandData })
    set({ session: { ...session, brandData, updatedAt: new Date().toISOString() } })
  },

  navigateToSection: async (sectionId) => {
    const { session } = get()
    if (!session) return
    await updateSession(session.id, { currentSection: sectionId })
    set({ session: { ...session, currentSection: sectionId, updatedAt: new Date().toISOString() } })
  },

  nextSection: async () => {
    const { session } = get()
    if (!session) return
    const currentIndex = SECTIONS.findIndex(s => s.id === session.currentSection)
    if (currentIndex < SECTIONS.length - 1) {
      const nextId = SECTIONS[currentIndex + 1].id
      await get().navigateToSection(nextId)
    }
  },

  updateSectionStatus: async (sectionId, status) => {
    const { session } = get()
    if (!session) return
    const sections = {
      ...session.sections,
      [sectionId]: { ...session.sections[sectionId], status },
    }
    const updatedSession = { ...session, sections }
    const generatedDocument = generateMarkdown(updatedSession)
    await updateSession(session.id, { sections, generatedDocument })
    set({ session: { ...updatedSession, generatedDocument, updatedAt: new Date().toISOString() } })
  },

  approveSectionDraft: async (sectionId, draft) => {
    const { session } = get()
    if (!session) return
    const sections = {
      ...session.sections,
      [sectionId]: { ...session.sections[sectionId], status: 'approved' as const, approvedDraft: draft },
    }
    const updatedSession = { ...session, sections }
    const generatedDocument = generateMarkdown(updatedSession)
    await updateSession(session.id, { sections, generatedDocument })
    set({ session: { ...updatedSession, generatedDocument, updatedAt: new Date().toISOString() } })
  },

  setInternMeta: async (meta) => {
    const { session } = get()
    if (!session) return
    await updateSession(session.id, { internMeta: meta })
    set({ session: { ...session, internMeta: meta, updatedAt: new Date().toISOString() } })
  },

  skipSection: async (sectionId) => {
    const { session } = get()
    if (!session) return
    const sections = {
      ...session.sections,
      [sectionId]: { ...session.sections[sectionId], status: 'skipped' as const },
    }
    const updatedSession = { ...session, sections }
    const generatedDocument = generateMarkdown(updatedSession)
    await updateSession(session.id, { sections, generatedDocument })
    set({ session: { ...updatedSession, generatedDocument, updatedAt: new Date().toISOString() } })
    await get().nextSection()
  },

  submitForReview: async () => {
    const { session } = get()
    if (!session) return undefined
    const reviewToken = crypto.randomUUID()
    await updateSession(session.id, { reviewToken })
    set({ session: { ...session, reviewToken, updatedAt: new Date().toISOString() } })
    return reviewToken
  },

  loadMostRecentSession: async () => {
    const { session } = get()
    if (session) return
    set({ isLoading: true })
    const userSlug = getUserSlug() ?? undefined
    const sessions = await listSessions(userSlug)
    if (sessions.length > 0) {
      set({ session: sessions[0], sessions, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },
}))
