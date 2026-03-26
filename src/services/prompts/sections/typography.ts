import type { SectionPrompt } from './index'

export const typographyEntrepreneur: SectionPrompt = {
  goal: 'Define the typography system: headline font, body font, and the overall feeling the type should convey.',
  opener: "Let's talk about fonts. Typography might seem like a small detail, but it shapes how people feel about everything you write — from your website to your business cards. Do you already have fonts you use, or would you like some guidance?",
  fields: ['hasTypography', 'headlineFont', 'bodyFont', 'typographyFeel'],
  reviewInstruction: `Generate a section review for "Typography" section. Return JSON with NO markdown fences:
{"draft": "A typography section specifying: the headline/display font with usage notes, the body/paragraph font with readability guidance, the overall typographic feel, and basic rules (font sizes, hierarchy, what to avoid). If the user doesn't have fonts yet, recommend a complementary pair that matches their brand personality.", "suggestions": ["1-2 refinements to improve font pairing or hierarchy"], "alternatives": [{"option": "An alternative font pairing or typographic direction", "rationale": "Why this combination might better suit the brand"}], "teachingMoment": "1-2 sentences on how typography silently shapes credibility and readability."}`,
}

export const typographyIntern: SectionPrompt = {
  goal: "Guide the intern to define the fellow's typography system by connecting font choices to the brand personality they've already established.",
  opener: "Let's work on typography. When you looked at the fellow's current materials, what fonts were they using? Did the type feel intentional, or more like whatever was the default? How does it compare to the brand personality you defined earlier?",
  fields: ['hasTypography', 'headlineFont', 'bodyFont', 'typographyFeel'],
  reviewInstruction: `Generate a section review for "Typography" section. Return JSON with NO markdown fences:
{"draft": "A typography section built from the intern's research: headline and body fonts, typographic feel, and usage rules. Should connect font choices back to the brand personality the intern defined earlier.", "suggestions": ["1-2 refinements for font pairing or readability"], "alternatives": [{"option": "An alternative font direction", "rationale": "Why this pairing might be a better fit"}], "teachingMoment": "1-2 sentences on why font choices are never 'just fonts' — they carry personality."}`,
}
