import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight, ChevronLeft, Phone, MessageSquare, CheckCircle,
  AlertCircle, Loader2, ExternalLink, Copy, Check, KeyRound,
  Shield, Zap, Star, Search, AlertTriangle, Rocket,
} from 'lucide-react'
import { WizardData } from '../index'
import { whatsappApi, phoneApi } from '@/lib/api'

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

interface PhoneNumberOption {
  sid: string
  phoneNumber: string
  region: string
  isMock: boolean
}

const DDD_REGIONS: Record<string, string> = {
  '11': 'São Paulo - Capital',
  '12': 'Vale do Paraíba - SP',
  '13': 'Baixada Santista - SP',
  '14': 'Bauru e região - SP',
  '15': 'Sorocaba e região - SP',
  '16': 'Ribeirão Preto - SP',
  '17': 'São José do Rio Preto - SP',
  '18': 'Presidente Prudente - SP',
  '19': 'Campinas e região - SP',
  '21': 'Rio de Janeiro - Capital',
  '22': 'Campos dos Goytacazes - RJ',
  '24': 'Volta Redonda - RJ',
  '27': 'Vitória - ES',
  '31': 'Belo Horizonte - MG',
  '41': 'Curitiba - PR',
  '43': 'Londrina - PR',
  '44': 'Maringá - PR',
  '47': 'Joinville - SC',
  '48': 'Florianópolis - SC',
  '51': 'Porto Alegre - RS',
  '54': 'Caxias do Sul - RS',
  '61': 'Brasília - DF',
  '62': 'Goiânia - GO',
  '65': 'Cuiabá - MT',
  '67': 'Campo Grande - MS',
  '71': 'Salvador - BA',
  '81': 'Recife - PE',
  '83': 'João Pessoa - PB',
  '84': 'Natal - RN',
  '85': 'Fortaleza - CE',
  '91': 'Belém - PA',
  '92': 'Manaus - AM',
  '98': 'São Luís - MA',
}

const MOCK_POOL: Array<{ phoneNumber: string; ddd: string }> = [
  { phoneNumber: '+5511991230001', ddd: '11' },
  { phoneNumber: '+5511992340002', ddd: '11' },
  { phoneNumber: '+5511993450003', ddd: '11' },
  { phoneNumber: '+5512991230001', ddd: '12' },
  { phoneNumber: '+5512992340002', ddd: '12' },
  { phoneNumber: '+5513991230001', ddd: '13' },
  { phoneNumber: '+5513992340002', ddd: '13' },
  { phoneNumber: '+5515991230001', ddd: '15' },
  { phoneNumber: '+5516991230001', ddd: '16' },
  { phoneNumber: '+5516992340002', ddd: '16' },
  { phoneNumber: '+5517991230001', ddd: '17' },
  { phoneNumber: '+5517992340002', ddd: '17' },
  { phoneNumber: '+5517993450003', ddd: '17' },
  { phoneNumber: '+5519991230001', ddd: '19' },
  { phoneNumber: '+5519992340002', ddd: '19' },
  { phoneNumber: '+5521991230001', ddd: '21' },
  { phoneNumber: '+5521992340002', ddd: '21' },
  { phoneNumber: '+5521993450003', ddd: '21' },
  { phoneNumber: '+5531991230001', ddd: '31' },
  { phoneNumber: '+5531992340002', ddd: '31' },
  { phoneNumber: '+5541991230001', ddd: '41' },
  { phoneNumber: '+5541992340002', ddd: '41' },
  { phoneNumber: '+5547991230001', ddd: '47' },
  { phoneNumber: '+5548991230001', ddd: '48' },
  { phoneNumber: '+5548992340002', ddd: '48' },
  { phoneNumber: '+5551991230001', ddd: '51' },
  { phoneNumber: '+5551992340002', ddd: '51' },
  { phoneNumber: '+5554991230001', ddd: '54' },
  { phoneNumber: '+5561991230001', ddd: '61' },
  { phoneNumber: '+5561992340002', ddd: '61' },
  { phoneNumber: '+5562991230001', ddd: '62' },
  { phoneNumber: '+5571991230001', ddd: '71' },
  { phoneNumber: '+5571992340002', ddd: '71' },
  { phoneNumber: '+5581991230001', ddd: '81' },
  { phoneNumber: '+5581992340002', ddd: '81' },
  { phoneNumber: '+5585991230001', ddd: '85' },
  { phoneNumber: '+5585992340002', ddd: '85' },
  { phoneNumber: '+5591991230001', ddd: '91' },
  { phoneNumber: '+5592991230001', ddd: '92' },
]

function formatBRPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) {
    const ddd = digits.slice(2, 4)
    const num = digits.slice(4)
    if (num.length === 9) return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`
    return `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`
  }
  return raw
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
  const [dddSearch, setDddSearch] = useState('')
  const [searchResults, setSearchResults] = useState<PhoneNumberOption[] | null>(null)

  const webhookUrl = `${window.location.origin.replace('5173', '3001')}/api/whatsapp/meta-webhook`
  const verifyToken = 'ai-receptionist-verify-2024'

  const { data: twilioNumbers, isLoading: numbersLoading } = useQuery<Array<{ sid: string; phoneNumber: string; friendlyName: string }>>({
    queryKey: ['phone-numbers'],
    queryFn: () => phoneApi.listNumbers(),
    enabled: data.phoneEnabled,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!data.phoneEnabled) {
      setDddSearch('')
      setSearchResults(null)
    }
  }, [data.phoneEnabled])

  const buildOptions = (ddd: string): PhoneNumberOption[] => {
    const realFiltered: PhoneNumberOption[] = (twilioNumbers ?? [])
      .filter(n => n.phoneNumber.replace(/\D/g, '').slice(2, 4) === ddd)
      .map(n => ({
        sid: n.sid,
        phoneNumber: n.phoneNumber,
        region: DDD_REGIONS[ddd] ?? `DDD ${ddd}`,
        isMock: false,
      }))

    const realPhones = new Set(realFiltered.map(n => n.phoneNumber))

    const mockFiltered: PhoneNumberOption[] = MOCK_POOL
      .filter(m => m.ddd === ddd && !realPhones.has(m.phoneNumber))
      .map((m, i) => ({
        sid: `mock-${m.ddd}-${String(i + 1).padStart(3, '0')}`,
        phoneNumber: m.phoneNumber,
        region: DDD_REGIONS[m.ddd] ?? `DDD ${m.ddd}`,
        isMock: true,
      }))

    return [...realFiltered, ...mockFiltered]
  }

  const handleSearch = () => {
    if (dddSearch.length < 2) return
    setSearchResults(buildOptions(dddSearch))
  }

  const allOptions = (): PhoneNumberOption[] => {
    const real: PhoneNumberOption[] = (twilioNumbers ?? []).map(n => {
      const ddd = n.phoneNumber.replace(/\D/g, '').slice(2, 4)
      return { sid: n.sid, phoneNumber: n.phoneNumber, region: DDD_REGIONS[ddd] ?? `DDD ${ddd}`, isMock: false }
    })
    const realPhones = new Set(real.map(n => n.phoneNumber))
    const mocks: PhoneNumberOption[] = MOCK_POOL.map((m, i) => ({
      sid: `mock-${m.ddd}-${String(i + 1).padStart(3, '0')}`,
      phoneNumber: m.phoneNumber,
      region: DDD_REGIONS[m.ddd] ?? `DDD ${m.ddd}`,
      isMock: true,
    })).filter(m => !realPhones.has(m.phoneNumber))
    return [...real, ...mocks]
  }

  const selectedOption = data.phoneNumberSid
    ? allOptions().find(n => n.sid === data.phoneNumberSid)
    : undefined

  const handleVerify = async () => {
    if (!data.metaPhoneNumberId || !data.metaAccessToken) return
    setVerifying(true)
    setVerifyError('')
    try {
      await whatsappApi.setupCloudApi(data.metaPhoneNumberId, data.metaAccessToken, data.metaAppId)
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
    (!data.phoneEnabled || !!data.phoneNumberSid) &&
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
            <div className="card p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">Escolha um número de telefone</label>
                <p className="text-xs text-gray-500">Digite o DDD para ver os números disponíveis na sua região.</p>
              </div>

              {numbersLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando números disponíveis…
                </div>
              ) : (
                <>
                  {/* DDD search input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none select-none">+55</span>
                      <input
                        value={dddSearch}
                        onChange={e => {
                          setDddSearch(e.target.value.replace(/\D/g, '').slice(0, 2))
                          setSearchResults(null)
                        }}
                        onKeyDown={e => e.key === 'Enter' && dddSearch.length >= 2 && handleSearch()}
                        placeholder="17"
                        maxLength={2}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-3 py-2 text-sm font-mono text-gray-100 placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={dddSearch.length < 2}
                      className="btn-primary text-sm px-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" /> Buscar
                    </button>
                  </div>

                  {/* Search results */}
                  {searchResults !== null && (
                    <div className="space-y-2">
                      {searchResults.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-500">
                          Nenhum número disponível para o DDD {dddSearch}
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500">
                            {searchResults.length} número{searchResults.length > 1 ? 's' : ''} disponíve{searchResults.length > 1 ? 'is' : 'l'} — DDD {dddSearch} · {DDD_REGIONS[dddSearch] ?? ''}
                          </p>
                          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                            {searchResults.map(n => (
                              <button
                                key={n.sid}
                                type="button"
                                onClick={() => update({ phoneNumberSid: n.sid })}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                                  data.phoneNumberSid === n.sid
                                    ? 'border-primary bg-primary/10'
                                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-mono font-medium text-white">{formatBRPhone(n.phoneNumber)}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{n.region}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {!n.isMock && (
                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Ativo</span>
                                  )}
                                  {data.phoneNumberSid === n.sid
                                    ? <CheckCircle className="h-4 w-4 text-primary" />
                                    : <div className="h-4 w-4 rounded-full border border-gray-600" />
                                  }
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Selected number summary (after clearing search) */}
                  {data.phoneNumberSid && searchResults === null && selectedOption && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-medium text-white">{formatBRPhone(selectedOption.phoneNumber)}</p>
                        <p className="text-xs text-gray-500">{selectedOption.region}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { update({ phoneNumberSid: '' }); setSearchResults(null) }}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                      >
                        Alterar
                      </button>
                    </div>
                  )}
                </>
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

            {/* Pegadinhas comuns — leia antes */}
            <div className="card border-yellow-500/40 bg-yellow-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-yellow-200">Antes de começar — duas pegadinhas que travam quase todo mundo</p>
              </div>

              <div className="space-y-2">
                <div className="rounded-lg bg-gray-900/60 border border-yellow-500/20 px-3 py-2.5">
                  <p className="text-xs font-semibold text-yellow-200 mb-1">1. "Subscribe" não significa que está inscrito</p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Na Meta, <strong className="text-yellow-300">tudo aparece com o botão "Subscribe" por padrão</strong> — e isso confunde.
                    Se o botão ao lado de <code className="bg-gray-800 px-1 rounded text-yellow-300">messages</code> diz "Subscribe", você <strong>NÃO está inscrito ainda</strong>.
                    Clique nele até que o botão mude para <strong className="text-green-300">"Unsubscribe"</strong> e o status fique como <strong className="text-green-300">Subscribed</strong>.
                  </p>
                </div>

                <div className="rounded-lg bg-gray-900/60 border border-yellow-500/20 px-3 py-2.5">
                  <p className="text-xs font-semibold text-yellow-200 mb-1 flex items-center gap-1.5">
                    <Rocket className="h-3 w-3" /> 2. Publique o app antes de usar com seu número real
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Por padrão o app fica em modo <strong className="text-yellow-300">Desenvolvimento</strong>, que só funciona com o número de teste da Meta.
                    Em <strong className="text-gray-200">Configurações Básicas</strong>, mude o app para <strong className="text-green-300">Em Operação (Live)</strong> antes de testar com seus clientes.
                  </p>
                </div>
              </div>
            </div>

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
                      <li>Navegue em <strong className="text-gray-200">Selecione o App → Casos de uso → WhatsApp (botão "Customize") → Configurações → Webhooks</strong></li>
                      <li>Clique em <strong className="text-gray-200">Assinar webhook</strong> (ou "Configure a webhook")</li>
                      <li>Cole a URL e o token abaixo</li>
                      <li>Confirme — o Meta vai testar a conexão</li>
                      <li>
                        Na lista de eventos, clique em <strong className="text-yellow-300">Subscribe</strong> ao lado de <code className="bg-gray-800 px-1 rounded">messages</code>.
                        Certifique-se de que o botão mudou para <strong className="text-green-300">Unsubscribe</strong> e o status está como <strong className="text-green-300">Subscribed</strong> para ativar o serviço.
                      </li>
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
                      <label className="text-xs text-gray-400 block mb-1">Meta App ID (opcional)</label>
                      <input
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none"
                        placeholder="1456857732642595"
                        value={data.metaAppId}
                        onChange={e => update({ metaAppId: e.target.value.trim(), whatsappVerified: false })}
                      />
                    </div>

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
