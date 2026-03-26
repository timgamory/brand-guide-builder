import type { SectionPrompt } from './index'

export const socialMediaEntrepreneur: SectionPrompt = {
  goal: 'Define the social media strategy: platforms, voice, content guidelines, hashtags, and posting frequency.',
  opener: "Let's talk about social media. It's where most people will interact with your brand day to day. Which platforms are you on — or which ones do you want to be on? And how's it going so far?",
  fields: ['socialPlatforms', 'socialVoice', 'socialDo', 'socialDont', 'socialHashtags', 'socialFrequency'],
  reviewInstruction: `Generate a section review for "Social Media" section. Return JSON with NO markdown fences:
{"draft": "A social media guidelines section covering: which platforms to prioritize and why, how the brand voice adapts for social (platform-specific nuances), content types to post (with examples), content to avoid, branded hashtags and their usage, and posting cadence recommendations. Should be practical enough for someone managing the accounts daily.", "suggestions": ["1-2 refinements to sharpen the platform strategy or content guidelines"], "alternatives": [{"option": "An alternative platform focus or content strategy", "rationale": "Why this approach might better reach the target audience"}], "teachingMoment": "1-2 sentences on why social media voice can flex without losing brand consistency."}`,
}

export const socialMediaIntern: SectionPrompt = {
  goal: "Guide the intern to build social media guidelines from their research into the fellow's current social presence and audience.",
  opener: "Let's work on social media guidelines. You've been looking at the fellow's social accounts — what's working well? What feels on-brand, and what feels off? Which platforms does their audience actually use?",
  fields: ['socialPlatforms', 'socialVoice', 'socialDo', 'socialDont', 'socialHashtags', 'socialFrequency'],
  reviewInstruction: `Generate a section review for "Social Media" section. Return JSON with NO markdown fences:
{"draft": "A social media guidelines section built from the intern's research: platform priorities, voice adaptation, content do's and don'ts, hashtags, and posting frequency. Should reflect what the intern observed about current performance.", "suggestions": ["1-2 refinements based on audience fit"], "alternatives": [{"option": "An alternative social strategy direction", "rationale": "Why this might better serve the fellow's goals"}], "teachingMoment": "1-2 sentences on how researching existing social presence reveals the gap between brand intent and brand reality."}`,
}
