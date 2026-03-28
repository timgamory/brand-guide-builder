export function ConversationLauncher({ sectionTitle, onVoiceStart, onChooseText }: {
  sectionTitle: string
  onVoiceStart: () => void
  onChooseText: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="text-sm text-brand-text-muted mb-6">
        Let&rsquo;s talk about {sectionTitle.toLowerCase()}
      </p>

      <button
        onClick={onVoiceStart}
        className="w-20 h-20 rounded-full bg-brand-accent-coral text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center animate-pulse-shadow"
        aria-label="Start voice conversation"
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
        </svg>
      </button>

      <p className="text-body font-medium text-brand-text mt-4">Tap to talk</p>

      <div className="flex items-center gap-4 my-6 w-full max-w-[200px]">
        <div className="flex-1 border-t border-brand-border" />
        <span className="text-sm text-brand-text-faint">or</span>
        <div className="flex-1 border-t border-brand-border" />
      </div>

      <button
        onClick={onChooseText}
        className="text-sm text-brand-text-muted hover:text-brand-text underline transition-colors"
      >
        Type instead
      </button>
    </div>
  )
}
