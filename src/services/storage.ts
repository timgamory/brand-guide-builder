import Dexie, { type EntityTable } from 'dexie'
import type { Session, Conversation, Reflections, Review, ReviewStatus } from '../types'
import { SECTIONS } from '../data/sections'

const db = new Dexie('BrandGuideBuilder') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  conversations: EntityTable<Conversation, 'id'>
  reflections: EntityTable<Reflections, 'id'>
  reviews: EntityTable<Review, 'id'>
}

db.version(1).stores({
  sessions: 'id, path, updatedAt',
  conversations: 'id',
  reflections: 'id',
  reviews: 'id',
})

function generateId(): string {
  return crypto.randomUUID()
}

function buildInitialSections(): Session['sections'] {
  const sections: Session['sections'] = {}
  for (const section of SECTIONS) {
    sections[section.id] = {
      status: 'not_started',
      approvedDraft: null,
      reviewFeedback: null,
    }
  }
  return sections
}

async function createSession(path: Session['path']): Promise<Session> {
  const now = new Date().toISOString()
  const session: Session = {
    id: generateId(),
    path,
    brandData: {},
    sections: buildInitialSections(),
    currentSection: 'basics',
    createdAt: now,
    updatedAt: now,
  }
  await db.sessions.add(session)
  return session
}

async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id)
}

async function updateSession(id: string, updates: Partial<Omit<Session, 'id' | 'createdAt'>>): Promise<void> {
  await db.sessions.update(id, { ...updates, updatedAt: new Date().toISOString() })
}

async function listSessions(): Promise<Session[]> {
  return db.sessions.orderBy('updatedAt').reverse().toArray()
}

async function deleteSession(id: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.conversations, db.reflections, db.reviews], async () => {
    await db.sessions.delete(id)
    const convos = await db.conversations.where('id').startsWith(id).toArray()
    await db.conversations.bulkDelete(convos.map(c => c.id))
    await db.reflections.delete(id)
    await db.reviews.delete(id)
  })
}

async function getReflections(sessionId: string): Promise<Reflections | undefined> {
  return db.reflections.get(sessionId)
}

async function saveReflection(sessionId: string, sectionId: string, text: string): Promise<void> {
  const existing = await db.reflections.get(sessionId)
  const entry = { sectionId, text, timestamp: new Date().toISOString() }
  if (existing) {
    const entries = existing.entries.filter(e => e.sectionId !== sectionId)
    entries.push(entry)
    await db.reflections.update(sessionId, { entries })
  } else {
    await db.reflections.add({ id: sessionId, entries: [entry] })
  }
}

async function getReview(sessionId: string): Promise<Review | undefined> {
  return db.reviews.get(sessionId)
}

async function saveReviewStatus(sessionId: string, sectionId: string, status: ReviewStatus, notes?: string): Promise<void> {
  const existing = await db.reviews.get(sessionId)
  const sectionState = { status, notes, reviewedAt: new Date().toISOString() }
  if (existing) {
    await db.reviews.update(sessionId, {
      sections: { ...existing.sections, [sectionId]: sectionState }
    })
  } else {
    await db.reviews.add({ id: sessionId, sections: { [sectionId]: sectionState } })
  }
}

async function getConversation(sessionId: string, sectionId: string): Promise<Conversation | undefined> {
  return db.conversations.get(`${sessionId}:${sectionId}`)
}

async function saveConversation(sessionId: string, sectionId: string, conversation: Omit<Conversation, 'id'>): Promise<void> {
  const id = `${sessionId}:${sectionId}`
  await db.conversations.put({ ...conversation, id })
}

export {
  db,
  createSession,
  getSession,
  updateSession,
  listSessions,
  deleteSession,
  getReflections,
  saveReflection,
  getReview,
  saveReviewStatus,
  getConversation,
  saveConversation,
}
