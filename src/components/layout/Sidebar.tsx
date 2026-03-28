import { useNavigate, useParams } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useBrandGuideStore } from '../../stores/brandGuideStore'
import { useAuth } from '../../hooks/useAuth'
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
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { sectionId } = useParams()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

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
                ? 'bg-white border-brand-primary font-semibold text-brand-text'
                : 'border-transparent text-brand-text-muted hover:text-brand-text hover:bg-white/50'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <StatusIcon status={status} />
              {section.title}
              {section.optional && (
                <span className="text-micro text-brand-text-faint font-normal uppercase tracking-wider">opt</span>
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

      {user && (
        <div className="mt-auto pt-4 px-5 border-t border-brand-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-brand-text-muted hover:text-brand-text text-sm transition-colors py-2"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
