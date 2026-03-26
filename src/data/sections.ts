import type { Section } from '../types'

export const SECTIONS: Section[] = [
  {
    id: 'basics',
    title: 'The Basics',
    subtitle: 'Tell us about your organization',
    optional: false,
    fields: [
      { key: 'orgName', label: "What's the name of your organization?", type: 'text', placeholder: 'e.g. Bright Path Consulting', help: 'This is the name you want people to know you by.' },
      { key: 'orgType', label: 'What kind of organization is this?', type: 'select', options: ['Nonprofit', 'Small Business', 'Startup', 'Agency / Consultancy', 'Community Organization', 'Other'], help: 'This helps us tailor the language in your guide.' },
      { key: 'industry', label: 'What field or industry are you in?', type: 'text', placeholder: 'e.g. Education, Healthcare, Food Service, Technology', help: 'A few words describing what space you work in.' },
    ],
  },
  {
    id: 'story',
    title: 'Your Story',
    subtitle: 'Every brand starts with a reason',
    optional: false,
    fields: [
      { key: 'originStory', label: 'Why did you start this? What problem were you trying to solve?', type: 'textarea', placeholder: "Tell it like you'd tell a friend over coffee. There's no wrong answer here.", help: 'This becomes the heart of your brand story. A couple of sentences is great.' },
      { key: 'whatYouDo', label: 'In one or two sentences, what do you actually do?', type: 'textarea', placeholder: 'e.g. We help first-generation college students navigate the application process.', help: "Imagine someone at a dinner party asks what you do. What do you say?" },
      { key: 'whoYouServe', label: 'Who do you serve? Who benefits from your work?', type: 'textarea', placeholder: 'e.g. Young professionals in the Bronx looking to start businesses', help: "Be as specific as you can. It's okay if you serve more than one group." },
    ],
  },
  {
    id: 'values',
    title: 'What You Stand For',
    subtitle: 'The beliefs that guide every decision',
    optional: false,
    fields: [
      { key: 'value1Name', label: 'Value #1: Give it a name', type: 'text', placeholder: 'e.g. Community First' },
      { key: 'value1Desc', label: 'What does this value mean to you in practice?', type: 'textarea', placeholder: "e.g. We always ask 'does this serve the community?' before making decisions." },
      { key: 'value2Name', label: 'Value #2: Give it a name', type: 'text', placeholder: 'e.g. Transparency' },
      { key: 'value2Desc', label: 'What does this value mean in practice?', type: 'textarea', placeholder: 'How does this show up in your daily work?' },
      { key: 'value3Name', label: 'Value #3: Give it a name', type: 'text', placeholder: 'e.g. Boldness' },
      { key: 'value3Desc', label: 'What does this value mean in practice?', type: 'textarea', placeholder: "One more. If you have more than 3, that's great, but start with 3." },
    ],
  },
  {
    id: 'personality',
    title: 'Brand Personality',
    subtitle: 'If your brand were a person, who would they be?',
    optional: false,
    fields: [
      { key: 'personalityTraits', label: 'Pick 3-5 words that describe how your brand should feel to people', type: 'textarea', placeholder: 'e.g. Warm, trustworthy, bold, approachable, smart', help: 'Think about the vibe you want people to get when they interact with you.' },
      { key: 'brandVoice', label: 'How do you want to sound when you write or talk to people?', type: 'select', options: ['Friendly and conversational', 'Professional and polished', 'Bold and energetic', 'Calm and reassuring', 'Playful and fun', 'Direct and no-nonsense'], help: 'This guides how you write emails, social posts, and marketing materials.' },
      { key: 'brandNot', label: 'What is your brand definitely NOT?', type: 'textarea', placeholder: "e.g. We're never corporate or stiff. We don't talk down to people.", help: "Sometimes it's easier to define yourself by what you're not. What tone or style would feel wrong for your brand?" },
    ],
  },
  {
    id: 'visuals_colors',
    title: 'Colors',
    subtitle: 'The colors people will associate with you',
    optional: false,
    fields: [
      { key: 'primaryColor', label: "What's your main brand color?", type: 'color', defaultValue: '#1e293b', help: "This is the color that shows up most. If you already have one, enter it. If not, pick one that feels right." },
      { key: 'primaryColorName', label: 'Give it a name (optional)', type: 'text', placeholder: 'e.g. Deep Navy, Sunset Orange' },
      { key: 'accentColor1', label: 'Pick an accent color that complements your main color', type: 'color', defaultValue: '#e07a5f', help: 'This is for buttons, highlights, and calls to action.' },
      { key: 'accentColor1Name', label: 'Name this accent color (optional)', type: 'text', placeholder: 'e.g. Coral, Sage Green' },
      { key: 'accentColor2', label: 'One more accent color (optional)', type: 'color', defaultValue: '#81b29a' },
      { key: 'accentColor2Name', label: 'Name it (optional)', type: 'text', placeholder: 'e.g. Forest, Gold' },
      { key: 'bgColor', label: 'What background color feels right?', type: 'color', defaultValue: '#faf8f5', help: 'Pure white can feel cold. A warm off-white or light cream often feels more inviting.' },
    ],
  },
  {
    id: 'visuals_logo',
    title: 'Logo & Name',
    subtitle: 'How your name and logo should be treated',
    optional: false,
    fields: [
      { key: 'hasLogo', label: 'Do you already have a logo?', type: 'select', options: ['Yes', 'No, not yet', 'Working on it'], help: "That's okay either way. This section helps document rules for however your logo is used." },
      { key: 'logoDescription', label: 'If you have a logo, describe what it looks like and what it represents', type: 'textarea', placeholder: "e.g. It's a tree with deep roots forming a letter B. The roots represent our community foundation.", help: "If you don't have one yet, describe what you'd want it to convey." },
      { key: 'nameSpelling', label: 'Is there a specific way your name should always be written?', type: 'textarea', placeholder: "e.g. Always 'BrightPath' as one word, capital B and P. Never 'Bright Path' or 'BRIGHTPATH'.", help: 'This prevents your name from being misspelled in marketing, on partner sites, etc.' },
    ],
  },
  {
    id: 'typography',
    title: 'Typography',
    subtitle: 'The fonts that carry your message',
    optional: false,
    fields: [
      { key: 'hasTypography', label: 'Do you already use specific fonts?', type: 'select', options: ['Yes, I have brand fonts', 'No, I need suggestions', 'I use whatever looks good'], help: "Many businesses haven't thought about this yet, and that's totally fine." },
      { key: 'headlineFont', label: 'What font do you use (or want) for headlines and titles?', type: 'text', placeholder: 'e.g. Fraunces, Playfair Display, Montserrat', help: "If you're not sure, just describe the feel: modern, classic, bold, elegant?" },
      { key: 'bodyFont', label: 'What font do you use (or want) for regular text and paragraphs?', type: 'text', placeholder: 'e.g. DM Sans, Open Sans, Lato', help: 'Body fonts should be easy to read. Clean and simple usually works best.' },
      { key: 'typographyFeel', label: 'What feeling should your typography give people?', type: 'select', options: ['Modern and clean', 'Classic and trustworthy', 'Bold and attention-grabbing', 'Warm and approachable', 'Elegant and refined', 'Fun and creative'] },
    ],
  },
  {
    id: 'messaging',
    title: 'Key Messages',
    subtitle: 'The words you want people to remember',
    optional: false,
    fields: [
      { key: 'tagline', label: "Do you have a tagline or slogan? If not, what would you want it to say?", type: 'text', placeholder: "e.g. 'Where Connections Become Community'", help: "A short phrase that captures what you're all about. 3-8 words is the sweet spot." },
      { key: 'elevatorPitch', label: 'Give us your 30-second pitch. If you had one elevator ride, what would you say?', type: 'textarea', placeholder: 'We help [who] do [what] by [how]. Unlike [alternatives], we [unique difference].', help: "Don't overthink it. Just talk about what makes you special." },
      { key: 'threeThings', label: 'What are the 3 things you most want people to know about you?', type: 'textarea', placeholder: "1. We're community-rooted\n2. We actually listen\n3. We measure what matters", help: 'These become your go-to talking points for everything from websites to pitch decks.' },
    ],
  },
  {
    id: 'application',
    title: 'Putting It All Together',
    subtitle: 'Where your brand shows up in the real world',
    optional: false,
    fields: [
      { key: 'primaryChannels', label: 'Where do people usually find you or interact with you?', type: 'textarea', placeholder: 'e.g. Website, Instagram, email newsletters, community events, Zoom calls', help: 'List the places your brand shows up most. This helps us write usage guidelines for each.' },
      { key: 'doList', label: 'What should people ALWAYS do when representing your brand?', type: 'textarea', placeholder: 'e.g. Use warm, welcoming language. Show real people, not stock photos. Lead with stories.', help: 'Think about what makes your brand feel right when someone uses it well.' },
      { key: 'dontList', label: 'What should people NEVER do when representing your brand?', type: 'textarea', placeholder: "e.g. Never use all caps for our name. Don't use corporate jargon. Avoid cold, transactional language.", help: 'What would make you cringe if you saw it on a flyer or social post?' },
    ],
  },
  {
    id: 'social_media',
    title: 'Social Media',
    subtitle: 'How you show up online',
    optional: true,
    fields: [
      { key: 'socialPlatforms', label: 'Which social media platforms do you use (or plan to use)?', type: 'textarea', placeholder: 'e.g. Instagram, LinkedIn, Facebook, TikTok, X/Twitter', help: "List the ones that matter most to you. You don't need to be everywhere." },
      { key: 'socialVoice', label: 'Does your social media voice differ from your general brand voice? How?', type: 'textarea', placeholder: "e.g. On Instagram we're a bit more casual and visual. On LinkedIn we're more professional but still warm.", help: "It's normal for your tone to shift slightly depending on the platform. Describe how." },
      { key: 'socialDo', label: 'What kind of content should you post? What works for your audience?', type: 'textarea', placeholder: 'e.g. Behind-the-scenes moments, community wins, short tips, event recaps, member spotlights', help: 'Think about what your followers would actually want to see and engage with.' },
      { key: 'socialDont', label: 'What should you avoid posting?', type: 'textarea', placeholder: "e.g. Don't post memes that don't align with our values. Avoid overly polished stock imagery. Never post without proofreading.", help: 'What kind of content would hurt your brand if it showed up on your feed?' },
      { key: 'socialHashtags', label: 'Are there branded hashtags or tags you use consistently?', type: 'text', placeholder: 'e.g. #BrightPathCommunity #BuildTogether', help: 'Branded hashtags help people find your content and build community around your posts.' },
      { key: 'socialFrequency', label: 'How often do you want to post?', type: 'select', options: ['Daily', 'A few times a week', 'Weekly', 'A few times a month', 'Still figuring it out'], help: "There's no perfect answer. Consistency matters more than volume." },
    ],
  },
  {
    id: 'photography',
    title: 'Photography & Imagery',
    subtitle: 'The visual feel of your brand beyond the logo',
    optional: true,
    fields: [
      { key: 'photoStyle', label: 'What kind of photos best represent your brand?', type: 'select', options: ['Candid, in-the-moment shots', 'Clean and professional portraits', 'Bold and artistic imagery', 'Warm, lifestyle photography', 'Documentary style', 'A mix of styles'], help: "Think about the photos you've seen that feel like 'you.'" },
      { key: 'photoSubjects', label: 'What should your photos show? What subjects matter?', type: 'textarea', placeholder: 'e.g. Real community members, our events, the Bronx neighborhood, people working together, our products', help: "Be specific. 'People at events' is more useful than 'people.'" },
      { key: 'photoAvoid', label: 'What kind of imagery should you avoid?', type: 'textarea', placeholder: "e.g. No generic stock photos. No staged smiles. Avoid images that don't reflect our community's diversity.", help: 'What kind of images would feel fake or off-brand?' },
      { key: 'photoMood', label: 'What mood or feeling should your photos create?', type: 'textarea', placeholder: 'e.g. Hopeful, energetic, real, connected, grounded', help: 'Imagine scrolling through your website or social feed. What should it feel like?' },
      { key: 'photoEditing', label: 'Do you have preferences for how photos should be edited?', type: 'textarea', placeholder: 'e.g. Warm tones, slightly desaturated, bright and airy, moody and rich', help: "If you're not sure, describe a visual vibe: bright and warm, dark and moody, natural and unfiltered?" },
      { key: 'iconStyle', label: 'If you use icons or illustrations, what style should they be?', type: 'select', options: ['Simple line icons', 'Filled / solid icons', 'Hand-drawn or organic', 'Geometric and modern', 'Not sure yet', "We don't use icons"], help: 'Icons add personality to websites, presentations, and social posts.' },
    ],
  },
]

export const PHASE_1_SECTION_IDS = ['basics', 'story', 'values', 'personality'] as const
export const ALL_SECTION_IDS = SECTIONS.map(s => s.id)

export function getSection(id: string): Section | undefined {
  return SECTIONS.find(s => s.id === id)
}

export function getSectionIndex(id: string): number {
  return SECTIONS.findIndex(s => s.id === id)
}
