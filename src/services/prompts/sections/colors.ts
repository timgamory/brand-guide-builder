import type { SectionPrompt } from './index'

export const colorsEntrepreneur: SectionPrompt = {
  goal: 'Define the brand color palette: primary color, accent colors, and background color.',
  opener: "Let's talk about color. Color is one of the fastest ways people recognize a brand — think about how quickly you spot a Coca-Cola red or a Tiffany blue. Do you already have colors you use, or are we starting fresh?",
  fields: ['primaryColor', 'primaryColorName', 'accentColor1', 'accentColor1Name', 'accentColor2', 'accentColor2Name', 'bgColor'],
  reviewInstruction: `Generate a section review for "Colors" section. Return JSON with NO markdown fences:
{"draft": "A color palette section that presents the primary brand color, 1-2 accent colors, and a background color. Each color should include its hex value, a distinctive name, and a brief note on when/how to use it. Include guidance on color ratios (e.g., 60-30-10 rule) and accessibility considerations.", "suggestions": ["1-2 refinements to improve color harmony, contrast, or usability"], "alternatives": [{"option": "An alternative accent color or palette direction", "rationale": "Why this palette shift might strengthen the brand"}], "teachingMoment": "1-2 sentences on why consistent color builds brand recognition."}`,
}

export const colorsIntern: SectionPrompt = {
  goal: "Guide the intern to build a cohesive color palette from their research into the fellow's existing colors, preferences, and competitive landscape.",
  opener: "Let's work on the color palette. From your research, what colors is the fellow already using — on their website, in their materials, or even in how they dress or decorate their space? Did you notice any patterns?",
  fields: ['primaryColor', 'primaryColorName', 'accentColor1', 'accentColor1Name', 'accentColor2', 'accentColor2Name', 'bgColor'],
  reviewInstruction: `Generate a section review for "Colors" section. Return JSON with NO markdown fences:
{"draft": "A color palette section presenting primary color, accent colors, and background color with hex values, names, and usage guidance. Built from the intern's research into the fellow's existing materials and preferences. Include color ratio guidance and accessibility notes.", "suggestions": ["1-2 refinements the intern should consider for color harmony or contrast"], "alternatives": [{"option": "An alternative color direction", "rationale": "Why this shift might work better"}], "teachingMoment": "1-2 sentences on how color psychology shapes brand perception."}`,
}
