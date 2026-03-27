const REFLECTION_PROMPTS: Record<string, string> = {
  basics: 'What did you learn about how the fellow thinks about their organization? Was there a gap between how they describe it and how others see it?',
  story: 'What did this section teach you about how brands communicate their origin? How does a good story build trust?',
  values: 'Why do you think naming values explicitly matters for a brand? How did the fellow\'s lived values compare to what they said?',
  personality: 'What surprised you about translating a person\'s personality into a brand personality? What was hardest to capture?',
  visuals_colors: 'What did you learn about how color choices shape the way people perceive a brand? Were the fellow\'s existing colors intentional or accidental?',
  visuals_logo: 'How does consistent name and logo treatment affect credibility? What surprised you about how many ways the fellow\'s name was being used?',
  typography: 'Before this section, did you think fonts mattered much for branding? What changed? How do font choices connect to the personality you defined earlier?',
  messaging: 'What was the difference between how the fellow talks about their work casually vs. what ended up in the brand messaging? What makes a tagline stick?',
  application: 'Looking at the full set of brand guidelines now, what ties everything together? How do the do/don\'t rules make the abstract feel concrete?',
  social_media: 'What did you learn about how a brand voice can flex across different platforms while staying consistent? What was the biggest gap between intent and reality?',
  photography: 'How do visual choices reinforce (or undermine) everything else in a brand guide? What makes a photo feel "on-brand" vs. generic?',
}

export function ReflectionPrompt({ sectionId, value, onChange }: {
  sectionId: string
  value: string
  onChange: (text: string) => void
}) {
  const prompt = REFLECTION_PROMPTS[sectionId] ?? 'What did you learn from working on this section?'

  return (
    <div className="bg-brand-bg-warm rounded-2xl border border-brand-border p-4 md:p-6">
      <h3 className="font-heading text-lg font-semibold text-brand-text mb-2">Your Reflection</h3>
      <p className="text-[15px] text-brand-text-secondary mb-4 leading-relaxed">{prompt}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Write your reflection..."
        className="w-full min-h-[120px] text-[15px] leading-relaxed text-brand-text-secondary bg-white rounded-xl p-4 border border-brand-border outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y font-body"
      />
    </div>
  )
}
