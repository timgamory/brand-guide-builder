import type { Session } from '../types'
import { SECTIONS } from '../data/sections'
import { sendMessage } from './ai'

export type ConsistencyIssue = {
  sections: string[]
  description: string
}

export type ConsistencyResult = {
  issues: ConsistencyIssue[]
  verdict: 'consistent' | 'minor_issues' | 'needs_attention'
}

const SECTION_TITLES: Record<string, string> = {
  basics: 'Introduction',
  story: 'Brand Story',
  values: 'Brand Values',
  personality: 'Brand Personality',
  visuals_colors: 'Color Palette',
  visuals_logo: 'Logo & Name',
  typography: 'Typography',
  messaging: 'Key Messages',
  application: 'Brand in Use',
  social_media: 'Social Media',
  photography: 'Photography & Imagery',
}

export function parseConsistencyResult(text: string): ConsistencyResult | null {
  try {
    const parsed = JSON.parse(text)
    if (parsed.verdict) return parsed
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.verdict) return parsed
      } catch {
        /* fall through */
      }
    }
  }
  return null
}

export async function checkConsistency(session: Session): Promise<ConsistencyResult> {
  const drafts: string[] = []
  for (const section of SECTIONS) {
    const state = session.sections[section.id]
    if (state?.status === 'approved' && state.approvedDraft) {
      const title = SECTION_TITLES[section.id] || section.title
      drafts.push(`## ${title}\n\n${state.approvedDraft}`)
    }
  }

  const systemPrompt = `You are a brand consistency reviewer. Review these brand guide sections together and identify inconsistencies: tone shifts between sections, contradictory claims, terminology that changes (e.g., "customers" in one section and "community members" in another), or visual decisions that clash with personality/values.

Return ONLY JSON with NO markdown fences:
{"issues": [{"sections": ["sectionId1", "sectionId2"], "description": "What's inconsistent"}], "verdict": "consistent" | "minor_issues" | "needs_attention"}`

  const response = await sendMessage(
    systemPrompt,
    [{ role: 'user', content: drafts.join('\n\n---\n\n') }],
    () => {},
  )

  return parseConsistencyResult(response) ?? { issues: [], verdict: 'consistent' }
}
