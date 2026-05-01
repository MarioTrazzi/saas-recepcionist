import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export default function GoogleCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setToken } = useAuthStore()

  useEffect(() => {
    const token = params.get('token')
    const isNew = params.get('isNew') === 'true'

    if (token) {
      setToken(token)
      navigate(isNew ? '/wizard' : '/app/dashboard', { replace: true })
    } else {
      navigate('/login?error=google_auth_failed', { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Autenticando com Google…</p>
      </div>
    </div>
  )
}
