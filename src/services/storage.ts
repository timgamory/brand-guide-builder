import { supabase } from './supabase'
import type { Session, Conversation, Reflections, Review, ReviewStatus } from '../types'
import { SECTIONS } from '../data/sections'

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

// Supabase stores snake_case columns, app uses camelCase types.
// These helpers convert between the two.

function sessionFromRow(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    path: row.path as Session['path'],
    userSlug: row.user_slug as string | undefined,
    brandData: (row.brand_data ?? {}) as Session['brandData'],
    sections: (row.sections ?? {}) as Session['sections'],
    currentSection: row.current_section as string,
    internMeta: row.intern_meta as Session['internMeta'],
    reviewToken: row.review_token as string | undefined,
    generatedDocument: row.generated_document as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function sessionToRow(session: Partial<Session> & { id?: string }) {
  const row: Record<string, unknown> = {}
  if (session.id !== undefined) row.id = session.id
  if (session.path !== undefined) row.path = session.path
  if (session.userSlug !== undefined) row.user_slug = session.userSlug
  if (session.brandData !== undefined) row.brand_data = session.brandData
  if (session.sections !== undefined) row.sections = session.sections
  if (session.currentSection !== undefined) row.current_section = session.currentSection
  if (session.internMeta !== undefined) row.intern_meta = session.internMeta
  if (session.reviewToken !== undefined) row.review_token = session.reviewToken
  if (session.generatedDocument !== undefined) row.generated_document = session.generatedDocument
  return row
}

function conversationFromRow(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    messages: (row.messages ?? []) as Conversation['messages'],
    researchTasks: row.research_tasks as Conversation['researchTasks'],
    conversationSummary: row.conversation_summary as string | undefined,
    summarizedAtCount: row.summarized_at_count as number | undefined,
  }
}

function conversationToRow(id: string, convo: Omit<Conversation, 'id'>) {
  return {
    id,
    messages: convo.messages,
    research_tasks: convo.researchTasks,
    conversation_summary: convo.conversationSummary,
    summarized_at_count: convo.summarizedAtCount,
  }
}

// === Sessions ===

async function createSession(path: Session['path'], userSlug?: string): Promise<Session> {
  const session: Session = {
    id: generateId(),
    path,
    userSlug,
    brandData: {},
    sections: buildInitialSections(),
    currentSection: 'basics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase.from('sessions').insert({
    id: session.id,
    path: session.path,
    user_slug: session.userSlug,
    brand_data: session.brandData,
    sections: session.sections,
    current_section: session.currentSection,
  })

  if (error) throw new Error(`Failed to create session: ${error.message}`)
  return session
}

async function getSession(id: string): Promise<Session | undefined> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return undefined
  return sessionFromRow(data)
}

async function updateSession(id: string, updates: Partial<Omit<Session, 'id' | 'createdAt'>>): Promise<void> {
  const row = sessionToRow(updates)
  row.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('sessions')
    .update(row)
    .eq('id', id)

  if (error) throw new Error(`Failed to update session: ${error.message}`)
}

async function listSessions(userSlug?: string): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select('*')
    .order('updated_at', { ascending: false })

  if (userSlug) {
    query = query.eq('user_slug', userSlug)
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to list sessions: ${error.message}`)
  return (data ?? []).map(sessionFromRow)
}

async function getSessionByReviewToken(token: string): Promise<Session | undefined> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('review_token', token)
    .single()

  if (error || !data) return undefined
  return sessionFromRow(data)
}

async function deleteSession(id: string): Promise<void> {
  // Delete related data first
  const { data: convos } = await supabase
    .from('conversations')
    .select('id')
    .like('id', `${id}:%`)

  if (convos && convos.length > 0) {
    await supabase
      .from('conversations')
      .delete()
      .in('id', convos.map(c => c.id))
  }

  await supabase.from('reflections').delete().eq('id', id)
  await supabase.from('reviews').delete().eq('id', id)
  await supabase.from('sessions').delete().eq('id', id)
}

// === Reflections ===

async function getReflections(sessionId: string): Promise<Reflections | undefined> {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !data) return undefined
  return { id: data.id, entries: data.entries ?? [] }
}

async function saveReflection(sessionId: string, sectionId: string, text: string): Promise<void> {
  const existing = await getReflections(sessionId)
  const entry = { sectionId, text, timestamp: new Date().toISOString() }

  if (existing) {
    const entries = existing.entries.filter(e => e.sectionId !== sectionId)
    entries.push(entry)
    await supabase.from('reflections').update({ entries }).eq('id', sessionId)
  } else {
    await supabase.from('reflections').insert({ id: sessionId, entries: [entry] })
  }
}

// === Reviews ===

async function getReview(sessionId: string): Promise<Review | undefined> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !data) return undefined
  return { id: data.id, sections: data.sections ?? {} }
}

async function saveReviewStatus(sessionId: string, sectionId: string, status: ReviewStatus, notes?: string): Promise<void> {
  const existing = await getReview(sessionId)
  const sectionState = { status, notes, reviewedAt: new Date().toISOString() }

  if (existing) {
    await supabase
      .from('reviews')
      .update({ sections: { ...existing.sections, [sectionId]: sectionState } })
      .eq('id', sessionId)
  } else {
    await supabase
      .from('reviews')
      .insert({ id: sessionId, sections: { [sectionId]: sectionState } })
  }
}

// === Conversations ===

async function getConversation(sessionId: string, sectionId: string): Promise<Conversation | undefined> {
  const id = `${sessionId}:${sectionId}`
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return undefined
  return conversationFromRow(data)
}

async function saveConversation(sessionId: string, sectionId: string, conversation: Omit<Conversation, 'id'>): Promise<void> {
  const id = `${sessionId}:${sectionId}`
  const row = conversationToRow(id, conversation)

  const { error } = await supabase
    .from('conversations')
    .upsert(row)

  if (error) throw new Error(`Failed to save conversation: ${error.message}`)
}

export {
  createSession,
  getSession,
  getSessionByReviewToken,
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
