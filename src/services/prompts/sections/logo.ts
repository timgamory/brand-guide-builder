import type { SectionPrompt } from './index'

export const logoEntrepreneur: SectionPrompt = {
  goal: 'Document the logo status, its meaning, and how the brand name should always be written.',
  opener: "Let's talk about your logo and name. Your logo is often the very first thing people see, and how your name is spelled matters more than most people think. Do you have a logo already, or is that still in the works?",
  fields: ['hasLogo', 'logoDescription', 'nameSpelling'],
  reviewInstruction: `Generate a section review for "Logo & Name" section. Return JSON with NO markdown fences:
{"draft": "A logo and name usage section covering: the current logo status and what it represents, clear rules for how the brand name must be written (capitalization, spacing, abbreviations), and basic logo usage guidelines (minimum size, clear space, what to avoid). If no logo exists yet, provide guidance on what the logo should convey based on the brand personality.", "suggestions": ["1-2 refinements to strengthen name/logo usage rules"], "alternatives": [{"option": "An alternative approach to name treatment or logo description", "rationale": "Why this direction could be stronger"}], "teachingMoment": "1-2 sentences on why consistent name treatment builds professionalism and trust."}`,
}

export const logoIntern: SectionPrompt = {
  goal: "Guide the intern to document the fellow's logo and name usage rules based on their research and observations.",
  opener: "Now let's look at the logo and name. From your research, does the fellow have a logo? How is their name being used across different places — is it consistent, or did you notice variations?",
  fields: ['hasLogo', 'logoDescription', 'nameSpelling'],
  reviewInstruction: `Generate a section review for "Logo & Name" section. Return JSON with NO markdown fences:
{"draft": "A logo and name usage section built from the intern's research: logo status and meaning, name spelling rules, and usage guidelines. Professional quality, addressing any inconsistencies the intern discovered.", "suggestions": ["1-2 refinements to tighten the naming rules"], "alternatives": [{"option": "An alternative name treatment approach", "rationale": "Why this might improve consistency"}], "teachingMoment": "1-2 sentences on how name inconsistency erodes brand trust over time."}`,
}
