import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Phone, MessageSquare, TrendingUp, Clock, Zap, AlertTriangle, ChevronRight, UserPlus, Flame, Lightbulb, Sparkles, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardApi, agentApi } from '@/lib/api'
import { getTipsForCategory, CATEGORY_LABELS, type AgentTip } from '@/lib/dashboard-tips'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get, refetchInterval: 30_000 })
  const { data: agentConfig } = useQuery({ queryKey: ['agent-config'], queryFn: agentApi.getConfig, retry: false })

  const [generatingTips, setGeneratingTips] = useState(false)
  const [generatedTips, setGeneratedTips] = useState<string[]>([])

  const templateCategory: string = agentConfig?.templateCategory || 'custom'
  const staticTips: AgentTip[] = getTipsForCategory(templateCategory)
  const isCustom = templateCategory === 'custom' || staticTips.length === 0

  const handleGenerateTips = async () => {
    if (!agentConfig?.systemPrompt) return
    setGeneratingTips(true)
    try {
      const { tips } = await agentApi.generateTips(agentConfig.systemPrompt, agentConfig.agentName || '')
      setGeneratedTips(tips)
    } catch {
      setGeneratedTips([])
    } finally {
      setGeneratingTips(false)
    }
  }

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
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {tenant.whatsappError.includes('131042') ? 'Créditos da Meta esgotados' : 
                   tenant.whatsappError.includes('190') ? 'Problema de Autenticação na Meta' : 
                   'WhatsApp com problema'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  {tenant.whatsappError.includes('131042') 
                    ? `A Meta não conseguiu cobrar seu cartão. ${tenant.whatsappEnabled ? 'O sistema está operando via Evolution API (Fallback).' : 'O atendimento automático parou.'}`
                    : tenant.whatsappError.includes('190')
                    ? 'O token de acesso da Meta expirou ou foi invalidado. Isso pode ocorrer por falta de pagamento ou alteração de senha.'
                    : tenant.whatsappError}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {tenant.whatsappError.includes('131042') && (
                <a 
                  href="https://business.facebook.com/settings/whatsapp-business-accounts/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-md transition-colors"
                >
                  Resolver na Meta
                </a>
              )}
              <Link
                to="/app/settings"
                className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors whitespace-nowrap"
              >
                Configurações <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Critical Alerts (Legacy/Specific - already covered above) */}

      {/* Unanswered messages due to WhatsApp credit exhaustion */}
      {tenant?.unansweredMessages?.length > 0 && (
        <div className="card border-orange-500/25 bg-orange-500/5 mb-6 overflow-hidden">
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-orange-500/15">
            <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
            <p className="text-sm font-medium text-orange-300">
              {tenant.unansweredMessages.length === 1
                ? '1 mensagem não respondida por falta de créditos'
                : `${tenant.unansweredMessages.length} mensagens não respondidas por falta de créditos`}
            </p>
          </div>
          <div className="divide-y divide-gray-800/60">
            {tenant.unansweredMessages.slice(0, 5).map((msg: any, i: number) => (
              <Link
                key={i}
                to={`/app/conversations?phone=${msg.phone}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-orange-500/5 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200">
                    Mensagem não respondida de: {formatPhone(msg.phone)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{msg.message}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">
                    {new Date(msg.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-orange-400 mt-0.5">Ver conversa</p>
                </div>
              </Link>
            ))}
            {tenant.unansweredMessages.length > 5 && (
              <div className="px-5 py-3 text-center">
                <Link to="/app/conversations" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                  Ver todas as {tenant.unansweredMessages.length} mensagens →
                </Link>
              </div>
            )}
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

      {/* Agent tips */}
      {agentReady && (
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              Como aprimorar seu agente
            </h2>
            <span className="text-xs text-gray-500">
              {CATEGORY_LABELS[templateCategory] ?? 'Agente'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Adicione essas informações à base de conhecimento para que seu agente responda com mais precisão.
          </p>

          {/* Static tips grid */}
          {!isCustom && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staticTips.map((tip, i) => (
                <TipCard key={i} tip={tip} />
              ))}
            </div>
          )}

          {/* Custom template — AI-generated tips */}
          {isCustom && (
            <div className="space-y-3">
              {generatedTips.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-700 p-5 text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Dicas personalizadas para o seu agente</p>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Com base nas instruções do seu agente, nossa IA gera sugestões específicas para o seu negócio.
                  </p>
                  <button
                    onClick={handleGenerateTips}
                    disabled={generatingTips || !agentConfig?.systemPrompt}
                    className="btn-primary text-sm flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {generatingTips
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando dicas…</>
                      : <><Sparkles className="h-4 w-4" /> Gerar dicas personalizadas</>
                    }
                  </button>
                  {!agentConfig?.systemPrompt && (
                    <p className="text-xs text-gray-600 mt-2">Configure as instruções do agente em Configurações para gerar dicas.</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {generatedTips.map((tip, i) => (
                      <div key={i} className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0 mt-0.5">✨</span>
                          <p className="text-xs text-gray-300 leading-relaxed">{tip}</p>
                        </div>
                        <Link
                          to="/app/knowledge"
                          className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Adicionar à base <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateTips}
                    disabled={generatingTips}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" /> Gerar novas dicas
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Leads widget */}
      <div className="card p-5 mb-8 border-orange-500/20">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-orange-400" />
            Leads capturados
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Em breve
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Cada atendimento em que o agente coletou dados de contato aparecerá aqui como lead qualificado, com histórico completo da conversa.
        </p>

        {/* Sample leads preview */}
        <div className="space-y-2 opacity-40 pointer-events-none select-none mb-4">
          {[
            { initials: 'FO', name: 'Fernanda Oliveira', intent: 'Apartamento 2q · R$400k', channel: 'WhatsApp', tag: 'quente', time: '08:42' },
            { initials: 'RS', name: 'Ricardo Santos',   intent: 'Reforma hidráulica urgente', channel: 'Telefone', tag: 'novo',    time: '09:15' },
            { initials: 'AM', name: 'Ana Paula M.',     intent: 'Matrícula curso de inglês',  channel: 'WhatsApp', tag: 'novo',    time: '10:03' },
          ].map((lead, i) => {
            const tagStyle =
              lead.tag === 'quente'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-primary/20 text-primary'
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {lead.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{lead.name}</p>
                  <p className="text-xs text-gray-500 truncate">{lead.channel} · {lead.intent}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${tagStyle}`}>
                    {lead.tag === 'quente' ? '🔥 Quente' : 'Novo'}
                  </span>
                  <span className="text-[10px] text-gray-600">{lead.time}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Hot lead alert preview */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg px-4 py-3 flex items-start gap-3">
          <Flame className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-orange-400 mb-0.5">Como funciona o alerta de lead quente</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Quando o agente detectar alta intenção de compra, você receberá uma notificação imediata no WhatsApp com nome, contato e o que o cliente quer — antes que ele vá para o concorrente.
            </p>
          </div>
        </div>
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

function TipCard({ tip }: { tip: AgentTip }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4 flex flex-col">
      <div className="flex items-start gap-2 flex-1">
        <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
        <div>
          <p className="text-xs font-semibold text-gray-200 mb-1">{tip.title}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{tip.description}</p>
        </div>
      </div>
      <Link
        to="/app/knowledge"
        className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Adicionar à base <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  )
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
