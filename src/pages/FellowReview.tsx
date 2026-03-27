import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useReviewStore } from '../stores/reviewStore'
import { getSessionByReviewToken } from '../services/storage'
import { SECTIONS } from '../data/sections'
import { track } from '../services/analytics'
import type { ReviewStatus, Session } from '../types'

function ReviewSection({ title, draft, reviewStatus, notes, onAction }: {
  title: string
  draft: string
  reviewStatus: ReviewStatus
  notes?: string
  onAction: (status: ReviewStatus, notes?: string) => void
}) {
  const [changeNotes, setChangeNotes] = useState(notes ?? '')
  const [showNotes, setShowNotes] = useState(false)

  const statusBadge = {
    approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700' },
    changes_requested: { label: 'Changes Requested', color: 'bg-amber-50 text-amber-700' },
    flagged: { label: 'Flagged', color: 'bg-red-50 text-red-700' },
    not_reviewed: { label: 'Not Reviewed', color: 'bg-gray-50 text-gray-500' },
  }[reviewStatus]

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold text-brand-text">{title}</h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${statusBadge.color}`}>{statusBadge.label}</span>
      </div>
      <div className="text-[15px] text-brand-text-secondary leading-relaxed whitespace-pre-wrap mb-4">
        {draft}
      </div>
      {showNotes && (
        <div className="mb-4">
          <textarea
            value={changeNotes}
            onChange={e => setChangeNotes(e.target.value)}
            placeholder="What needs to change?"
            className="w-full min-h-[80px] text-sm p-3 rounded-xl border border-brand-border bg-brand-bg outline-none focus:border-brand-primary font-body"
          />
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onAction('approved')}
          className="px-4 py-2 rounded-lg bg-brand-accent-sage text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Approve
        </button>
        <button
          onClick={() => {
            if (showNotes && changeNotes.trim()) {
              onAction('changes_requested', changeNotes.trim())
              setShowNotes(false)
            } else {
              setShowNotes(true)
            }
          }}
          className="px-4 py-2 rounded-lg border border-brand-border-dark bg-white text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors"
        >
          {showNotes ? 'Submit Changes' : 'Request Changes'}
        </button>
        <button
          onClick={() => onAction('flagged')}
          className="px-4 py-2 rounded-lg text-brand-text-muted text-sm hover:text-brand-text transition-colors"
        >
          Flag for Discussion
        </button>
      </div>
    </div>
  )
}

export function FellowReview() {
  const { token } = useParams<{ token: string }>()
  const { sections: reviewSections, loadReview, setReviewStatus } = useReviewStore()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!token) return
    getSessionByReviewToken(token).then(found => {
      if (found) {
        setSession(found)
        loadReview(found.id)
      }
    })
  }, [token, loadReview])

  if (!session) {
    return (
      <div className="min-h-screen bg-brand-bg font-body flex items-center justify-center">
        <p className="text-brand-text-muted">Review not found. Check the link and try again.</p>
      </div>
    )
  }

  const orgName = session.brandData.orgName || 'Brand Guide'
  const approvedSections = SECTIONS.filter(s => session.sections[s.id]?.approvedDraft)
  const reviewedCount = Object.values(reviewSections).filter(s => s.status !== 'not_reviewed').length
  const approvedCount = Object.values(reviewSections).filter(s => s.status === 'approved').length

  return (
    <div className="min-h-screen bg-brand-bg font-body">
      <div className="bg-brand-primary text-white px-6 py-4">
        <h1 className="font-heading text-xl font-semibold">{orgName} — Brand Guide Review</h1>
        <p className="text-white/70 text-sm mt-1">
          {reviewedCount} of {approvedSections.length} reviewed · {approvedCount} approved
        </p>
      </div>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {approvedSections.map(section => {
          const draft = session.sections[section.id]?.approvedDraft
          if (!draft) return null
          const reviewState = reviewSections[section.id] ?? { status: 'not_reviewed' as const }
          return (
            <ReviewSection
              key={section.id}
              title={section.title}
              draft={draft}
              reviewStatus={reviewState.status}
              notes={reviewState.notes}
              onAction={(status, notes) => {
                setReviewStatus(section.id, status, notes)
                track('review.completed', { sectionId: section.id, status, hasNotes: !!notes }, session.id)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
