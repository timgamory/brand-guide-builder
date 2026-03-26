import { useState } from 'react'
import type { SectionReviewResponse } from '../../types'

export function SectionReview({ review, onApprove, onRevise, onStartOver }: {
  review: SectionReviewResponse
  onApprove: (draft: string) => void
  onRevise: (direction: string) => void
  onStartOver: () => void
}) {
  const [editedDraft, setEditedDraft] = useState(review.draft)
  const [reviseInput, setReviseInput] = useState('')
  const [showRevise, setShowRevise] = useState(false)

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* Draft */}
      <div className="bg-white rounded-2xl border border-brand-border p-6">
        <h3 className="font-heading text-lg font-semibold text-brand-text mb-3">Draft</h3>
        <textarea
          value={editedDraft}
          onChange={e => setEditedDraft(e.target.value)}
          className="w-full min-h-[200px] text-[15px] leading-relaxed text-brand-text-secondary bg-brand-bg rounded-xl p-4 border border-brand-border outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all resize-y font-body"
        />
      </div>

      {/* Suggestions */}
      {review.suggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-border p-6">
          <h3 className="font-heading text-lg font-semibold text-brand-text mb-3">Suggestions</h3>
          <ul className="space-y-2">
            {review.suggestions.map((s, i) => (
              <li key={i} className="text-[15px] text-brand-text-secondary leading-relaxed flex items-start gap-2">
                <span className="text-brand-accent-coral mt-0.5 shrink-0">&#9679;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternatives */}
      {review.alternatives.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-border p-6">
          <h3 className="font-heading text-lg font-semibold text-brand-text mb-3">Creative Alternatives</h3>
          <div className="space-y-3">
            {review.alternatives.map((a, i) => (
              <div key={i} className="bg-brand-bg rounded-xl p-4">
                <p className="text-[15px] font-medium text-brand-text">{a.option}</p>
                <p className="text-sm text-brand-text-muted mt-1">{a.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Moment */}
      {review.teachingMoment && (
        <div className="bg-brand-bg-warm rounded-2xl border border-brand-border p-6">
          <h3 className="font-heading text-lg font-semibold text-brand-text mb-2">Why This Matters</h3>
          <p className="text-[15px] text-brand-text-secondary leading-relaxed">{review.teachingMoment}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => onApprove(editedDraft)}
          className="px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold text-[15px] hover:bg-brand-text-secondary transition-colors"
        >
          Approve &amp; Continue
        </button>
        {showRevise ? (
          <div className="flex-1 flex gap-2 min-w-[240px]">
            <input
              value={reviseInput}
              onChange={e => setReviseInput(e.target.value)}
              placeholder="What should change?"
              className="flex-1 px-4 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text text-sm outline-none focus:border-brand-primary font-body"
              onKeyDown={e => {
                if (e.key === 'Enter' && reviseInput.trim()) {
                  onRevise(reviseInput.trim())
                  setReviseInput('')
                  setShowRevise(false)
                }
              }}
            />
            <button
              onClick={() => { if (reviseInput.trim()) { onRevise(reviseInput.trim()); setReviseInput(''); setShowRevise(false) } }}
              className="px-4 py-3 rounded-xl bg-brand-bg border border-brand-border-dark text-brand-text text-sm font-medium hover:bg-white transition-colors"
            >
              Send
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRevise(true)}
            className="px-6 py-3 rounded-xl border border-brand-border-dark bg-white text-brand-text font-medium text-[15px] hover:bg-brand-bg transition-colors"
          >
            Ask AI to Revise
          </button>
        )}
        <button
          onClick={onStartOver}
          className="px-6 py-3 rounded-xl text-brand-text-muted text-[15px] hover:text-brand-text transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}
