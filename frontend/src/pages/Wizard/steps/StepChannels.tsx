import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight, ChevronLeft, Phone, MessageSquare, CheckCircle,
  AlertCircle, Loader2, ExternalLink, Copy, Check, KeyRound,
  Shield, Zap, Star, Search, Sparkles, ChevronDown,
} from 'lucide-react'
import { WizardData } from '../index'
import { whatsappApi, phoneApi } from '@/lib/api'
import { facebookEmbeddedSignup } from '@/lib/facebook'

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
  onOpenSupport?: () => void
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

const BR_STATES: Array<{ uf: string; name: string }> = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
]

const STATE_CITIES: Record<string, Array<{ name: string; ddd: string }>> = {
  SP: [
    { name: 'São Paulo', ddd: '11' }, { name: 'Campinas', ddd: '19' }, { name: 'Guarulhos', ddd: '11' },
    { name: 'São Bernardo do Campo', ddd: '11' }, { name: 'Santo André', ddd: '11' }, { name: 'Osasco', ddd: '11' },
    { name: 'Santos', ddd: '13' }, { name: 'Ribeirão Preto', ddd: '16' }, { name: 'Sorocaba', ddd: '15' },
    { name: 'São José dos Campos', ddd: '12' }, { name: 'São José do Rio Preto', ddd: '17' }, { name: 'Bauru', ddd: '14' },
    { name: 'Presidente Prudente', ddd: '18' }, { name: 'Jundiaí', ddd: '11' },
  ],
  RJ: [
    { name: 'Rio de Janeiro', ddd: '21' }, { name: 'Niterói', ddd: '21' }, { name: 'São Gonçalo', ddd: '21' },
    { name: 'Duque de Caxias', ddd: '21' }, { name: 'Nova Iguaçu', ddd: '21' }, { name: 'Campos dos Goytacazes', ddd: '22' },
    { name: 'Volta Redonda', ddd: '24' }, { name: 'Petrópolis', ddd: '24' },
  ],
  MG: [
    { name: 'Belo Horizonte', ddd: '31' }, { name: 'Uberlândia', ddd: '34' }, { name: 'Contagem', ddd: '31' },
    { name: 'Juiz de Fora', ddd: '32' }, { name: 'Betim', ddd: '31' }, { name: 'Montes Claros', ddd: '38' },
  ],
  ES: [
    { name: 'Vitória', ddd: '27' }, { name: 'Vila Velha', ddd: '27' }, { name: 'Serra', ddd: '27' },
    { name: 'Cariacica', ddd: '27' },
  ],
  PR: [
    { name: 'Curitiba', ddd: '41' }, { name: 'Londrina', ddd: '43' }, { name: 'Maringá', ddd: '44' },
    { name: 'Ponta Grossa', ddd: '42' }, { name: 'Foz do Iguaçu', ddd: '45' }, { name: 'Cascavel', ddd: '45' },
  ],
  SC: [
    { name: 'Florianópolis', ddd: '48' }, { name: 'Joinville', ddd: '47' }, { name: 'Blumenau', ddd: '47' },
    { name: 'São José', ddd: '48' }, { name: 'Criciúma', ddd: '48' }, { name: 'Chapecó', ddd: '49' },
  ],
  RS: [
    { name: 'Porto Alegre', ddd: '51' }, { name: 'Caxias do Sul', ddd: '54' }, { name: 'Pelotas', ddd: '53' },
    { name: 'Canoas', ddd: '51' }, { name: 'Santa Maria', ddd: '55' }, { name: 'Passo Fundo', ddd: '54' },
  ],
  BA: [
    { name: 'Salvador', ddd: '71' }, { name: 'Feira de Santana', ddd: '75' }, { name: 'Vitória da Conquista', ddd: '77' },
    { name: 'Camaçari', ddd: '71' }, { name: 'Itabuna', ddd: '73' },
  ],
  PE: [
    { name: 'Recife', ddd: '81' }, { name: 'Jaboatão dos Guararapes', ddd: '81' }, { name: 'Olinda', ddd: '81' },
    { name: 'Caruaru', ddd: '81' }, { name: 'Petrolina', ddd: '87' },
  ],
  CE: [
    { name: 'Fortaleza', ddd: '85' }, { name: 'Caucaia', ddd: '85' }, { name: 'Juazeiro do Norte', ddd: '88' },
    { name: 'Maracanaú', ddd: '85' }, { name: 'Sobral', ddd: '88' },
  ],
  DF: [{ name: 'Brasília', ddd: '61' }],
  GO: [
    { name: 'Goiânia', ddd: '62' }, { name: 'Aparecida de Goiânia', ddd: '62' }, { name: 'Anápolis', ddd: '62' },
    { name: 'Rio Verde', ddd: '64' },
  ],
  MT: [{ name: 'Cuiabá', ddd: '65' }, { name: 'Várzea Grande', ddd: '65' }, { name: 'Rondonópolis', ddd: '66' }],
  MS: [{ name: 'Campo Grande', ddd: '67' }, { name: 'Dourados', ddd: '67' }],
  PA: [{ name: 'Belém', ddd: '91' }, { name: 'Ananindeua', ddd: '91' }, { name: 'Santarém', ddd: '93' }],
  AM: [{ name: 'Manaus', ddd: '92' }],
  MA: [{ name: 'São Luís', ddd: '98' }, { name: 'Imperatriz', ddd: '99' }],
  PB: [{ name: 'João Pessoa', ddd: '83' }, { name: 'Campina Grande', ddd: '83' }],
  RN: [{ name: 'Natal', ddd: '84' }, { name: 'Mossoró', ddd: '84' }],
  AL: [{ name: 'Maceió', ddd: '82' }, { name: 'Arapiraca', ddd: '82' }],
  SE: [{ name: 'Aracaju', ddd: '79' }],
  PI: [{ name: 'Teresina', ddd: '86' }],
  RO: [{ name: 'Porto Velho', ddd: '69' }],
  TO: [{ name: 'Palmas', ddd: '63' }],
  AC: [{ name: 'Rio Branco', ddd: '68' }],
  AP: [{ name: 'Macapá', ddd: '96' }],
  RR: [{ name: 'Boa Vista', ddd: '95' }],
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

export function StepChannels({ data, update, onNext, onBack, onOpenSupport }: Props) {
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [embeddedLoading, setEmbeddedLoading] = useState(false)
  const [embeddedError, setEmbeddedError] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [evolutionVerifying, setEvolutionVerifying] = useState(false)
  const [evolutionVerifyError, setEvolutionVerifyError] = useState('')
  const [evolutionQrCode, setEvolutionQrCode] = useState('')
  const [dddSearch, setDddSearch] = useState('11')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
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
      setDddSearch('11')
      setSelectedState('')
      setSelectedCity('')
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

  const handleEmbeddedSignup = async () => {
    setEmbeddedError('')
    setEmbeddedLoading(true)
    try {
      const result = await facebookEmbeddedSignup()
      if (!result) return // user cancelled
      const { phoneNumber } = await whatsappApi.embeddedSignup(result.code, window.location.origin)
      update({ whatsappVerified: true, whatsappEnabled: true, whatsappPhoneNumber: phoneNumber } as any)
    } catch (e: any) {
      setEmbeddedError(e?.response?.data?.message || 'Não foi possível conectar. Tente novamente.')
    } finally {
      setEmbeddedLoading(false)
    }
  }

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
                  {/* DDD / Estado / Cidade search */}
                  <div className="flex gap-2 flex-wrap">
                    <div className="w-16">
                      <label className="text-[10px] text-gray-500 block mb-1">DDD</label>
                      <input
                        value={dddSearch}
                        onChange={e => {
                          setDddSearch(e.target.value.replace(/\D/g, '').slice(0, 2))
                          setSelectedState('')
                          setSelectedCity('')
                          setSearchResults(null)
                        }}
                        placeholder="11"
                        maxLength={2}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm font-mono text-gray-100 placeholder-gray-600 text-center focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                      />
                    </div>
                    <div className="flex-1 min-w-[110px]">
                      <label className="text-[10px] text-gray-500 block mb-1">Estado</label>
                      <select
                        value={selectedState}
                        onChange={e => {
                          setSelectedState(e.target.value)
                          setSelectedCity('')
                          setSearchResults(null)
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-100 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                      >
                        <option value="">Selecione</option>
                        {BR_STATES.map(s => (
                          <option key={s.uf} value={s.uf}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[130px]">
                      <label className="text-[10px] text-gray-500 block mb-1">Cidade</label>
                      <select
                        value={selectedCity}
                        onChange={e => {
                          const city = e.target.value
                          setSelectedCity(city)
                          const st = STATE_CITIES[selectedState]
                          const found = st?.find(c => c.name === city)
                          if (found) setDddSearch(found.ddd)
                          setSearchResults(null)
                        }}
                        disabled={!selectedState}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-100 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">Selecione</option>
                        {selectedState && (STATE_CITIES[selectedState] ?? []).map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={dddSearch.length < 2}
                        className="btn-primary text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Search className="h-4 w-4" /> Buscar
                      </button>
                    </div>
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

        {/* ── WhatsApp setup ── */}
        {data.whatsappEnabled && !data.whatsappVerified && (
          <div className="pl-2 space-y-3">

            {/* Embedded Signup — primary path */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#1877F2]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="#1877F2"/>
                    <path d="M13.25 15.5h-2.5v-5.25H9.5V8.5h1.25V7.75C10.75 6.23 11.61 5.5 13 5.5c.62 0 1.25.06 1.25.06v1.44h-.7c-.69 0-.8.33-.8.81V8.5h1.44l-.19 1.75H12.75V15.5z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Conectar com Meta</p>
                  <p className="text-xs text-gray-400">Sua conta Business é detectada automaticamente</p>
                </div>
              </div>

              {embeddedError && (
                <div className="flex items-start gap-2 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  {embeddedError}
                </div>
              )}

              <button
                type="button"
                onClick={handleEmbeddedSignup}
                disabled={embeddedLoading}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166FE5] px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {embeddedLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Conectando…</>
                  : <><CheckCircle className="h-4 w-4" /> Conectar conta Meta</>
                }
              </button>
            </div>

            {/* Manual fallback — collapsible */}
            <div>
              <button
                type="button"
                onClick={() => setShowManual(s => !s)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showManual ? 'rotate-180' : ''}`} />
                Configurar manualmente (Phone Number ID + Token)
              </button>

              {showManual && (
                <div className="mt-3 card p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-green-400" />
                    <p className="text-sm font-semibold text-white">Credenciais manuais</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-1">URL e token do webhook</p>
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

                  <div className="space-y-3">
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
                </div>
              )}
            </div>

            {/* Support advice */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex gap-3 items-start">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Ficou com dúvida?</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Nosso assistente de IA pode te guiar passo a passo na configuração.
                </p>
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Falar com o assistente <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
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

                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/25 p-3 space-y-2">
                    <p className="text-xs text-blue-300">
                      A Evolution API é uma alternativa ao WhatsApp Business API oficial. Ela usa o protocolo WhatsApp Web (Baileys) e <strong>não consome créditos da Meta</strong>.
                      Configure sua própria instância ou use um serviço hospedado.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="https://evolution-api.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" /> Site oficial
                      </a>
                      <a
                        href="https://doc.evolution-api.com/v2/pt/get-started/introduction"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" /> Documentação
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">URL da Evolution API</label>
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                      placeholder="https://sua-evolution-api.com"
                      value={data.evolutionApiUrl}
                      onChange={e => update({ evolutionApiUrl: e.target.value.trim(), evolutionVerified: false })}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      URL da sua instância. Se usar serviço hospedado, está no painel do seu provedor.{' '}
                      <a
                        href="https://evolution-api.com/#pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        Ver provedores hospedados →
                      </a>
                    </p>
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
                    <p className="text-[10px] text-gray-500 mt-1">
                      Chave global definida na instalação. Disponível no painel do seu provedor ou em{' '}
                      <code className="bg-gray-800 px-1 rounded text-gray-400">{data.evolutionApiUrl || 'sua-url'}/manager</code>
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Número de telefone (com código do país)</label>
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                      placeholder="5511999999999"
                      value={data.evolutionPhone}
                      onChange={e => update({ evolutionPhone: e.target.value.trim(), evolutionVerified: false })}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Número do WhatsApp que será conectado. Formato: código do país + DDD + número (sem espaços ou símbolos).
                    </p>
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
