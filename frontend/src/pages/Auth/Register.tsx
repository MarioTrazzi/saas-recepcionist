import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

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

export default function RegisterPage() {
  const [form, setForm] = useState({ tenantName: '', ownerName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/wizard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar conta grátis</h1>
          <p className="text-gray-400 text-sm mt-1">14 dias grátis, sem cartão</p>
        </div>

        {/* Google signup — fastest path */}
        <a
          href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
          className="flex items-center justify-center gap-3 w-full border border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-200 bg-gray-900 hover:bg-gray-800 hover:border-gray-600 transition-colors mb-4"
        >
          <GoogleIcon />
          Criar conta com Google
        </a>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">ou preencha o formulário</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="text-sm text-gray-300 block mb-1.5">Nome do negócio</label>
            <input className="input" value={form.tenantName} onChange={set('tenantName')} required placeholder="Ex: Clínica Saúde & Vida" />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-1.5">Seu nome</label>
            <input className="input" value={form.ownerName} onChange={set('ownerName')} required placeholder="Seu nome completo" />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-1.5">Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} required placeholder="seu@email.com" />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-1.5">Senha</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} required placeholder="Mínimo 8 caracteres" minLength={8} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Criando conta...' : 'Criar conta e configurar agente'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
