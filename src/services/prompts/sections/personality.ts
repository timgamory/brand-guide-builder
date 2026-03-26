export const personalityEntrepreneur = {
  goal: 'Define personality traits, brand voice, and anti-traits.',
  opener: "If your brand were a person at a dinner party, how would other people describe them? Not what you do, but the energy and personality people feel when they interact with your brand.",
  fields: ['personalityTraits', 'brandVoice', 'brandNot'],
  reviewInstruction: `Generate a section review for "Brand Personality" section. Return JSON with NO markdown fences:
{"draft": "A personality section covering: 3-5 personality traits with brief explanations, a voice description that captures how the brand should sound in all communications, and a 'What We Are Not' section that draws clear boundaries.", "suggestions": ["1-2 refinements to sharpen the personality or resolve contradictions"], "alternatives": [{"option": "A different personality framing or voice description", "rationale": "Why this might resonate better"}], "teachingMoment": "1-2 sentences on why brand personality matters beyond just tone of voice."}`,
}

export const personalityIntern = {
  ...personalityEntrepreneur,
  opener: "Brand personality is about how the brand feels to people. Based on your research \u2014 reading their social media, watching how they interact with customers \u2014 what adjectives would you use to describe the fellow's brand personality?",
}
