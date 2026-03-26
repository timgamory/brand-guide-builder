export const basicsEntrepreneur = {
  goal: 'Gather the organization name, type, and industry.',
  opener: "Let's start with the basics about your organization. What's the name of your business or organization?",
  fields: ['orgName', 'orgType', 'industry'],
  reviewInstruction: `Generate a section review for "The Basics" section. Return JSON with NO markdown fences:
{"draft": "A brief introductory paragraph about the organization that weaves together the name, type, and industry into a professional description.", "suggestions": ["1-2 optional refinements"], "alternatives": [{"option": "An alternative framing", "rationale": "Why this might work"}], "teachingMoment": "1-2 sentences on why getting the basics right matters for a brand guide."}`,
}

export const basicsIntern = {
  ...basicsEntrepreneur,
  opener: "Let's start by gathering some basic information about your fellow's organization. What's the name of the business or organization you're working with?",
}
