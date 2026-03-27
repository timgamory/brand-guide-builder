import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { SECTIONS } from '../data/sections'

const SECTION_TITLES: Record<string, string> = {
  basics: 'Introduction', story: 'Brand Story', values: 'Brand Values',
  personality: 'Brand Personality', visuals_colors: 'Color Palette',
  visuals_logo: 'Logo & Name', typography: 'Typography',
  messaging: 'Key Messages', application: 'Brand in Use',
  social_media: 'Social Media Guidelines', photography: 'Photography & Imagery',
}

export function PresentationView() {
  const navigate = useNavigate()
  const session = useBrandGuideStore(s => s.session)
  const [currentIndex, setCurrentIndex] = useState(0)

  const approvedSections = SECTIONS.filter(s => {
    const state = session?.sections[s.id]
    return state?.status === 'approved' && state.approvedDraft
  })

  const handlePrev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex(i => Math.min(approvedSections.length - 1, i + 1))
  }, [approvedSections.length])

  const handleExit = useCallback(() => {
    navigate('/preview')
  }, [navigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      else if (e.key === 'ArrowRight') handleNext()
      else if (e.key === 'Escape') handleExit()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext, handleExit])

  if (!session || approvedSections.length === 0) {
    navigate('/preview')
    return null
  }

  const currentSection = approvedSections[currentIndex]
  const draft = session.sections[currentSection.id]?.approvedDraft ?? ''
  const title = SECTION_TITLES[currentSection.id] || currentSection.title

  return (
    <div className="fixed inset-0 bg-brand-primary flex flex-col items-center justify-center p-4 md:p-8 font-body z-50">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        Section {currentIndex + 1} of {approvedSections.length}
      </div>
      <div className="absolute top-6 right-8">
        <button onClick={handleExit} className="text-white/40 text-sm hover:text-white/70 transition-colors">
          Press Esc to exit
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-xl max-w-full md:max-w-2xl w-full max-h-[70vh] overflow-y-auto p-6 md:p-10">
        <h2 className="font-heading text-2xl font-bold text-brand-text mb-4 pb-3 border-b border-brand-border">
          {title}
        </h2>
        <div className="text-[15px] leading-relaxed text-brand-text-secondary whitespace-pre-wrap">
          {draft}
        </div>
      </div>
      <div className="flex items-center gap-6 mt-8">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-6 py-3 rounded-xl text-white font-medium text-[15px] border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === approvedSections.length - 1}
          className="px-6 py-3 rounded-xl text-white font-medium text-[15px] border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
