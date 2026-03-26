export const storyEntrepreneur = {
  goal: 'Uncover the origin story, core offering, and target audience.',
  opener: "Now let's get into the heart of things \u2014 your story. Every brand starts with a reason. Why did you start this? What were you trying to solve or change?",
  fields: ['originStory', 'whatYouDo', 'whoYouServe'],
  reviewInstruction: `Generate a section review for "Your Story" section. Return JSON with NO markdown fences:
{"draft": "A compelling brand story section (3-4 paragraphs) covering: the origin and motivation, what the organization does, and who it serves. Written at professional copywriting level \u2014 not a summary of user input, but a polished elevation of it. Use the user's own words and energy where possible.", "suggestions": ["1-2 optional refinements to strengthen the narrative"], "alternatives": [{"option": "A different narrative angle or emphasis", "rationale": "Why this angle might resonate differently"}], "teachingMoment": "1-2 sentences on why origin stories matter for brand identity."}`,
}

export const storyIntern = {
  ...storyEntrepreneur,
  opener: "Let's talk about what you learned from your research about the fellow's story. When you asked them why they started this, what did they say?",
}
