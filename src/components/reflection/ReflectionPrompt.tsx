const REFLECTION_PROMPTS: Record<string, string> = {
  basics: 'What did you learn about how the fellow thinks about their organization? Was there a gap between how they describe it and how others see it?',
  story: 'What did this section teach you about how brands communicate their origin? How does a good story build trust?',
  values: 'Why do you think naming values explicitly matters for a brand? How did the fellow\'s lived values compare to what they said?',
  personality: 'What surprised you about translating a person\'s personality into a brand personality? What was hardest to capture?',
}

export function ReflectionPrompt({ sectionId, value, onChange }: {
  sectionId: string
  value: string
  onChange: (text: string) => void
}) {
  const prompt = REFLECTION_PROMPTS[sectionId] ?? 'What did you learn from working on this section?'

  return (
    <div className="bg-brand-bg-warm rounded-2xl border border-brand-border p-6">
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
