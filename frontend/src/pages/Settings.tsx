import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Phone, MessageSquare, Zap,
  Wifi, Loader2, AlertCircle, CheckCircle, ChevronDown, Copy, Check, KeyRound, ExternalLink,
} from 'lucide-react'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length === 13)
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  if (digits.startsWith('1') && digits.length === 11)
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  return raw
}
import { phoneApi, whatsappApi, tenantApi } from '@/lib/api'
import ElevenLabsAgentSection from '@/components/ElevenLabsAgentSection'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button type="button" onClick={copy} className="flex-shrink-0 h-7 w-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors" title="Copiar">
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
    </button>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()

  // Phone state
  const [showPhoneSetup, setShowPhoneSetup] = useState(false)
  const [selectedSid, setSelectedSid] = useState('')
  const [assigningPhone, setAssigningPhone] = useState(false)
  const [assignError, setAssignError] = useState('')

  // WhatsApp Cloud API state
  const [showWaSetup, setShowWaSetup] = useState(false)
  const [appId, setAppId] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [waVerifying, setWaVerifying] = useState(false)
  const [waError, setWaError] = useState('')

  const webhookUrl = `${window.location.origin.replace('5173', '3001')}/api/whatsapp/meta-webhook`
  const verifyToken = 'ai-receptionist-verify-2024'

  const { data: tenant, refetch: refetchTenant } = useQuery({ queryKey: ['tenant'], queryFn: tenantApi.getMe })
  const { data: twilioNumbers = [], isLoading: loadingNumbers } = useQuery({
    queryKey: ['twilio-numbers'],
    queryFn: phoneApi.listNumbers,
    enabled: showPhoneSetup || !tenant?.twilioPhoneNumber,
    staleTime: 60_000,
  })

  const { data: waStatus, isLoading: checkingWa, refetch: recheckWa } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: whatsappApi.status,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })

  const isConnected = waStatus?.connected === true

  const connectCloudApi = async () => {
    if (!phoneNumberId || !accessToken) return
    setWaVerifying(true)
    setWaError('')
    try {
      await whatsappApi.setupCloudApi(phoneNumberId, accessToken, appId)
      setShowWaSetup(false)
      setAppId('')
      setPhoneNumberId('')
      setAccessToken('')
      qc.invalidateQueries({ queryKey: ['whatsapp-status'] })
      recheckWa()
    } catch (e: any) {
      setWaError(e?.response?.data?.message || 'Credenciais inválidas. Verifique o Phone Number ID e o token.')
    } finally {
      setWaVerifying(false)
    }
  }

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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Configurações</h1>

      <div className="space-y-6">

        {/* Phone channel */}
        <div id="phone-channel-section" className="card p-6">
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

        {/* ElevenLabs Agent */}
        <ElevenLabsAgentSection />

        {/* WhatsApp */}
        <div className="card p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
            <MessageSquare className="h-4 w-4 text-green-400" /> WhatsApp Business
          </h2>

          {checkingWa && (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Verificando conexão…
            </div>
          )}

          {/* Connected */}
          {!checkingWa && isConnected && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/8 border border-green-500/30">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Wifi className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-300">WhatsApp Business conectado</p>
                  {tenant?.whatsappPhoneNumber && (
                    <p className="text-xs text-gray-400 mt-0.5">{tenant.whatsappPhoneNumber}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">Agente recebendo e respondendo mensagens via Cloud API.</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              </div>

              {/* Status/Error alert if credits esgotados or other issues */}
              {waStatus?.error && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${waStatus.error.includes('131042') ? 'bg-red-500/8 border-red-500/30' : 'bg-yellow-500/8 border-yellow-500/30'}`}>
                  <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${waStatus.error.includes('131042') ? 'text-red-400' : 'text-yellow-400'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${waStatus.error.includes('131042') ? 'text-red-300' : 'text-yellow-300'}`}>
                      {waStatus.error.includes('131042') ? 'Créditos da Meta esgotados' : 'Atenção na conexão'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {waStatus.error.includes('131042') 
                        ? 'A Meta não conseguiu cobrar seu cartão cadastrado. O atendimento oficial foi pausado e está operando via fallback (se configurado).' 
                        : waStatus.error}
                    </p>
                    {waStatus.error.includes('131042') && (
                      <a 
                        href="https://business.facebook.com/settings/whatsapp-business-accounts/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors mt-2"
                      >
                        Resolver na Meta <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowWaSetup(s => !s)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Trocar credenciais →
              </button>
            </div>
          )}

          {/* Not connected / setup form */}
          {!checkingWa && (!isConnected || showWaSetup) && (
            <div className="space-y-5">
              {!isConnected && (
                <p className="text-sm text-gray-400">
                  Conecte sua conta WhatsApp Business (Cloud API oficial da Meta) para que seu agente envie e receba mensagens.
                </p>
              )}

              {/* Webhook info */}
              <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-green-400" />
                  <p className="text-sm font-medium text-gray-200">Configure o webhook no Meta Developers</p>
                  <a
                    href={tenant?.metaAppId ? `https://developers.facebook.com/apps/${tenant.metaAppId}/use_cases/` : 'https://developers.facebook.com/apps/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
                  >
                    <ExternalLink className="h-3 w-3" /> Abrir Painel da Meta
                  </a>
                </div>
                <p className="text-xs text-gray-500">
                  Navegue em: <strong className="text-gray-300">Casos de uso → WhatsApp → Configurações → Webhooks</strong>. Use estes valores:
                </p>
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
                </div>
                <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Após salvar, clique em <strong className="text-yellow-500">Inscrever-se</strong> ao lado do campo <strong className="text-gray-200">messages</strong> na tabela de campos de objeto. O botão deve mudar para "Cancelar inscrição" para estar ativo.
                  </p>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-300 block mb-1.5">Meta App ID (opcional)</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none"
                    placeholder="1456857732642595"
                    value={appId}
                    onChange={e => { setAppId(e.target.value.trim()); setWaError('') }}
                  />
                  <p className="text-xs text-gray-500 mt-1">O ID do seu App no Meta Developers (usado para gerar links diretos).</p>
                </div>
                <div>
                  <label className="text-sm text-gray-300 block mb-1.5">Phone Number ID</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none"
                    placeholder="1234567890123456"
                    value={phoneNumberId}
                    onChange={e => { setPhoneNumberId(e.target.value.trim()); setWaError('') }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Em Meta Developers → WhatsApp → Configuração da API → ID do número de telefone</p>
                </div>
                <div>
                  <label className="text-sm text-gray-300 block mb-1.5">Access Token</label>
                  <input
                    type="password"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none"
                    placeholder="EAAxxxxxxxxxxxxxxx"
                    value={accessToken}
                    onChange={e => { setAccessToken(e.target.value.trim()); setWaError('') }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Token permanente gerado em Configurações do Sistema do app Meta.</p>
                </div>

                {waError && (
                  <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/25 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> 
                    {waError.includes('131042') ? 'Créditos da Meta esgotados. Verifique seu cartão na Meta Business.' : waError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={connectCloudApi}
                    disabled={waVerifying || !phoneNumberId || !accessToken}
                    className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    {waVerifying
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Verificando…</>
                      : <><CheckCircle className="h-4 w-4" /> Verificar e conectar</>
                    }
                  </button>
                  {showWaSetup && (
                    <button onClick={() => setShowWaSetup(false)} className="btn-secondary text-sm">Cancelar</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
