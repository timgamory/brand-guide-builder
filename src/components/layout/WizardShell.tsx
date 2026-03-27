import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useBrandGuideStore } from '../../stores/brandGuideStore'
import { cn } from '../../lib/utils'

export function WizardShell() {
  const session = useBrandGuideStore(s => s.session)
  const isLoading = useBrandGuideStore(s => s.isLoading)
  const loadMostRecentSession = useBrandGuideStore(s => s.loadMostRecentSession)
  const navigate = useNavigate()
  const location = useLocation()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    loadMostRecentSession()
  }, [loadMostRecentSession])

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/')
    }
  }, [isLoading, session, navigate])

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false)
  }, [location.pathname])

  if (isLoading || !session) return null

  return (
    <div className="h-dvh bg-brand-bg font-body flex flex-col overflow-hidden">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile drawer */}
        <div
          className={cn(
            'fixed inset-0 z-40 md:hidden transition-all duration-200',
            isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-black/40 transition-opacity duration-200',
              isDrawerOpen ? 'opacity-100' : 'opacity-0'
            )}
            onClick={() => setIsDrawerOpen(false)}
          />
          <nav
            className={cn(
              'absolute inset-y-0 left-0 w-[260px] bg-brand-bg-warm border-r border-brand-border shadow-xl',
              'transition-transform duration-200 ease-out overflow-y-auto py-6',
              isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <Sidebar onNavigate={() => setIsDrawerOpen(false)} />
          </nav>
        </div>

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
