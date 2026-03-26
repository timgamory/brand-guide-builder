import type { Session } from '../../types'
import { SECTIONS } from '../../data/sections'
import { ENTREPRENEUR_PERSONA, INTERN_COACH_PERSONA } from './persona'
import { getSectionPrompt } from './sections'

function buildContextBlock(session: Session): string {
  const approvedSections = SECTIONS.filter(s => session.sections[s.id]?.status === 'approved')
  if (approvedSections.length === 0) return ''

  const lines = ['Previously approved brand data:']
  const d = session.brandData

  if (d.orgName) lines.push(`- Name: ${d.orgName}${d.orgType ? ` (${d.orgType})` : ''}${d.industry ? `, ${d.industry}` : ''}`)
  if (d.originStory) lines.push(`- Story: ${d.originStory.slice(0, 150)}...`)
  if (d.value1Name) {
    const vals = [d.value1Name, d.value2Name, d.value3Name].filter(Boolean).join(', ')
    lines.push(`- Values: ${vals}`)
  }
  if (d.personalityTraits) lines.push(`- Personality: ${d.personalityTraits}`)
  if (d.brandVoice) lines.push(`- Voice: ${d.brandVoice}`)
  if (d.brandNot) lines.push(`- Not: ${d.brandNot.slice(0, 100)}`)
  if (d.tagline) lines.push(`- Tagline: "${d.tagline}"`)
  if (d.primaryColor) lines.push(`- Primary color: ${d.primaryColor}`)

  return lines.join('\n')
}

export function buildSystemPrompt(session: Session, sectionId: string): string {
  const persona = session.path === 'entrepreneur' ? ENTREPRENEUR_PERSONA : INTERN_COACH_PERSONA
  const context = buildContextBlock(session)
  const sectionPrompt = getSectionPrompt(sectionId, session.path)

  const parts = ['# Persona\n\n' + persona]

  if (context) {
    parts.push('# Context\n\n' + context)
  }

  if (sectionPrompt) {
    parts.push(`# Current Section\n\nGoal: ${sectionPrompt.goal}\n\nData fields to populate through conversation: ${sectionPrompt.fields.join(', ')}`)
  }

  parts.push(`# Constraints\n\n- Ask one question at a time\n- Explain why each question matters in plain language\n- Use the user's own language when reflecting back\n- Never use jargon without defining it\n- When you have gathered enough information for all fields in this section, tell the user you're ready to put together a draft and produce the section review.`)

  if (sectionPrompt) {
    parts.push(`# Review Output\n\nWhen ready to produce the section review, respond with ONLY the following JSON (no markdown fences, no extra text):\n\n${sectionPrompt.reviewInstruction}`)
  }

  return parts.join('\n\n---\n\n')
}

export function getOpener(session: Session, sectionId: string): string {
  const sectionPrompt = getSectionPrompt(sectionId, session.path)
  return sectionPrompt?.opener ?? "Let's work on this section. Tell me what you know so far."
}
