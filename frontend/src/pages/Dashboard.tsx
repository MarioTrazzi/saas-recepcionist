import { useQuery } from '@tanstack/react-query'
import { Phone, MessageSquare, TrendingUp, Clock, Zap, AlertTriangle, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardApi, agentApi } from '@/lib/api'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get, refetchInterval: 30_000 })
  const { data: agentConfig } = useQuery({ queryKey: ['agent-config'], queryFn: agentApi.getConfig, retry: false })

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-8" />
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      </div>
    )
  }

  const { tenant, conversations } = data || {}
  const agentReady = !!agentConfig?.agentName

  // Build specific pending items — only after agent is checked
  type PendingItem = { key: string; icon: any; label: string; sub: string; to: string; cta: string }
  const pending: PendingItem[] = []
  if (!agentReady) {
    pending.push({
      key: 'wizard',
      icon: Zap,
      label: 'Configure seu agente',
      sub: 'Complete o assistente de configuração para ativar o atendimento',
      to: '/wizard',
      cta: 'Abrir wizard',
    })
  } else {
    if (!tenant?.phoneEnabled) {
      pending.push({
        key: 'phone',
        icon: Phone,
        label: 'Provisionar número de telefone',
        sub: 'Crie um número brasileiro dedicado para receber ligações',
        to: '/app/settings',
        cta: 'Ir para Configurações',
      })
    }
    if (!tenant?.whatsappEnabled) {
      pending.push({
        key: 'whatsapp',
        icon: MessageSquare,
        label: 'Conectar WhatsApp',
        sub: 'Escaneie o QR code para ativar o canal de mensagens',
        to: '/app/settings',
        cta: 'Ir para Configurações',
      })
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">{tenant?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            tenant?.status === 'active' ? 'bg-green-500/20 text-green-400' :
            tenant?.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {tenant?.status === 'trial' ? 'Trial' : tenant?.status === 'active' ? 'Ativo' : 'Suspenso'}
          </span>
          <span className="text-xs text-gray-500 capitalize">{tenant?.plan}</span>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card border-yellow-500/25 bg-yellow-500/5 mb-6 overflow-hidden">
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-yellow-500/15">
            <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
            <p className="text-sm font-medium text-yellow-300">
              {pending.length === 1 ? '1 pendência para ativar o atendimento' : `${pending.length} pendências para ativar o atendimento`}
            </p>
          </div>
          <div className="divide-y divide-gray-800/60">
            {pending.map(item => (
              <div key={item.key} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                </div>
                <Link
                  to={item.to}
                  className="flex items-center gap-1 text-xs font-medium text-yellow-400 hover:text-yellow-300 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {item.cta} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {tenant?.whatsappError && (
        <div className="card border-red-500/25 bg-red-500/5 mb-6 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-300">WhatsApp com problema</p>
              <p className="text-xs text-gray-400 mt-0.5">{tenant.whatsappError}</p>
            </div>
            <Link
              to="/app/settings"
              className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Verificar <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={MessageSquare} label="Total de conversas" value={conversations?.total ?? 0} color="primary" />
        <StatCard icon={TrendingUp} label="Hoje" value={conversations?.today ?? 0} color="accent" />
        <StatCard icon={Phone} label="Minutos usados" value={`${tenant?.minutesUsed ?? 0}/${tenant?.minutesLimit ?? 0}`} color="blue" />
        <StatCard icon={Clock} label="Uso do plano" value={`${tenant?.usagePercent ?? 0}%`} color={tenant?.usagePercent > 80 ? 'red' : 'green'} />
      </div>

      {/* Channels status */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> Canal de Telefone
            </h2>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${tenant?.phoneEnabled ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`h-2 w-2 rounded-full ${tenant?.phoneEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              {tenant?.phoneEnabled ? 'Ativo' : 'Inativo'}
            </div>
          </div>
          {tenant?.phoneEnabled && tenant?.phoneNumber ? (
            <>
              <p className="text-lg font-mono font-semibold text-white tracking-wide">
                {formatPhone(tenant.phoneNumber)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Recebendo ligações e respondendo com voz natural</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400">Provisione um número brasileiro dedicado para seu agente atender ligações.</p>
              <Link to="/app/settings" className="text-xs text-primary hover:underline mt-2 block">Provisionar número →</Link>
            </>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-400" /> WhatsApp
            </h2>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${tenant?.whatsappEnabled ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`h-2 w-2 rounded-full ${tenant?.whatsappEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              {tenant?.whatsappEnabled ? 'Conectado' : 'Inativo'}
            </div>
          </div>
          {tenant?.whatsappEnabled && tenant?.whatsappPhone ? (
            <>
              <p className="text-lg font-mono font-semibold text-white tracking-wide">
                {formatPhone(tenant.whatsappPhone)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Respondendo mensagens automaticamente</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400">Conecte seu WhatsApp para atender por mensagens.</p>
              <Link to="/app/settings" className="text-xs text-primary hover:underline mt-2 block">Conectar →</Link>
            </>
          )}
        </div>
      </div>

      {/* Conversations by channel */}
      {conversations?.byChannel?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4">Conversas por canal</h2>
          <div className="space-y-3">
            {conversations.byChannel.map((item: any) => (
              <div key={item.channel} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-gray-800 flex items-center justify-center">
                  {item.channel === 'phone' ? <Phone className="h-3.5 w-3.5 text-primary" /> : <MessageSquare className="h-3.5 w-3.5 text-green-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300 capitalize">{item.channel === 'phone' ? 'Telefone' : 'WhatsApp'}</span>
                    <span className="text-white font-medium">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.channel === 'phone' ? 'bg-primary' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, (item.count / (conversations.total || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatPhone(raw: string): string {
  // +5511999999999 → +55 (11) 99999-9999
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length === 13) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.startsWith('1') && digits.length === 11) {
    // US number e.g. +16592004612
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return raw
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    accent: 'text-accent bg-accent/10',
    blue: 'text-blue-400 bg-blue-400/10',
    green: 'text-green-400 bg-green-400/10',
    red: 'text-red-400 bg-red-400/10',
  }
  return (
    <div className="card p-4">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
