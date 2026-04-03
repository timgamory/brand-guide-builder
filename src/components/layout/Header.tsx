import { useNavigate } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { useBrandGuideStore } from '../../stores/brandGuideStore'
import { useAuth } from '../../hooks/useAuth'

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const navigate = useNavigate()
  const session = useBrandGuideStore(s => s.session)
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const subtitle = session?.path === 'intern'
    ? `Building for ${session.internMeta?.fellowName ?? 'Fellow'}`
    : session?.brandData.orgName || null

  return (
    <header className="bg-brand-primary px-4 py-3.5 md:px-8 md:py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-white"
          aria-label="Open navigation"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1
            onClick={() => navigate('/')}
            className="font-heading text-xl font-semibold text-white cursor-pointer hover:text-white/80 transition-colors"
          >
            Brand Guide Builder
          </h1>
          {subtitle && (
            <p className="text-brand-accent-gold text-sm font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {user && (
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      )}
    </header>
  )
}
