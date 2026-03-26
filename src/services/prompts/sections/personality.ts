export const personalityEntrepreneur = {
  goal: 'Define personality traits, brand voice, and anti-traits.',
  opener: "If your brand were a person at a dinner party, how would other people describe them? Not what you do, but the energy and personality people feel when they interact with your brand.",
  fields: ['personalityTraits', 'brandVoice', 'brandNot'],
  reviewInstruction: `Generate a section review for "Brand Personality" section. Return JSON with NO markdown fences:
{"draft": "A personality section covering: 3-5 personality traits with brief explanations, a voice description that captures how the brand should sound in all communications, and a 'What We Are Not' section that draws clear boundaries.", "suggestions": ["1-2 refinements to sharpen the personality or resolve contradictions"], "alternatives": [{"option": "A different personality framing or voice description", "rationale": "Why this might resonate better"}], "teachingMoment": "1-2 sentences on why brand personality matters beyond just tone of voice."}`,
}

export const personalityIntern = {
  goal: "Guide the intern to define the fellow's brand personality, voice, and tone from their research observations.",
  opener: "Now let's talk about brand personality. When you looked at the fellow's actual communications \u2014 their emails, social posts, how they talk \u2014 what adjectives came to mind? Was there a gap between how they present themselves and how they want to be seen?",
  fields: ['personalityTraits', 'brandVoice', 'brandNot'],
  reviewInstruction: `Generate a section review for "Brand Personality" section. Return JSON with NO markdown fences:
{"draft": "A brand personality section covering: 3-5 personality traits, voice description, and what the brand is NOT. Professional quality, built from intern's research insights.", "suggestions": ["1-2 refinements"], "alternatives": [{"option": "An alternative voice direction", "rationale": "Why this tone might work"}], "teachingMoment": "1-2 sentences on how personality shapes every brand touchpoint."}`,
}
