import { useNavigate, useParams } from 'react-router-dom'
import { useBrandGuideStore } from '../../stores/brandGuideStore'
import { SECTIONS } from '../../data/sections'
import { cn } from '../../lib/utils'
import type { SectionStatus } from '../../types'

function StatusIcon({ status }: { status: SectionStatus }) {
  if (status === 'approved') {
    return <span className="text-brand-accent-sage text-xs">&#10003;</span>
  }
  if (status === 'in_progress') {
    return <span className="text-brand-accent-coral text-xs">&#9679;</span>
  }
  if (status === 'skipped') {
    return <span className="text-brand-text-faint text-xs">&mdash;</span>
  }
  return <span className="text-brand-text-faint text-xs">&#9675;</span>
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
    <nav className="w-[260px] md:w-[220px] shrink-0 bg-brand-bg-warm border-r border-brand-border py-6 overflow-y-auto">
      {SECTIONS.map((section) => {
        const isActive = section.id === currentSectionId
        const sectionState = session?.sections[section.id]
        const status = sectionState?.status ?? 'not_started'

        return (
          <button
            key={section.id}
            onClick={() => handleClick(section.id)}
            className={cn(
              'block w-full text-left px-5 py-3 md:py-2.5 min-h-[44px] md:min-h-0 border-l-[3px] transition-all font-body text-sm md:text-[13px] cursor-pointer',
              isActive
                ? 'bg-white border-brand-primary font-semibold text-brand-text'
                : 'border-transparent text-brand-text-muted hover:text-brand-text hover:bg-white/50'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <StatusIcon status={status} />
              {section.title}
              {section.optional && (
                <span className="text-[9px] text-brand-text-faint font-normal uppercase tracking-wider">opt</span>
              )}
            </span>
          </button>
        )
      })}

      {session?.path === 'intern' && session.internMeta?.fellowName && (
        <p className="px-5 mt-4 text-[11px] text-brand-text-faint">
          Building for {session.internMeta.fellowName}
        </p>
      )}
    </nav>
  )
}
