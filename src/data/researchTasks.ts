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
}

export function getResearchTasks(sectionId: string): ResearchTaskTemplate[] {
  return RESEARCH_TASKS[sectionId] ?? []
}
