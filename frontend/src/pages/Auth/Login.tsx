import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Phone, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api'
import { loadFacebookSDK, facebookLogin } from '@/lib/facebook'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function MetaIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="white" fillOpacity="0.2"/>
      <path d="M13.25 15.5h-2.5v-5.25H9.5V8.5h1.25V7.75C10.75 6.23 11.61 5.5 13 5.5c.62 0 1.25.06 1.25.06v1.44h-.7c-.69 0-.8.33-.8.81V8.5h1.44l-.19 1.75H12.75V15.5z" fill="white"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [metaLoading, setMetaLoading] = useState(false)
  const { login, setToken } = useAuthStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const googleError = params.get('error') === 'google_auth_failed'

  // Preload SDK on mount so FB.login() can be called synchronously on click (mobile popup fix)
  useEffect(() => { loadFacebookSDK().catch(() => {}) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/app/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  const handleMetaLogin = async () => {
    setError('')
    setMetaLoading(true)
    try {
      const result = await facebookLogin()
      if (!result) return // user cancelled popup
      const { token, isNew } = await authApi.metaCallback(result.accessToken)
      setToken(token)
      navigate(isNew ? '/wizard' : '/app/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Falha ao autenticar com Meta. Tente novamente.')
    } finally {
      setMetaLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Entrar</h1>
          <p className="text-gray-400 text-sm mt-1">Acesse seu painel</p>
        </div>

        {/* Meta login */}
        <button
          type="button"
          onClick={handleMetaLogin}
          disabled={metaLoading}
          className="flex items-center justify-center gap-3 w-full border border-blue-500/60 rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166FE5] transition-colors mb-4 disabled:opacity-70"
        >
          {metaLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MetaIcon />}
          Entrar com Meta
        </button>

        {/* Google login */}
        <a
          href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
          className="flex items-center justify-center gap-3 w-full border border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-200 bg-gray-900 hover:bg-gray-800 hover:border-gray-600 transition-colors mb-4"
        >
          <GoogleIcon />
          Entrar com Google
        </a>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">ou</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {(error || googleError) && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {googleError ? 'Falha ao autenticar com Google. Tente novamente.' : error}
            </p>
          )}

          <div>
            <label className="text-sm text-gray-300 block mb-1.5">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-1.5">Senha</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          Não tem conta?{' '}
          <Link to="/register" className="text-primary hover:underline">Criar agora</Link>
        </p>
      </div>
    </div>
  )
}
