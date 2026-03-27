import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase JS SDK automatically picks up the token from the URL hash
    // and exchanges it for a session. We just need to wait for that to complete.
    supabase.auth.getSession().then(() => {
      navigate('/', { replace: true })
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-brand-bg font-body flex items-center justify-center">
      <p className="text-brand-text-secondary">Signing you in...</p>
    </div>
  )
}
