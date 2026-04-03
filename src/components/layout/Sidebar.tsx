import { useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useBrandGuideStore } from '../../stores/brandGuideStore'
import { SECTIONS } from '../../data/sections'
import { cn } from '../../lib/utils'
import type { SectionStatus } from '../../types'

function StatusIcon({ status }: { status: SectionStatus }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-accent-sage text-white shrink-0" aria-label="completed">
        <Check size={12} strokeWidth={3} />
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-brand-accent-coral shrink-0" aria-label="in progress">
        <span className="w-2 h-2 rounded-full bg-brand-accent-coral" />
      </span>
    )
  }
  if (status === 'skipped') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-brand-text-faint text-brand-text-faint text-xs shrink-0" aria-label="skipped">
        &mdash;
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-brand-text-faint shrink-0" aria-label="not started" />
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const session = useBrandGuideStore(s => s.session)
  const navigateToSection = useBrandGuideStore(s => s.navigateToSection)
  const navigate = useNavigate()
  const { sectionId } = useParams()

  const currentSectionId = sectionId ?? session?.currentSection ?? 'basics'

  const handleClick = async (id: string) => {
    await navigateToSection(id)
    navigate(`/wizard/${id}`)
    onNavigate?.()
  }

  return (
    <nav className="w-[260px] md:w-[220px] shrink-0 bg-brand-bg-warm border-r border-brand-border py-6 overflow-y-auto flex flex-col h-full">
      {SECTIONS.map((section) => {
        const isActive = section.id === currentSectionId
        const sectionState = session?.sections[section.id]
        const status = sectionState?.status ?? 'not_started'

        return (
          <button
            key={section.id}
            onClick={() => handleClick(section.id)}
            className={cn(
              'block w-full text-left px-5 py-3 md:py-2.5 min-h-[44px] md:min-h-0 border-l-[3px] transition-all font-body text-sm md:text-body-sm cursor-pointer',
              isActive
                ? 'bg-white border-brand-accent-coral font-semibold text-brand-text'
                : 'border-transparent text-brand-text-muted hover:text-brand-text hover:bg-white/50'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <StatusIcon status={status} />
              {section.title}
              {section.optional && (
                <span className="text-fine text-brand-text-faint font-normal">(optional)</span>
              )}
            </span>
          </button>
        )
      })}

      {session?.path === 'intern' && session.internMeta?.fellowName && (
        <p className="px-5 mt-4 text-fine text-brand-text-faint">
          Building for {session.internMeta.fellowName}
        </p>
      )}

      <div className="mt-auto pt-4 px-5 border-t border-brand-border">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-brand-text-muted hover:text-brand-text text-sm transition-colors py-2"
        >
          &larr; Save &amp; Exit
        </button>
      </div>
    </nav>
  )
}
