import type { SectionPrompt } from './index'

export const applicationEntrepreneur: SectionPrompt = {
  goal: 'Define where the brand shows up, plus do/don\'t rules for brand usage.',
  opener: "We're getting close to the finish line. Now let's talk about where your brand actually lives in the real world. Where do people most often encounter you — is it your website, social media, events, email, or somewhere else?",
  fields: ['primaryChannels', 'doList', 'dontList'],
  reviewInstruction: `Generate a section review for "Brand Application" section. Return JSON with NO markdown fences:
{"draft": "A brand application section covering: the primary channels where the brand appears (with brief guidance for each), a clear DO list of brand behaviors and standards, and a clear DON'T list of things to avoid. Written as practical rules that anyone representing the brand can follow.", "suggestions": ["1-2 refinements to make the rules more specific or actionable"], "alternatives": [{"option": "An alternative framing of the do/don't rules", "rationale": "Why this structure might be easier to follow in practice"}], "teachingMoment": "1-2 sentences on why brand guidelines only work if they're specific enough to actually use."}`,
}

export const applicationIntern: SectionPrompt = {
  goal: "Guide the intern to define where the fellow's brand shows up and create practical usage rules based on their research.",
  opener: "Now let's bring everything together. From everything you've observed, where does the fellow's brand actually show up — what channels and touchpoints matter most? And based on your research, what rules should anyone representing this brand follow?",
  fields: ['primaryChannels', 'doList', 'dontList'],
  reviewInstruction: `Generate a section review for "Brand Application" section. Return JSON with NO markdown fences:
{"draft": "A brand application section built from the intern's research: primary channels with guidance, DO and DON'T lists for brand usage. Should be practical and specific enough for anyone to follow.", "suggestions": ["1-2 refinements to strengthen the guidelines"], "alternatives": [{"option": "An alternative approach to structuring the rules", "rationale": "Why this might be more practical"}], "teachingMoment": "1-2 sentences on how application guidelines turn abstract brand values into daily decisions."}`,
}
