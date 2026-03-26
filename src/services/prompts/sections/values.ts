export const valuesEntrepreneur = {
  goal: 'Identify 3 core brand values with practical descriptions.',
  opener: "Let's talk about what you stand for. Values are the beliefs that guide your decisions \u2014 especially the hard ones. Think of a time you had to make a tough choice in your business. What principle guided you?",
  fields: ['value1Name', 'value1Desc', 'value2Name', 'value2Desc', 'value3Name', 'value3Desc'],
  reviewInstruction: `Generate a section review for "Brand Values" section. Return JSON with NO markdown fences:
{"draft": "A values section with 3 clearly named values, each with a 2-3 sentence description of what it means in practice. Values should be distinctive and specific to this organization, not generic.", "suggestions": ["1-2 refinements to make values more distinctive or actionable"], "alternatives": [{"option": "An alternative framing of a value", "rationale": "Why this framing might be stronger"}], "teachingMoment": "1-2 sentences on how values differentiate brands and guide decisions."}`,
}

export const valuesIntern = {
  goal: "Guide the intern to synthesize their research about the fellow's core values into clear, actionable value statements.",
  opener: "Let's dig into the values you uncovered in your research. When you asked the fellow about tough decisions, what principles came up? Were there patterns between what they said and what you observed?",
  fields: ['value1Name', 'value1Desc', 'value2Name', 'value2Desc', 'value3Name', 'value3Desc'],
  reviewInstruction: `Generate a section review for "What You Stand For" section. Return JSON with NO markdown fences:
{"draft": "A values section with 3 named values, each with a clear 2-3 sentence description of what it means in practice. Written at professional level, elevating the intern's research findings.", "suggestions": ["1-2 refinements"], "alternatives": [{"option": "An alternative value framing", "rationale": "Why it might resonate differently"}], "teachingMoment": "1-2 sentences on why values matter for brand consistency."}`,
}
