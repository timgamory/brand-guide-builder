import type { SectionPrompt } from './index'

export const photographyEntrepreneur: SectionPrompt = {
  goal: 'Define the photography and imagery style: photo style, subjects, mood, editing direction, and icon preferences.',
  opener: "Last section — let's talk about imagery. Photos and visuals are often what people notice first, even before they read a word. When you imagine the perfect photo on your website or social feed, what does it look like?",
  fields: ['photoStyle', 'photoSubjects', 'photoAvoid', 'photoMood', 'photoEditing', 'iconStyle'],
  reviewInstruction: `Generate a section review for "Photography & Imagery" section. Return JSON with NO markdown fences:
{"draft": "A photography and imagery section covering: the overall photo style and approach, priority subjects and scenes to capture, imagery to avoid, the target mood and feeling, photo editing/treatment direction, and icon or illustration style preferences. Should be specific enough that a photographer or designer could follow these guidelines independently.", "suggestions": ["1-2 refinements to make the visual direction more specific or cohesive"], "alternatives": [{"option": "An alternative visual direction or mood", "rationale": "Why this aesthetic might better support the brand story"}], "teachingMoment": "1-2 sentences on how imagery creates emotional connection before words do."}`,
}

export const photographyIntern: SectionPrompt = {
  goal: "Guide the intern to define photography and imagery guidelines from their research into the fellow's visual preferences and current materials.",
  opener: "Last one — photography and imagery. When you looked at the fellow's current photos and visuals, what stood out? What felt authentic to the brand, and what felt generic or off? What do you think their visual identity should look like?",
  fields: ['photoStyle', 'photoSubjects', 'photoAvoid', 'photoMood', 'photoEditing', 'iconStyle'],
  reviewInstruction: `Generate a section review for "Photography & Imagery" section. Return JSON with NO markdown fences:
{"draft": "A photography and imagery section built from the intern's research: photo style, subjects, things to avoid, mood, editing direction, and icon style. Should connect visual choices to the brand personality and values defined earlier.", "suggestions": ["1-2 refinements for visual cohesion"], "alternatives": [{"option": "An alternative visual approach", "rationale": "Why this might better represent the brand"}], "teachingMoment": "1-2 sentences on how visual guidelines ensure brand consistency even when different people create content."}`,
}
