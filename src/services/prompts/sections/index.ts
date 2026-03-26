import { basicsEntrepreneur, basicsIntern } from './basics'
import { storyEntrepreneur, storyIntern } from './story'
import { valuesEntrepreneur, valuesIntern } from './values'
import { personalityEntrepreneur, personalityIntern } from './personality'

export type SectionPrompt = {
  goal: string
  opener: string
  fields: string[]
  reviewInstruction: string
}

const entrepreneurPrompts: Record<string, SectionPrompt> = {
  basics: basicsEntrepreneur,
  story: storyEntrepreneur,
  values: valuesEntrepreneur,
  personality: personalityEntrepreneur,
}

const internPrompts: Record<string, SectionPrompt> = {
  basics: basicsIntern,
  story: storyIntern,
  values: valuesIntern,
  personality: personalityIntern,
}

export function getSectionPrompt(sectionId: string, path: 'entrepreneur' | 'intern'): SectionPrompt | undefined {
  return path === 'entrepreneur' ? entrepreneurPrompts[sectionId] : internPrompts[sectionId]
}
