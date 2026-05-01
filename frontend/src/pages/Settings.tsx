import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Phone, MessageSquare, Bot, Save, Zap,
  Wifi, Loader2, AlertCircle, SmartphoneNfc, CheckCircle, ChevronDown,
} from 'lucide-react'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length === 13)
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  if (digits.startsWith('1') && digits.length === 11)
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  return raw
}
import { agentApi, phoneApi, whatsappApi, tenantApi } from '@/lib/api'

const QR_TTL = 60
type QrState = 'idle' | 'loading' | 'shown' | 'expired' | 'error'

export default function SettingsPage() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<any>({})

  // Phone state
  const [showPhoneSetup, setShowPhoneSetup] = useState(false)
  const [selectedSid, setSelectedSid] = useState('')
  const [assigningPhone, setAssigningPhone] = useState(false)
  const [assignError, setAssignError] = useState('')

  // WhatsApp QR flow state
  const [qrState, setQrState] = useState<QrState>('idle')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [waPhone, setWaPhone] = useState('')
  const [countdown, setCountdown] = useState(QR_TTL)
  const [qrError, setQrError] = useState('')
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: config, isLoading } = useQuery({ queryKey: ['agent-config'], queryFn: agentApi.getConfig })
  const { data: tenant, refetch: refetchTenant } = useQuery({ queryKey: ['tenant'], queryFn: tenantApi.getMe })
  const { data: twilioNumbers = [], isLoading: loadingNumbers } = useQuery({
    queryKey: ['twilio-numbers'],
    queryFn: phoneApi.listNumbers,
    enabled: showPhoneSetup || !tenant?.twilioPhoneNumber,
    staleTime: 60_000,
  })

  // Check WhatsApp connection status on mount
  const { data: waStatus, isLoading: checkingWa, refetch: recheckWa } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: whatsappApi.status,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })

  const isConnected = waStatus?.connected === true

  useEffect(() => {
    if (config) setForm(config)
  }, [config])

  const clearTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }))

  const saveMutation = useMutation({
    mutationFn: () => agentApi.upsertConfig(form),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      qc.invalidateQueries({ queryKey: ['agent-config'] })
    },
  })

  const assignPhone = async () => {
    if (!selectedSid) return
    setAssigningPhone(true)
    setAssignError('')
    try {
      await phoneApi.assign(selectedSid)
      await phoneApi.createElevenLabsAgent()
      await refetchTenant()
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowPhoneSetup(false)
    } catch (e: any) {
      setAssignError(e.response?.data?.message || 'Erro ao configurar o número.')
    } finally {
      setAssigningPhone(false)
    }
  }

  const startTimers = useCallback(() => {
    setCountdown(QR_TTL)

    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current!)
          setQrState('expired')
          if (pollRef.current) clearInterval(pollRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)

    pollRef.current = setInterval(async () => {
      try {
        const { connected } = await whatsappApi.status()
        if (connected) {
          clearTimers()
          setQrState('idle')
          setQrCode(null)
          qc.invalidateQueries({ queryKey: ['whatsapp-status'] })
          recheckWa()
        }
      } catch {
        // ignore silently
      }
    }, 3000)
  }, [clearTimers, qc, recheckWa])

  const generateQr = async () => {
    if (!waPhone) return
    clearTimers()
    setQrState('loading')
    setQrError('')
    try {
      const result = await whatsappApi.setup(waPhone)
      if (result.qrCode) {
        setQrCode(result.qrCode)
        setQrState('shown')
        startTimers()
      } else {
        // Already connected
        setQrState('idle')
        qc.invalidateQueries({ queryKey: ['whatsapp-status'] })
        recheckWa()
      }
    } catch (e: any) {
      setQrError(e.response?.data?.message || 'Não foi possível gerar o QR code.')
      setQrState('error')
    }
  }

  const phoneDigits = waPhone.replace(/\D/g, '').replace(/^55/, '')
  const phoneReady = phoneDigits.length >= 10

  if (isLoading) return <div className="p-8"><div className="card h-96 animate-pulse" /></div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Configurações</h1>

      <div className="max-w-2xl space-y-6">

        {/* Agent settings */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> Configurações do Agente
          </h2>

          <div>
            <label className="text-sm text-gray-300 block mb-1.5">Nome do agente</label>
            <input className="input" value={form.agentName || ''} onChange={set('agentName')} />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-1.5">Mensagem de boas-vindas</label>
            <input className="input" value={form.greetingMessage || ''} onChange={set('greetingMessage')} />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-1.5">Prompt do sistema</label>
            <textarea className="input min-h-[100px] resize-none" value={form.systemPrompt || ''} onChange={set('systemPrompt')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 block mb-1.5">Tom</label>
              <select className="input" value={form.tone || 'friendly'} onChange={set('tone')}>
                <option value="friendly">Amigável</option>
                <option value="professional">Profissional</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-300 block mb-1.5">Idioma</label>
              <select className="input" value={form.language || 'pt-BR'} onChange={set('language')}>
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">English (US)</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2 text-sm">
            <Save className="h-4 w-4" />
            {saved ? 'Salvo!' : saveMutation.isPending ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>

        {/* Phone channel */}
        <div className="card p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Phone className="h-4 w-4 text-primary" /> Canal de Telefone
          </h2>

          {tenant?.twilioPhoneNumber ? (
            /* Already configured */
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/8 border border-primary/25">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Número ativo</p>
                  <p className="text-lg font-mono font-semibold text-white tracking-wide">
                    {formatPhone(tenant.twilioPhoneNumber)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Recebendo ligações e respondendo com voz natural</p>
                </div>
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              </div>
              <button
                onClick={() => setShowPhoneSetup(s => !s)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Trocar número →
              </button>
            </div>
          ) : (
            /* Not configured yet */
            <p className="text-sm text-gray-400 mb-4">
              Selecione um número da sua conta Twilio para este agente atender ligações.
            </p>
          )}

          {/* Number picker — shown when not configured or when changing */}
          {(!tenant?.twilioPhoneNumber || showPhoneSetup) && (
            <div className="mt-4 space-y-3">
              {loadingNumbers ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando números da conta Twilio…
                </div>
              ) : twilioNumbers.length === 0 ? (
                <div className="text-sm text-gray-400 space-y-3">
                  <p>Nenhum número encontrado na conta Twilio.</p>
                  <a
                    href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline"
                  >
                    Comprar um número no Twilio Console →
                  </a>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500">
                    {twilioNumbers.length} número{twilioNumbers.length !== 1 ? 's' : ''} disponível{twilioNumbers.length !== 1 ? 'is' : ''} na conta:
                  </p>
                  <div className="relative">
                    <select
                      className="input appearance-none pr-8"
                      value={selectedSid}
                      onChange={e => setSelectedSid(e.target.value)}
                    >
                      <option value="">Selecione um número…</option>
                      {twilioNumbers.map((n: any) => (
                        <option key={n.sid} value={n.sid}>
                          {formatPhone(n.phoneNumber)}
                          {n.friendlyName && n.friendlyName !== n.phoneNumber ? `  —  ${n.friendlyName}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {assignError && (
                    <p className="text-xs text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> {assignError}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={assignPhone}
                      disabled={!selectedSid || assigningPhone}
                      className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      <Zap className="h-4 w-4" />
                      {assigningPhone ? 'Configurando…' : 'Usar este número'}
                    </button>
                    {showPhoneSetup && (
                      <button onClick={() => setShowPhoneSetup(false)} className="btn-secondary text-sm">
                        Cancelar
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-600">
                    O webhook do número selecionado será atualizado automaticamente para este agente.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* WhatsApp */}
        <div className="card p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
            <MessageSquare className="h-4 w-4 text-green-400" /> WhatsApp
          </h2>

          {/* Checking status */}
          {checkingWa && (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando conexão…
            </div>
          )}

          {/* Already connected */}
          {!checkingWa && isConnected && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/8 border border-green-500/30">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Wifi className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-300">WhatsApp conectado</p>
                {tenant?.whatsappPhoneNumber && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tenant.whatsappPhoneNumber.replace('+55', '+55 ')}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">Seu agente já está recebendo e respondendo mensagens.</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
            </div>
          )}

          {/* Not connected — show QR flow */}
          {!checkingWa && !isConnected && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Conecte um número de WhatsApp para que seu agente possa enviar e receber mensagens.
              </p>

              {/* Input */}
              <div>
                <label className="text-sm text-gray-300 block mb-1.5">Número do WhatsApp</label>
                <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden bg-gray-800 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500/50 transition-colors">
                  <span className="px-3 py-2 text-sm text-gray-400 bg-gray-700/60 border-r border-gray-700 select-none">+55</span>
                  <input
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none"
                    value={waPhone.replace(/^\+55/, '')}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '')
                      setWaPhone(digits ? `+55${digits}` : '')
                      if (qrState !== 'idle') { clearTimers(); setQrState('idle'); setQrCode(null) }
                    }}
                    placeholder="11 99999-9999"
                    maxLength={11}
                    disabled={qrState === 'loading'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">DDD + número. Funciona com WhatsApp pessoal ou Business app (recomendado).</p>
              </div>

              {/* Generate QR button */}
              {(qrState === 'idle' || qrState === 'error' || qrState === 'expired') && (
                <button
                  onClick={generateQr}
                  disabled={!phoneReady}
                  className="btn-secondary flex items-center gap-2 text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <SmartphoneNfc className="h-4 w-4" />
                  {qrState === 'expired' ? 'Gerar novo QR code' : qrState === 'error' ? 'Tentar novamente' : 'Gerar QR code para conectar'}
                </button>
              )}

              {/* Loading */}
              {qrState === 'loading' && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                  <Loader2 className="h-5 w-5 text-green-400 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Gerando QR code…</p>
                    <p className="text-xs text-gray-500">Conectando ao servidor WhatsApp</p>
                  </div>
                </div>
              )}

              {/* QR shown */}
              {qrState === 'shown' && qrCode && (
                <div className="p-5 rounded-xl bg-gray-800/60 border border-gray-700">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 text-center">
                      <img
                        src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                        alt="QR Code WhatsApp"
                        className="w-44 h-44 rounded-xl bg-white p-2"
                      />
                      <p className={`mt-2 text-xs font-mono font-semibold ${countdown <= 15 ? 'text-red-400' : 'text-gray-400'}`}>
                        Expira em {countdown}s
                      </p>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-semibold text-white mb-3">Como escanear:</p>
                      <ol className="space-y-2.5">
                        {[
                          'Abra o WhatsApp no celular',
                          'Toque em ⋮ → Dispositivos conectados',
                          'Toque em "Conectar dispositivo"',
                          'Aponte a câmera para o QR code',
                        ].map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
                            <span className="flex-shrink-0 h-4 w-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Aguardando conexão…
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expired */}
              {qrState === 'expired' && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/8 border border-yellow-500/30">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-300">QR code expirado</p>
                    <p className="text-xs text-gray-400 mt-0.5">Gere um novo código para continuar.</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {qrState === 'error' && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/30">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-300">Não foi possível conectar</p>
                    <p className="text-xs text-gray-400 mt-0.5">{qrError}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
