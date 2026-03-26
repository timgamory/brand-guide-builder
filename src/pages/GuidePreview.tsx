import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { useReflectionStore } from '../stores/reflectionStore'
import { SECTIONS } from '../data/sections'
import { downloadMarkdown, downloadDocx, downloadReflectionMarkdown } from '../services/documentGenerator'
import { checkConsistency, type ConsistencyResult } from '../services/consistencyCheck'

const SECTION_TITLES: Record<string, string> = {
  basics: 'Introduction',
  story: 'Brand Story',
  values: 'Brand Values',
  personality: 'Brand Personality',
  visuals_colors: 'Color Palette',
  visuals_logo: 'Logo & Name',
  typography: 'Typography',
  messaging: 'Key Messages',
  application: 'Brand in Use',
  social_media: 'Social Media Guidelines',
  photography: 'Photography & Imagery',
}

export function GuidePreview() {
  const navigate = useNavigate()
  const session = useBrandGuideStore(s => s.session)
  const [reviewUrl, setReviewUrl] = useState<string | null>(
    session?.reviewToken ? `${window.location.origin}/review/${session.reviewToken}` : null
  )
  const [consistencyResult, setConsistencyResult] = useState<ConsistencyResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const handleCheckConsistency = async () => {
    if (!session) return
    setIsChecking(true)
    try {
      const result = await checkConsistency(session)
      setConsistencyResult(result)
    } catch {
      // Silently fail
    }
    setIsChecking(false)
  }

  if (!session) {
    navigate('/')
    return null
  }

  const handleSubmitForReview = async () => {
    const token = await useBrandGuideStore.getState().submitForReview()
    if (token) {
      setReviewUrl(`${window.location.origin}/review/${token}`)
    }
  }

  const handleDownloadReflections = async () => {
    if (!session) return
    await useReflectionStore.getState().loadReflections(session.id)
    const entries = Object.entries(useReflectionStore.getState().entries).map(([sectionId, text]) => ({
      sectionId,
      text,
      timestamp: new Date().toISOString(),
    }))
    downloadReflectionMarkdown(session, entries)
  }

  const approvedSections = SECTIONS.filter(s => {
    const state = session.sections[s.id]
    return state?.status === 'approved' && state.approvedDraft
  })

  return (
    <div className="min-h-screen bg-brand-bg font-body">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-heading text-2xl font-semibold text-brand-text">
            {session.brandData.orgName || 'Your'} Brand Guide
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/wizard/${session.currentSection}`)}
              className="px-5 py-2.5 rounded-xl border border-brand-border-dark bg-white text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors"
            >
              Back to Wizard
            </button>
            {approvedSections.length >= 3 && (
              <button
                onClick={handleCheckConsistency}
                disabled={isChecking}
                className="px-5 py-2.5 rounded-xl border border-brand-border-dark bg-white text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors disabled:opacity-50"
              >
                {isChecking ? 'Checking...' : 'Check Consistency'}
              </button>
            )}
            <button
              onClick={() => downloadMarkdown(session)}
              className="px-5 py-2.5 rounded-xl border border-brand-border-dark bg-white text-brand-text text-sm font-medium hover:bg-brand-bg transition-colors"
            >
              Download .md
            </button>
            <button
              onClick={() => downloadDocx(session)}
              className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-text-secondary transition-colors"
            >
              Download .docx
            </button>
          </div>
        </div>

        {session.path === 'intern' && (
          <div className="space-y-4 mt-6 pt-6 border-t border-brand-border">
            <h3 className="font-heading text-lg font-semibold text-brand-text">Intern Tools</h3>

            <button
              onClick={handleDownloadReflections}
              className="px-5 py-2.5 rounded-xl border border-brand-border-dark bg-white text-brand-text font-medium text-sm hover:bg-brand-bg transition-colors"
            >
              Download Reflections
            </button>

            {!reviewUrl ? (
              <button
                onClick={handleSubmitForReview}
                className="px-5 py-2.5 rounded-xl bg-brand-accent-coral text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Submit for Fellow Review
              </button>
            ) : (
              <div className="bg-brand-bg-warm rounded-xl p-4">
                <p className="text-sm text-brand-text-muted mb-2">Share this link with the fellow:</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={reviewUrl}
                    className="flex-1 px-3 py-2 rounded-lg border border-brand-border bg-white text-sm font-mono text-brand-text"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(reviewUrl)}
                    className="px-3 py-2 rounded-lg bg-brand-primary text-white text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {consistencyResult && (
          <div className={`rounded-2xl border p-6 mb-6 ${
            consistencyResult.verdict === 'consistent'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-lg font-semibold text-brand-text">
                {consistencyResult.verdict === 'consistent' ? 'Looking Good' : 'Consistency Notes'}
              </h3>
              <button
                onClick={() => setConsistencyResult(null)}
                className="text-brand-text-faint hover:text-brand-text text-sm"
              >
                Dismiss
              </button>
            </div>
            {consistencyResult.verdict === 'consistent' ? (
              <p className="text-[15px] text-brand-text-secondary">Your brand guide is internally consistent across all sections.</p>
            ) : (
              <ul className="space-y-2">
                {consistencyResult.issues.map((issue, i) => (
                  <li key={i} className="text-[15px] text-brand-text-secondary">
                    <span className="font-medium">{issue.sections.join(' / ')}:</span> {issue.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-10 space-y-10">
          {approvedSections.length === 0 ? (
            <p className="text-brand-text-muted text-center py-12">No sections completed yet. Complete sections in the wizard to see your brand guide here.</p>
          ) : (
            approvedSections.map(section => {
              const state = session.sections[section.id]
              const title = SECTION_TITLES[section.id] || section.title
              return (
                <div key={section.id}>
                  <h2 className="font-heading text-xl font-semibold text-brand-text mb-3 pb-2 border-b border-brand-border">{title}</h2>
                  <div className="text-[15px] leading-relaxed text-brand-text-secondary whitespace-pre-wrap">
                    {state.approvedDraft}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
