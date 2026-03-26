import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useBrandGuideStore } from '../../stores/brandGuideStore'

export function WizardShell() {
  const session = useBrandGuideStore(s => s.session)
  const isLoading = useBrandGuideStore(s => s.isLoading)
  const loadMostRecentSession = useBrandGuideStore(s => s.loadMostRecentSession)
  const navigate = useNavigate()

  useEffect(() => {
    loadMostRecentSession()
  }, [loadMostRecentSession])

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/')
    }
  }, [isLoading, session, navigate])

  if (isLoading || !session) return null

  return (
    <div className="h-screen bg-brand-bg font-body flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
