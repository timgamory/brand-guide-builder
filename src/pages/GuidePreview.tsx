import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { SECTIONS } from '../data/sections'
import { downloadMarkdown, downloadDocx } from '../services/documentGenerator'

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

  if (!session) {
    navigate('/')
    return null
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
