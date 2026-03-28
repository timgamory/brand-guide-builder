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

  const pathLabel = session?.path === 'intern'
    ? `Building for ${session.internMeta?.fellowName ?? 'Fellow'}`
    : 'Your Brand'

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
          {session && (
            <p className="text-brand-text-faint text-sm mt-0.5">{pathLabel}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {session?.brandData.orgName && (
          <span className="hidden sm:inline font-heading text-brand-accent-gold text-body font-medium">
            {session.brandData.orgName}
          </span>
        )}
        {user && (
          <button
            onClick={handleSignOut}
            className="text-white/60 hover:text-white transition-colors p-1.5"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  )
}
