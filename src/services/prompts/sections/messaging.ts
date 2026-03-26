import type { SectionPrompt } from './index'

export const messagingEntrepreneur: SectionPrompt = {
  goal: 'Craft the tagline, elevator pitch, and three key talking points.',
  opener: "Now let's get into messaging — the words people will remember you by. If someone asked 'what do you do?' at a networking event and you had 30 seconds to answer, what would you say?",
  fields: ['tagline', 'elevatorPitch', 'threeThings'],
  reviewInstruction: `Generate a section review for "Key Messages" section. Return JSON with NO markdown fences:
{"draft": "A messaging section with: a memorable tagline (3-8 words) that captures the brand essence, a polished elevator pitch (2-3 sentences) that could be used in any context, and 3 clear talking points that serve as go-to messages for marketing and communications. Each element should be distinct but reinforcing.", "suggestions": ["1-2 refinements to sharpen the tagline or strengthen the pitch"], "alternatives": [{"option": "An alternative tagline or messaging angle", "rationale": "Why this direction might resonate differently with the audience"}], "teachingMoment": "1-2 sentences on why consistent messaging prevents brand dilution."}`,
}

export const messagingIntern: SectionPrompt = {
  goal: "Guide the intern to craft the fellow's core messages — tagline, pitch, and talking points — from their research conversations and observations.",
  opener: "Let's build the key messages. When you talked to the fellow about what makes them special, what phrases or ideas kept coming up? What do they say when they're most passionate about their work?",
  fields: ['tagline', 'elevatorPitch', 'threeThings'],
  reviewInstruction: `Generate a section review for "Key Messages" section. Return JSON with NO markdown fences:
{"draft": "A messaging section built from the intern's research: tagline, elevator pitch, and 3 talking points. Should capture the fellow's authentic voice while polishing it to professional brand language.", "suggestions": ["1-2 refinements to sharpen messaging"], "alternatives": [{"option": "An alternative tagline or pitch angle", "rationale": "Why this angle might land better"}], "teachingMoment": "1-2 sentences on how great messaging captures what's already true about a brand, not what sounds clever."}`,
}
