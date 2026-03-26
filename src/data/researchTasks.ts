import type { ResearchTaskType } from '../types'

export type ResearchTaskTemplate = {
  id: string
  description: string
  type: ResearchTaskType
}

export const RESEARCH_TASKS: Record<string, ResearchTaskTemplate[]> = {
  basics: [
    { id: 'basics-interview-1', description: 'Ask the fellow: "How do you describe what you do when someone asks at a party?"', type: 'interview' },
    { id: 'basics-observe-1', description: 'Look at the fellow\'s website, social media, or any materials. How do they currently describe the organization?', type: 'observe' },
  ],
  story: [
    { id: 'story-interview-1', description: 'Ask the fellow: "Why did you start this? What moment made you decide to go for it?"', type: 'interview' },
    { id: 'story-interview-2', description: 'Ask the fellow: "Who were you trying to help, and what were they struggling with?"', type: 'interview' },
    { id: 'story-observe-1', description: 'Look at their website\'s About page. Note the gap between how they talk about the business in person vs. how it\'s described online.', type: 'observe' },
    { id: 'story-research-1', description: 'Find 2-3 competitors or similar organizations. How do they tell their origin story? What patterns do you notice?', type: 'research' },
  ],
  values: [
    { id: 'values-interview-1', description: 'Ask the fellow: "When you had to make a tough decision, what principle guided you?"', type: 'interview' },
    { id: 'values-interview-2', description: 'Ask the fellow: "What behavior would you never tolerate, even if it made money?"', type: 'interview' },
    { id: 'values-observe-1', description: 'Look at how they interact with customers or community members. What values are they living out, even if they haven\'t named them?', type: 'observe' },
    { id: 'values-reflect-1', description: 'Based on your interviews and observations, what 3-5 values keep coming up? Are these stated values or lived values?', type: 'reflect' },
  ],
  personality: [
    { id: 'personality-interview-1', description: 'Ask the fellow: "If your brand were a person at a party, how would they act? What would people say about them?"', type: 'interview' },
    { id: 'personality-observe-1', description: 'Read the fellow\'s recent emails, social posts, or marketing materials. List 5 adjectives that describe the actual tone.', type: 'observe' },
    { id: 'personality-research-1', description: 'Pick 2 brands the fellow admires. What personality traits do those brands project? What can you borrow?', type: 'research' },
  ],
  visuals_colors: [
    { id: 'colors-observe-1', description: 'Look at the fellow\'s website, social media, business cards, and any printed materials. What colors are they already using? Are they consistent?', type: 'observe' },
    { id: 'colors-interview-1', description: 'Ask the fellow: "What colors feel like \'you\'? Are there colors you\'re drawn to or colors you\'d never use?"', type: 'interview' },
    { id: 'colors-research-1', description: 'Look at 2-3 competitors or brands the fellow admires. What colors do they use? How does color help them stand out or blend in?', type: 'research' },
  ],
  visuals_logo: [
    { id: 'logo-observe-1', description: 'Find every place the fellow\'s name or logo appears (website, social profiles, email signature, flyers). Is it written the same way every time?', type: 'observe' },
    { id: 'logo-interview-1', description: 'Ask the fellow: "What does your logo mean to you? If you don\'t have one, what would you want it to say about your brand?"', type: 'interview' },
    { id: 'logo-research-1', description: 'Look at how 2-3 similar organizations use their logos. What rules seem to govern their logo usage (sizing, placement, backgrounds)?', type: 'research' },
  ],
  typography: [
    { id: 'typography-observe-1', description: 'Check the fellow\'s website, documents, and social graphics. What fonts are they currently using? Are they consistent or all over the place?', type: 'observe' },
    { id: 'typography-interview-1', description: 'Ask the fellow: "When you see your own materials, does the text feel right? Does it match the personality we defined?"', type: 'interview' },
    { id: 'typography-research-1', description: 'Find 2-3 brands whose typography feels similar to the personality you defined. What fonts do they use for headlines vs. body text?', type: 'research' },
  ],
  messaging: [
    { id: 'messaging-interview-1', description: 'Ask the fellow: "When you\'re at your most passionate explaining what you do, what do you say? Give me the unscripted version."', type: 'interview' },
    { id: 'messaging-interview-2', description: 'Ask the fellow: "What are the 3 things you wish everyone knew about your organization?"', type: 'interview' },
    { id: 'messaging-observe-1', description: 'Look at how the fellow currently describes themselves on their website, LinkedIn, and any pitch materials. What\'s the strongest line? What falls flat?', type: 'observe' },
  ],
  application: [
    { id: 'application-observe-1', description: 'Map out every place the fellow\'s brand shows up: website, social media, email, events, signage, partnerships. Which touchpoints get the most attention?', type: 'observe' },
    { id: 'application-reflect-1', description: 'Based on everything you\'ve learned, write 3 "always do" and 3 "never do" rules for anyone representing this brand. What would make the fellow proud vs. cringe?', type: 'reflect' },
  ],
  social_media: [
    { id: 'social-observe-1', description: 'Review the fellow\'s last 10-20 social media posts across all platforms. Which posts got the most engagement? What do the best-performing posts have in common?', type: 'observe' },
    { id: 'social-research-1', description: 'Look at how 2-3 similar organizations use social media. What content types, posting frequencies, and tones seem to work in this space?', type: 'research' },
  ],
  photography: [
    { id: 'photo-observe-1', description: 'Look at all the photos the fellow currently uses (website, social, marketing). Which ones feel most authentic? Which feel generic or off-brand?', type: 'observe' },
    { id: 'photo-reflect-1', description: 'Based on the brand personality and values you\'ve defined, describe the ideal photo that would appear on the fellow\'s homepage. What\'s in it? What mood does it create?', type: 'reflect' },
  ],
}

export function getResearchTasks(sectionId: string): ResearchTaskTemplate[] {
  return RESEARCH_TASKS[sectionId] ?? []
}
