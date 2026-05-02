import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight, ChevronLeft, Phone, MessageSquare, CheckCircle,
  AlertCircle, Loader2, ExternalLink, Copy, Check, KeyRound,
  Shield, Zap, Star,
} from 'lucide-react'
import { WizardData } from '../index'
import { whatsappApi, phoneApi } from '@/lib/api'

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="flex-shrink-0 h-7 w-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
    </button>
  )
}

export function StepChannels({ data, update, onNext, onBack }: Props) {
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [evolutionVerifying, setEvolutionVerifying] = useState(false)
  const [evolutionVerifyError, setEvolutionVerifyError] = useState('')
  const [evolutionQrCode, setEvolutionQrCode] = useState('')

  const webhookUrl = `${window.location.origin.replace('5173', '3001')}/api/whatsapp/meta-webhook`
  const verifyToken = 'ai-receptionist-verify-2024'

  const { data: twilioNumbers, isLoading: numbersLoading } = useQuery<Array<{ sid: string; phoneNumber: string; friendlyName: string }>>({
    queryKey: ['phone-numbers'],
    queryFn: () => phoneApi.listNumbers(),
    enabled: data.phoneEnabled,
    staleTime: 60_000,
  })

  const handleVerify = async () => {
    if (!data.metaPhoneNumberId || !data.metaAccessToken) return
    setVerifying(true)
    setVerifyError('')
    try {
      await whatsappApi.setupCloudApi(data.metaPhoneNumberId, data.metaAccessToken)
      update({ whatsappVerified: true })
    } catch (e: any) {
      setVerifyError(e?.response?.data?.message || 'Credenciais inválidas. Verifique o Phone Number ID e o Access Token.')
      update({ whatsappVerified: false })
    } finally {
      setVerifying(false)
    }
  }

  const handleEvolutionVerify = async () => {
    if (!data.evolutionApiUrl || !data.evolutionApiKey || !data.evolutionPhone) return
    setEvolutionVerifying(true)
    setEvolutionVerifyError('')
    setEvolutionQrCode('')
    try {
      const result = await whatsappApi.setupEvolutionFallback(data.evolutionApiUrl, data.evolutionApiKey, data.evolutionPhone)
      setEvolutionQrCode(result.qrCode || '')
      update({ evolutionVerified: true })
    } catch (e: any) {
      setEvolutionVerifyError(e?.response?.data?.message || 'Não foi possível conectar. Verifique a URL e a chave da API.')
      update({ evolutionVerified: false })
    } finally {
      setEvolutionVerifying(false)
    }
  }

  const canProceed =
    (data.phoneEnabled || data.whatsappEnabled) &&
    (!data.phoneEnabled || !data.phoneNumberSid === false || (twilioNumbers?.length ?? 0) === 0) &&
    (!data.whatsappEnabled || data.whatsappVerified)

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Canais de atendimento</h2>
      <p className="text-gray-400 mb-8">Escolha como seu agente vai atender clientes. Pode ativar os dois ao mesmo tempo.</p>

      <div className="max-w-2xl space-y-4">

        {/* ── Phone ── */}
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
              <p className="text-sm text-gray-400 mt-1">Atende ligações com voz natural via ElevenLabs + Twilio.</p>
            </div>
          </div>
        </button>

        {data.phoneEnabled && (
          <div className="pl-2">
            <div className="card p-4 space-y-3">
              <label className="text-sm font-medium text-gray-300 block">Número Twilio para este agente</label>
              {numbersLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando números…
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
                      <option key={n.sid} value={n.sid}>{n.phoneNumber} — {n.friendlyName}</option>
                    ))}
                  </select>
                  {data.phoneNumberSid && (
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <CheckCircle className="h-3.5 w-3.5" /> Número selecionado
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-3 text-sm text-yellow-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>Nenhum número encontrado no Twilio. Configure depois em <strong>Configurações → Telefone</strong>.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WhatsApp ── */}
        <button
          onClick={() => update({ whatsappEnabled: !data.whatsappEnabled, whatsappVerified: false })}
          className={`card p-5 w-full text-left transition-all hover:border-gray-700 ${data.whatsappEnabled ? 'border-green-500 ring-1 ring-green-500/50' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${data.whatsappEnabled ? 'bg-green-600' : 'bg-gray-800'}`}>
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">WhatsApp Business</h3>
                {data.whatsappVerified
                  ? <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold"><CheckCircle className="h-3.5 w-3.5" /> Conectado</span>
                  : data.whatsappEnabled && <span className="text-xs text-gray-500">Configurar →</span>
                }
              </div>
              <p className="text-sm text-gray-400 mt-1">Responde mensagens via WhatsApp Business API (oficial Meta). Estável e sem risco de bloqueio.</p>
            </div>
          </div>
        </button>

        {/* ── WhatsApp Cloud API setup ── */}
        {data.whatsappEnabled && !data.whatsappVerified && (
          <div className="pl-2 space-y-3">

            {/* Step guide */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-green-400" />
                <p className="text-sm font-semibold text-white">Configure sua conta no Meta Developers</p>
              </div>

              <ol className="space-y-4">
                {/* Step 1 */}
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                  <div className="flex-1 text-sm text-gray-400">
                    <p className="text-gray-200 font-medium mb-1">Crie um app no Meta Developers</p>
                    <a
                      href="https://developers.facebook.com/apps/creation/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" /> developers.facebook.com/apps → Criar app → Empresa
                    </a>
                    <p className="mt-1 text-xs">Escolha o tipo <strong className="text-gray-200">Empresa</strong> e adicione o produto <strong className="text-gray-200">WhatsApp</strong>.</p>
                  </div>
                </li>

                {/* Step 2 */}
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                  <div className="flex-1 text-sm text-gray-400">
                    <p className="text-gray-200 font-medium mb-1">Copie o Phone Number ID e gere um Token permanente</p>
                    <p className="text-xs">No painel do app: <strong className="text-gray-200">WhatsApp → Configuração da API</strong>. Copie o <strong className="text-gray-200">ID do número de telefone</strong> e gere um token de acesso permanente em <strong className="text-gray-200">Configurações do sistema</strong>.</p>
                  </div>
                </li>

                {/* Step 3 */}
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                  <div className="flex-1 text-sm text-gray-400">
                    <p className="text-gray-200 font-medium mb-2">Configure o webhook no Meta</p>
                    <p className="text-xs mb-2">No painel do Meta Developers:</p>
                    <ol className="text-xs space-y-1.5 mb-3 list-decimal list-inside">
                      <li>Vá em <strong className="text-gray-200">WhatsApp → Configuração → Webhooks</strong></li>
                      <li>Clique em <strong className="text-gray-200">Assinar webhook</strong> (ou "Configure a webhook")</li>
                      <li>Cole a URL e o token abaixo</li>
                      <li>Confirme — o Meta vai testar a conexão</li>
                      <li>Após confirmar, assine o evento <strong className="text-gray-200">messages</strong></li>
                    </ol>
                    <div className="space-y-2">
                      <div className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2">
                        <p className="text-[10px] text-gray-500 mb-1">URL do webhook</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-green-300 flex-1 break-all">{webhookUrl}</code>
                          <CopyButton text={webhookUrl} />
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 border border-gray-700 px-3 py-2">
                        <p className="text-[10px] text-gray-500 mb-1">Token de verificação</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-green-300 flex-1">{verifyToken}</code>
                          <CopyButton text={verifyToken} />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(`URL: ${webhookUrl}\nToken: ${verifyToken}`)}
                        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 rounded-lg px-3 py-2 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copiar tudo (URL + Token)
                      </button>
                    </div>
                    <p className="text-xs mt-2 text-yellow-400/80">Importante: sem assinar o evento <strong>messages</strong>, o agente não recebe mensagens.</p>
                  </div>
                </li>

                {/* Pricing info */}
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-[10px] font-bold mt-0.5">!</span>
                  <div className="flex-1 text-sm text-gray-400">
                    <p className="text-gray-200 font-medium mb-2">Custos da API do WhatsApp</p>
                    <div className="rounded-lg bg-gray-900 border border-gray-700 p-3 space-y-2 text-xs">
                      <p><strong className="text-green-400">Grátis:</strong> 1.000 conversas/mês incluídas pela Meta.</p>
                      <p>Após esse limite, é necessário <strong className="text-gray-200">cadastrar um cartão de crédito</strong> no painel do Meta Business.</p>
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <p className="text-gray-300 font-medium mb-1">Estimativa de custos (Brasil):</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-gray-800 p-2">
                            <p className="text-gray-500 text-[10px]">3.000 msgs</p>
                            <p className="text-white font-semibold">~$0</p>
                            <p className="text-gray-500 text-[10px]">plano gratuito</p>
                          </div>
                          <div className="rounded-lg bg-gray-800 p-2">
                            <p className="text-gray-500 text-[10px]">7.000 msgs</p>
                            <p className="text-white font-semibold">~$15/mês</p>
                            <p className="text-gray-500 text-[10px]">~R$75</p>
                          </div>
                          <div className="rounded-lg bg-gray-800 p-2">
                            <p className="text-gray-500 text-[10px]">15.000 msgs</p>
                            <p className="text-white font-semibold">~$40/mês</p>
                            <p className="text-gray-500 text-[10px]">~R$200</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-500 text-[10px]">* Conversas de serviço (respostas a clientes) são as mais baratas. Valores podem variar.</p>
                    </div>
                  </div>
                </li>

                {/* Step 4 — credential inputs */}
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold mt-0.5">4</span>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-gray-200 font-medium">Cole suas credenciais e verifique</p>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Phone Number ID</label>
                      <input
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none"
                        placeholder="1234567890123456"
                        value={data.metaPhoneNumberId}
                        onChange={e => update({ metaPhoneNumberId: e.target.value.trim(), whatsappVerified: false })}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Access Token</label>
                      <input
                        type="password"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none"
                        placeholder="EAAxxxxxxxxxxxxxxx"
                        value={data.metaAccessToken}
                        onChange={e => update({ metaAccessToken: e.target.value.trim(), whatsappVerified: false })}
                      />
                    </div>

                    {verifyError && (
                      <div className="flex items-start gap-2 text-xs text-red-400">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        {verifyError}
                      </div>
                    )}

                    <button
                      onClick={handleVerify}
                      disabled={verifying || !data.metaPhoneNumberId || !data.metaAccessToken}
                      className="btn-secondary flex items-center gap-2 text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {verifying
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Verificando…</>
                        : <><CheckCircle className="h-4 w-4" /> Verificar e conectar</>
                      }
                    </button>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* ── Connected state ── */}
        {data.whatsappEnabled && data.whatsappVerified && (
          <div className="pl-2">
            <div className="card p-4 flex items-center gap-3 border-green-500/40 bg-green-500/8">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-300">WhatsApp Business conectado!</p>
                <p className="text-xs text-gray-400 mt-0.5">Credenciais verificadas. Seu agente está pronto para responder mensagens.</p>
              </div>
              <button
                onClick={() => update({ whatsappVerified: false, metaPhoneNumberId: '', metaAccessToken: '' })}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Alterar
              </button>
            </div>
          </div>
        )}

        {/* ── Evolution API Fallback (Optional) ── */}
        {data.whatsappEnabled && data.whatsappVerified && (
          <div className="pl-2 mt-4">
            <button
              onClick={() => update({ evolutionFallbackEnabled: !data.evolutionFallbackEnabled, evolutionVerified: false })}
              className={`card p-5 w-full text-left transition-all hover:border-gray-700 ${data.evolutionFallbackEnabled ? 'border-blue-500 ring-1 ring-blue-500/50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${data.evolutionFallbackEnabled ? 'bg-blue-600' : 'bg-gray-800'}`}>
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">Fallback Evolution API</h3>
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Star className="h-3 w-3" /> PRO
                      </span>
                    </div>
                    {data.evolutionVerified
                      ? <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold"><CheckCircle className="h-3.5 w-3.5" /> Conectado</span>
                      : data.evolutionFallbackEnabled && <span className="text-xs text-gray-500">Configurar →</span>
                    }
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Quando os créditos da Meta acabarem, o agente continua respondendo via Evolution API.
                    <strong className="text-gray-300"> Não consome créditos da Meta.</strong>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Zap className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-xs text-yellow-400/80">Recomendado para evitar interrupções no atendimento</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Evolution API configuration */}
            {data.evolutionFallbackEnabled && !data.evolutionVerified && (
              <div className="pl-2 mt-3 space-y-3">
                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-blue-400" />
                    <p className="text-sm font-semibold text-white">Configure a Evolution API</p>
                  </div>

                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/25 p-3">
                    <p className="text-xs text-blue-300">
                      A Evolution API é uma alternativa ao WhatsApp Business API oficial. Ela usa o protocolo WhatsApp Web (Baileys) e <strong>não consome créditos da Meta</strong>.
                      Configure sua própria instância ou use um serviço hospedado.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">URL da Evolution API</label>
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                      placeholder="https://sua-evolution-api.com"
                      value={data.evolutionApiUrl}
                      onChange={e => update({ evolutionApiUrl: e.target.value.trim(), evolutionVerified: false })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">API Key</label>
                    <input
                      type="password"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                      placeholder="Sua chave de API"
                      value={data.evolutionApiKey}
                      onChange={e => update({ evolutionApiKey: e.target.value.trim(), evolutionVerified: false })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Número de telefone (com código do país)</label>
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                      placeholder="5511999999999"
                      value={data.evolutionPhone}
                      onChange={e => update({ evolutionPhone: e.target.value.trim(), evolutionVerified: false })}
                    />
                  </div>

                  {evolutionVerifyError && (
                    <div className="flex items-start gap-2 text-xs text-red-400">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      {evolutionVerifyError}
                    </div>
                  )}

                  <button
                    onClick={handleEvolutionVerify}
                    disabled={evolutionVerifying || !data.evolutionApiUrl || !data.evolutionApiKey || !data.evolutionPhone}
                    className="btn-secondary flex items-center gap-2 text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {evolutionVerifying
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Conectando…</>
                      : <><CheckCircle className="h-4 w-4" /> Conectar Evolution API</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* QR Code for Evolution API */}
            {evolutionQrCode && (
              <div className="pl-2 mt-3">
                <div className="card p-5 text-center">
                  <p className="text-sm font-semibold text-white mb-3">Escaneie o QR Code com seu WhatsApp</p>
                  <img src={evolutionQrCode} alt="QR Code" className="mx-auto w-48 h-48 rounded-lg" />
                  <p className="text-xs text-gray-400 mt-3">Abra o WhatsApp no celular → Configurações → Aparelhos conectados → Conectar aparelho</p>
                </div>
              </div>
            )}

            {/* Evolution API connected state */}
            {data.evolutionFallbackEnabled && data.evolutionVerified && (
              <div className="pl-2 mt-3">
                <div className="card p-4 flex items-center gap-3 border-blue-500/40 bg-blue-500/8">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-300">Fallback Evolution API conectado!</p>
                    <p className="text-xs text-gray-400 mt-0.5">Se os créditos da Meta acabarem, o agente continuará respondendo via Evolution API.</p>
                  </div>
                  <button
                    onClick={() => update({ evolutionVerified: false, evolutionApiUrl: '', evolutionApiKey: '', evolutionPhone: '' })}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Alterar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!data.phoneEnabled && !data.whatsappEnabled && (
          <p className="text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-4 py-3">
            Selecione pelo menos um canal de atendimento para continuar.
          </p>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
