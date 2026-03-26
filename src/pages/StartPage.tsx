import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { setUserSlug } from '../services/userSlug'

export function StartPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (slug) {
      setUserSlug(slug)
    }
    navigate('/', { replace: true })
  }, [slug, navigate])

  return null
}
