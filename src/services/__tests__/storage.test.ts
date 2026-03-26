import { describe, it, expect, beforeEach } from 'vitest'
import { db, createSession, getSession, updateSession, listSessions, deleteSession } from '../storage'

describe('storage', () => {
  beforeEach(async () => {
    await db.sessions.clear()
    await db.conversations.clear()
    await db.reflections.clear()
    await db.reviews.clear()
  })

  it('creates a session with correct defaults', async () => {
    const session = await createSession('entrepreneur')
    expect(session.id).toBeTruthy()
    expect(session.path).toBe('entrepreneur')
    expect(session.brandData).toEqual({})
    expect(session.currentSection).toBe('basics')
    expect(session.sections).toBeDefined()
    expect(session.sections['basics'].status).toBe('not_started')
  })

  it('retrieves a session by id', async () => {
    const created = await createSession('entrepreneur')
    const fetched = await getSession(created.id)
    expect(fetched?.id).toBe(created.id)
    expect(fetched?.path).toBe('entrepreneur')
  })

  it('updates a session', async () => {
    const session = await createSession('entrepreneur')
    await updateSession(session.id, { brandData: { orgName: 'Test Org' } })
    const fetched = await getSession(session.id)
    expect(fetched?.brandData.orgName).toBe('Test Org')
  })

  it('lists all sessions', async () => {
    await createSession('entrepreneur')
    await createSession('intern')
    const sessions = await listSessions()
    expect(sessions).toHaveLength(2)
  })

  it('deletes a session', async () => {
    const session = await createSession('entrepreneur')
    await deleteSession(session.id)
    const fetched = await getSession(session.id)
    expect(fetched).toBeUndefined()
  })
})
