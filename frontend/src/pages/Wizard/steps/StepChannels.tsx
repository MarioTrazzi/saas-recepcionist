import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight, ChevronLeft, Phone, MessageSquare, CheckCircle,
  Info, ExternalLink, AlertCircle, Loader2, Wifi, SmartphoneNfc,
} from 'lucide-react'
import { WizardData } from '../index'
import { whatsappApi, phoneApi } from '@/lib/api'

type QrState = 'idle' | 'loading' | 'shown' | 'connected' | 'expired' | 'error'

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

const QR_TTL = 60

export function StepChannels({ data, update, onNext, onBack }: Props) {
  const [qrState, setQrState] = useState<QrState>('idle')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(QR_TTL)
  const [errorMsg, setErrorMsg] = useState('')
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  // When WhatsApp is enabled, check if already connected before showing QR flow
  useEffect(() => {
    if (!data.whatsappEnabled) {
      clearTimers()
      setQrState('idle')
      setQrCode(null)
      return
    }
    // Auto-detect existing connection
    whatsappApi.status().then(({ connected }) => {
      if (connected) setQrState('connected')
    }).catch(() => {})
  }, [data.whatsappEnabled, clearTimers])

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
          setQrState('connected')
        }
      } catch {
        // ignore polling errors silently
      }
    }, 3000)
  }, [clearTimers])

  const generateQr = async () => {
    if (!data.whatsappPhone) return
    clearTimers()
    setQrState('loading')
    setErrorMsg('')
    try {
      const result = await whatsappApi.setup(data.whatsappPhone)
      if (result.qrCode) {
        setQrCode(result.qrCode)
        setQrState('shown')
        startTimers()
      } else {
        // Instance already existed and is connected
        setQrState('connected')
      }
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Não foi possível gerar o QR code. Verifique sua conexão.')
      setQrState('error')
    }
  }

  const { data: twilioNumbers, isLoading: numbersLoading } = useQuery<Array<{ sid: string; phoneNumber: string; friendlyName: string }>>({
    queryKey: ['phone-numbers'],
    queryFn: () => phoneApi.listNumbers(),
    enabled: data.phoneEnabled,
    staleTime: 60_000,
  })

  const phoneDigits = data.whatsappPhone.replace(/\D/g, '').replace(/^55/, '')
  const phoneReady = phoneDigits.length >= 10

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Canais de atendimento</h2>
      <p className="text-gray-400 mb-8">Escolha como seu agente vai atender clientes. Pode ativar os dois ao mesmo tempo.</p>

      <div className="max-w-2xl space-y-4">

        {/* Phone channel */}
        <button
          onClick={() => update({ phoneEnabled: !data.phoneEnabled })}
          className={`card p-5 w-full text-left transition-all hover:border-gray-700 ${data.phoneEnabled ? 'border-primary ring-1 ring-primary' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${data.phoneEnabled ? 'bg-primary' : 'bg-gray-800'}`}>
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Telefone</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">CORE</span>
                  {data.phoneEnabled && <CheckCircle className="h-4 w-4 text-primary" />}
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-1">Atende ligações com voz natural via ElevenLabs + Twilio. Um número brasileiro dedicado será provisionado para o seu negócio.</p>
              <ul className="mt-3 space-y-1">
                {['Voz natural, não robótica', 'Número dedicado para seu negócio', 'Funciona 24/7 sem interrupção'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="h-1 w-1 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </button>

        {/* Phone number picker — shown when phone channel is enabled */}
        {data.phoneEnabled && (
          <div className="pl-2 space-y-3">
            <div className="card p-4 space-y-3">
              <label className="text-sm font-medium text-gray-300 block">
                Selecione o número Twilio para este agente
              </label>

              {numbersLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando números disponíveis…
                </div>
              ) : twilioNumbers && twilioNumbers.length > 0 ? (
                <>
                  <select
                    value={data.phoneNumberSid}
                    onChange={e => update({ phoneNumberSid: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                  >
                    <option value="">Escolha um número…</option>
                    {twilioNumbers.map(n => (
                      <option key={n.sid} value={n.sid}>
                        {n.phoneNumber} — {n.friendlyName}
                      </option>
                    ))}
                  </select>
                  {!data.phoneNumberSid && (
                    <p className="text-xs text-yellow-400/80">Selecione um número para ativar o canal de telefone.</p>
                  )}
                  {data.phoneNumberSid && (
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Número selecionado — será configurado ao finalizar o wizard
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-3 text-sm text-yellow-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    Nenhum número encontrado na sua conta Twilio. Você pode configurar um número depois em{' '}
                    <strong>Configurações → Telefone</strong>.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp channel toggle */}
        <button
          onClick={() => update({ whatsappEnabled: !data.whatsappEnabled })}
          className={`card p-5 w-full text-left transition-all hover:border-gray-700 ${data.whatsappEnabled ? 'border-green-500 ring-1 ring-green-500/50' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${data.whatsappEnabled ? 'bg-green-600' : 'bg-gray-800'}`}>
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">WhatsApp</h3>
                {qrState === 'connected'
                  ? <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold"><Wifi className="h-3.5 w-3.5" /> Conectado</span>
                  : data.whatsappEnabled && <CheckCircle className="h-4 w-4 text-green-500" />
                }
              </div>
              <p className="text-sm text-gray-400 mt-1">Responde mensagens automaticamente. Conecta via QR code — sem API paga.</p>
              <ul className="mt-3 space-y-1">
                {['Respostas instantâneas', 'Mesmo agente do telefone', 'Histórico unificado de conversas'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="h-1 w-1 rounded-full bg-green-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </button>

        {/* WhatsApp connection flow */}
        {data.whatsappEnabled && (
          <div className="space-y-3 pl-2">

            {/* Info banner */}
            <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/25 rounded-xl px-4 py-3">
              <Info className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-green-300 font-medium mb-0.5">Recomendado: WhatsApp Business (app gratuito)</p>
                <p className="text-green-400/80">
                  Qualquer número funciona, mas o <strong className="text-green-300">WhatsApp Business</strong> exibe
                  nome da empresa, horário e descrição — muito mais profissional para os clientes.
                </p>
              </div>
            </div>

            {/* Phone number input */}
            <div className="card p-4 space-y-3">
              <label className="text-sm font-medium text-gray-300 block">Número do WhatsApp que vai atender</label>
              <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden bg-gray-800 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500/50 transition-colors">
                <span className="px-3 py-2 text-sm text-gray-400 bg-gray-700/60 border-r border-gray-700 select-none">+55</span>
                <input
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none"
                  value={data.whatsappPhone.replace(/^\+55/, '')}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '')
                    update({ whatsappPhone: digits ? `+55${digits}` : '' })
                    // Reset QR if number changes
                    if (qrState !== 'idle') {
                      clearTimers()
                      setQrState('idle')
                      setQrCode(null)
                    }
                  }}
                  placeholder="11 99999-9999"
                  maxLength={11}
                  disabled={qrState === 'connected'}
                />
              </div>
              <p className="text-xs text-gray-500">DDD + número. Ex: 11 99999-9999</p>

              {/* Generate QR button — idle / error / expired */}
              {(qrState === 'idle' || qrState === 'error' || qrState === 'expired') && (
                <button
                  onClick={generateQr}
                  disabled={!phoneReady}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <SmartphoneNfc className="h-4 w-4" />
                  {qrState === 'expired' ? 'Gerar novo QR code' : qrState === 'error' ? 'Tentar novamente' : 'Conectar via QR code'}
                </button>
              )}

              {!phoneReady && qrState === 'idle' && (
                <p className="text-xs text-gray-500 text-center">Digite o número completo com DDD para gerar o QR code</p>
              )}
            </div>

            {/* Loading */}
            {qrState === 'loading' && (
              <div className="card p-6 flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
                <p className="text-sm text-gray-300 font-medium">Gerando QR code…</p>
                <p className="text-xs text-gray-500">Conectando ao servidor WhatsApp</p>
              </div>
            )}

            {/* QR shown */}
            {qrState === 'shown' && qrCode && (
              <div className="card p-5">
                <div className="flex items-start gap-5">
                  {/* QR image */}
                  <div className="flex-shrink-0">
                    <img
                      src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                      alt="QR Code WhatsApp"
                      className="w-40 h-40 rounded-xl bg-white p-2"
                    />
                    {/* Countdown */}
                    <div className={`mt-2 text-center text-xs font-mono font-semibold ${countdown <= 15 ? 'text-red-400' : 'text-gray-400'}`}>
                      Expira em {countdown}s
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-3">Como escanear:</p>
                    <ol className="space-y-2">
                      {[
                        'Abra o WhatsApp no seu celular',
                        'Toque em ⋮ (três pontos) → Dispositivos conectados',
                        'Toque em "Conectar dispositivo"',
                        'Aponte a câmera para este QR code',
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
                          <span className="flex-shrink-0 h-4 w-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Aguardando conexão…
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QR expired */}
            {qrState === 'expired' && (
              <div className="card p-4 flex items-center gap-3 border-yellow-500/30 bg-yellow-500/5">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-300">QR code expirado</p>
                  <p className="text-xs text-gray-400 mt-0.5">Gere um novo para continuar a conexão.</p>
                </div>
              </div>
            )}

            {/* Error */}
            {qrState === 'error' && (
              <div className="card p-4 flex items-center gap-3 border-red-500/30 bg-red-500/5">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-300">Não foi possível conectar</p>
                  <p className="text-xs text-gray-400 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Connected */}
            {qrState === 'connected' && (
              <div className="card p-4 flex items-center gap-3 border-green-500/40 bg-green-500/8">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Wifi className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-300">WhatsApp conectado com sucesso!</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {data.whatsappPhone.replace('+55', '')} já está pronto para receber e responder mensagens.
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              </div>
            )}

            {/* Comparison accordion */}
            <details className="card overflow-hidden">
              <summary className="px-4 py-3 text-sm text-gray-400 cursor-pointer hover:text-gray-200 transition-colors list-none flex items-center gap-2">
                <Info className="h-3.5 w-3.5" />
                Diferença entre WhatsApp pessoal, Business app e API oficial
              </summary>
              <div className="border-t border-gray-800 p-4 space-y-3 text-sm">
                {[
                  { mark: '✓', color: 'text-yellow-400', name: 'WhatsApp pessoal', note: 'Funciona, mas sem perfil de empresa. Ok para testes.' },
                  { mark: '✓', color: 'text-green-400', name: 'WhatsApp Business app (recomendado)', note: 'Gratuito. Perfil com nome, horário e descrição. Ideal para uso profissional.' },
                  { mark: '✗', color: 'text-red-400', name: 'API oficial Meta (Cloud API)', note: 'Não é necessária. Requer aprovação e é paga por mensagem.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`text-xs font-bold mt-0.5 flex-shrink-0 ${item.color}`}>{item.mark}</span>
                    <div>
                      <span className="font-medium text-gray-200">{item.name}</span>
                      <p className="text-gray-500 mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
                <a href="https://play.google.com/store/apps/details?id=com.whatsapp.w4b" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 mt-1 transition-colors">
                  <ExternalLink className="h-3 w-3" /> Baixar WhatsApp Business (Android)
                </a>
              </div>
            </details>
          </div>
        )}

        {!data.phoneEnabled && !data.whatsappEnabled && (
          <p className="text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-4 py-3">
            Selecione pelo menos um canal de atendimento para continuar.
          </p>
        )}
      </div>

      {/* Validation hint */}
      {data.phoneEnabled && !data.phoneNumberSid && (twilioNumbers?.length ?? 0) > 0 && (
        <p className="mt-6 text-sm text-yellow-400/80">
          Selecione um número de telefone para continuar, ou desative o canal de telefone.
        </p>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <button
          onClick={onNext}
          disabled={
            (!data.phoneEnabled && !data.whatsappEnabled) ||
            (data.phoneEnabled && !data.phoneNumberSid && (twilioNumbers?.length ?? 0) > 0)
          }
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {data.whatsappEnabled && qrState !== 'connected' && qrState !== 'idle'
            ? 'Continuar sem conectar'
            : 'Continuar'
          }
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
