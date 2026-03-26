import { basicsEntrepreneur, basicsIntern } from './basics'
import { storyEntrepreneur, storyIntern } from './story'
import { valuesEntrepreneur, valuesIntern } from './values'
import { personalityEntrepreneur, personalityIntern } from './personality'
import { colorsEntrepreneur, colorsIntern } from './colors'
import { logoEntrepreneur, logoIntern } from './logo'
import { typographyEntrepreneur, typographyIntern } from './typography'
import { messagingEntrepreneur, messagingIntern } from './messaging'
import { applicationEntrepreneur, applicationIntern } from './application'
import { socialMediaEntrepreneur, socialMediaIntern } from './socialMedia'
import { photographyEntrepreneur, photographyIntern } from './photography'

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
  visuals_colors: colorsEntrepreneur,
  visuals_logo: logoEntrepreneur,
  typography: typographyEntrepreneur,
  messaging: messagingEntrepreneur,
  application: applicationEntrepreneur,
  social_media: socialMediaEntrepreneur,
  photography: photographyEntrepreneur,
}

const internPrompts: Record<string, SectionPrompt> = {
  basics: basicsIntern,
  story: storyIntern,
  values: valuesIntern,
  personality: personalityIntern,
  visuals_colors: colorsIntern,
  visuals_logo: logoIntern,
  typography: typographyIntern,
  messaging: messagingIntern,
  application: applicationIntern,
  social_media: socialMediaIntern,
  photography: photographyIntern,
}

export function getSectionPrompt(sectionId: string, path: 'entrepreneur' | 'intern'): SectionPrompt | undefined {
  return path === 'entrepreneur' ? entrepreneurPrompts[sectionId] : internPrompts[sectionId]
}
