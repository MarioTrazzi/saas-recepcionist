import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import {
  Mic, Save, RefreshCw, Play, Square, Loader2, AlertCircle,
  CheckCircle, Volume2, Sparkles, ChevronRight, ExternalLink,
  PhoneCall, Zap,
} from 'lucide-react'
import { phoneApi } from '@/lib/api'
import ConvaiTestWidget from '@/components/ConvaiTestWidget'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { 'agent-id'?: string },
        HTMLElement
      >
    }
  }
}

const LANGUAGES = [
  { value: 'pt-br', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'en', label: 'English (US)', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
]

const LLMS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
]

function CreateAgentButton({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const create = async () => {
    setLoading(true)
    setError('')
    try {
      await phoneApi.createElevenLabsAgent()
      onCreated()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao criar agente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        onClick={create}
        disabled={loading}
        className="btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Criando agente…</>
          : <><Zap className="h-3.5 w-3.5" /> Criar agente de voz</>
        }
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-primary' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function ElevenLabsAgentSection({
  hasPhone = false,
  hasWhatsapp = false,
}: {
  hasPhone?: boolean
  hasWhatsapp?: boolean
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const [showVoicePicker, setShowVoicePicker] = useState(false)
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null)
  const [showExpressiveInfo, setShowExpressiveInfo] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)


  const { data: agent, isLoading, error } = useQuery({
    queryKey: ['elevenlabs-agent'],
    queryFn: phoneApi.getElevenLabsAgent,
    retry: false,
  })

  const { data: voices = [], isLoading: loadingVoices } = useQuery({
    queryKey: ['elevenlabs-voices'],
    queryFn: phoneApi.listElevenLabsVoices,
    staleTime: 5 * 60_000,
  })

  useEffect(() => {
    if (agent && !form) {
      setForm({
        name: agent.name ?? '',
        prompt: agent.prompt ?? '',
        firstMessage: agent.firstMessage ?? '',
        language: agent.language ?? 'pt-br',
        voiceId: agent.voiceId ?? '',
        expressiveMode: agent.expressiveMode ?? false,
        interruptible: agent.interruptible ?? true,
        llm: agent.llm ?? 'gemini-2.0-flash',
      })
    }
  }, [agent, form])

  const updateMutation = useMutation({
    mutationFn: () => phoneApi.updateElevenLabsAgent(form),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      qc.invalidateQueries({ queryKey: ['elevenlabs-agent'] })
    },
  })

  const set = (k: string, value: any) => setForm((f: any) => ({ ...f, [k]: value }))

  const playPreview = (previewUrl: string, voiceId: string) => {
    if (previewPlaying === voiceId) {
      audioRef.current?.pause()
      setPreviewPlaying(null)
      return
    }
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(previewUrl)
    audioRef.current = audio
    audio.onended = () => setPreviewPlaying(null)
    audio.play()
    setPreviewPlaying(voiceId)
  }

  const selectedVoice = voices.find((v: any) => v.id === form?.voiceId)
  const selectedLang = LANGUAGES.find(l => l.value === form?.language)
  const selectedLlm = LLMS.find(l => l.value === form?.llm)

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="card p-6 flex items-center gap-3 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando agente ElevenLabs…</span>
      </div>
    )
  }

  // ── No agent ─────────────────────────────────────────────────────────────
  if (error || !agent) {
    return (
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" /> Agente de Voz (ElevenLabs)
        </h2>

        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/30 p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-gray-700/60 flex items-center justify-center mx-auto">
            <PhoneCall className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">Agente de voz não configurado</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Crie o agente de voz para que a Sofia passe a atender ligações telefônicas automaticamente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <CreateAgentButton onCreated={() => qc.invalidateQueries({ queryKey: ['elevenlabs-agent'] })} />
            <button
              onClick={() => {
                // Scroll to phone channel section on the same settings page
                document.getElementById('phone-channel-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="btn-secondary text-sm flex items-center justify-center gap-2"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              Configurar número de telefone
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="card p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mic className="h-4 w-4 text-primary" />
          <span className="font-semibold text-white">Agente</span>
          <span className="text-[10px] font-bold bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">NOVO</span>
        </div>
        <a
          href={`https://elevenlabs.io/app/conversational-ai/${agent.agentId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> Abrir no ElevenLabs
        </a>
      </div>

      {/* No-channel warning */}
      {!hasPhone && !hasWhatsapp && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/8 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-300 leading-relaxed">
            Nenhum canal configurado. Configure um{' '}
            <button
              onClick={() => document.getElementById('phone-channel-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="underline hover:text-yellow-100 transition-colors"
            >
              número de telefone
            </button>
            {' '}ou{' '}
            <button
              onClick={() => document.getElementById('whatsapp-channel-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="underline hover:text-yellow-100 transition-colors"
            >
              WhatsApp
            </button>
            {' '}para que o agente possa receber chamadas e mensagens.
          </p>
        </div>
      )}

      {/* Widget demo */}
      <div className="rounded-xl bg-gray-900/60 border border-gray-700">
        <ConvaiTestWidget agentId={agent.agentId} />
      </div>

      {form && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Prompt do sistema */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-200">Prompt do sistema</label>
              </div>
              <div className="relative rounded-xl border border-gray-700 bg-gray-800/50 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
                <textarea
                  className="w-full bg-transparent px-4 pt-3 pb-10 text-sm text-gray-100 placeholder-gray-600 resize-none outline-none min-h-[180px]"
                  value={form.prompt}
                  onChange={e => set('prompt', e.target.value)}
                  placeholder="Você é um assistente de atendimento…"
                />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="text-xs text-gray-600">Digite {'{{'}  para adicionar variáveis</span>
                </div>
              </div>
            </div>

            {/* Primeira mensagem */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-medium text-gray-200">Primeira mensagem</label>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                A primeira fala do agente. Se vazia, o agente aguarda o usuário iniciar.
              </p>
              <div className="relative rounded-xl border border-gray-700 bg-gray-800/50 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
                <textarea
                  className="w-full bg-transparent px-4 pt-3 pb-10 text-sm text-gray-100 placeholder-gray-600 resize-none outline-none min-h-[100px]"
                  value={form.firstMessage}
                  onChange={e => set('firstMessage', e.target.value)}
                  placeholder="Olá! Como posso ajudar?"
                />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="text-xs text-gray-600">Digite {'{{'}  para adicionar variáveis</span>
                </div>
              </div>
              {/* Interruptível toggle */}
              <div className="flex items-center justify-end gap-2 mt-2.5">
                <span className="text-xs text-gray-400">Interrompível</span>
                <Toggle
                  checked={form.interruptible}
                  onChange={v => set('interruptible', v)}
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">

            {/* Vozes */}
            <div>
              <p className="text-sm font-medium text-gray-200 mb-0.5">Vozes</p>
              <p className="text-xs text-gray-500 mb-3">Selecione a voz do ElevenLabs para o agente.</p>
              <button
                type="button"
                onClick={() => setShowVoicePicker(s => !s)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-700 hover:border-gray-600 bg-gray-800/40 transition-colors text-left"
              >
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="flex-1 text-sm text-gray-200 truncate">
                  {selectedVoice?.name || 'Selecionar voz'}
                </span>
                <span className="text-[10px] font-semibold bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">Primário</span>
                <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${showVoicePicker ? 'rotate-90' : ''}`} />
              </button>

              {/* Voice picker dropdown */}
              {showVoicePicker && (
                <div className="mt-2 rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
                  {loadingVoices ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-800">
                      {voices.map((v: any) => (
                        <div
                          key={v.id}
                          onClick={() => { set('voiceId', v.id); setShowVoicePicker(false) }}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-800 transition-colors ${
                            form.voiceId === v.id ? 'bg-primary/8' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 truncate">{v.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{v.category || 'premade'}</p>
                          </div>
                          {v.preview && (
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); playPreview(v.preview, v.id) }}
                              className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                            >
                              {previewPlaying === v.id
                                ? <Square className="h-2.5 w-2.5 text-primary" />
                                : <Play className="h-2.5 w-2.5 text-gray-300" />
                              }
                            </button>
                          )}
                          {form.voiceId === v.id && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modo Expressivo */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-200">Modo Expressivo</span>
                <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">NOVO</span>
              </div>
              {(showExpressiveInfo || !form.expressiveMode) && (
                <p className="text-xs text-gray-400 leading-relaxed">
                  Aprimore o agente com fala emocionalmente inteligente, entonação natural e tags de áudio expressivas.
                </p>
              )}
              {form.expressiveMode ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 text-xs text-yellow-400 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" /> Ativo
                  </div>
                  <button
                    type="button"
                    onClick={() => set('expressiveMode', false)}
                    className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                  >
                    Desativar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => set('expressiveMode', true)}
                    className="text-xs font-medium text-gray-900 bg-white hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Ativar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExpressiveInfo(s => !s)}
                    className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                  >
                    {showExpressiveInfo ? 'Fechar' : 'Saiba mais'}
                  </button>
                </div>
              )}
            </div>

            {/* Idioma */}
            <div>
              <p className="text-sm font-medium text-gray-200 mb-0.5">Idioma</p>
              <p className="text-xs text-gray-500 mb-3">Idioma padrão em que o agente se comunicará.</p>
              <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-700 bg-gray-800/40">
                <span className="text-lg leading-none flex-shrink-0">{selectedLang?.flag}</span>
                <select
                  className="flex-1 bg-transparent text-sm text-gray-200 outline-none cursor-pointer"
                  value={form.language}
                  onChange={e => set('language', e.target.value)}
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value} className="bg-gray-900">{l.label}</option>)}
                </select>
                <span className="text-[10px] font-semibold bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0">Padrão</span>
              </div>
            </div>

            {/* LLM */}
            <div>
              <p className="text-sm font-medium text-gray-200 mb-0.5">LLM</p>
              <p className="text-xs text-gray-500 mb-3">Modelo de linguagem para processar as respostas.</p>
              <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-700 bg-gray-800/40">
                <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-blue-400 font-bold">AI</span>
                </div>
                <select
                  className="flex-1 bg-transparent text-sm text-gray-200 outline-none cursor-pointer"
                  value={form.llm}
                  onChange={e => set('llm', e.target.value)}
                >
                  {LLMS.map(l => <option key={l.value} value={l.value} className="bg-gray-900">{l.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save bar */}
      {form && (
        <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {updateMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</>
              : saved
              ? <><CheckCircle className="h-4 w-4" /> Salvo!</>
              : <><Save className="h-4 w-4" /> Salvar no ElevenLabs</>
            }
          </button>
          <button
            type="button"
            onClick={() => { setForm(null); qc.invalidateQueries({ queryKey: ['elevenlabs-agent'] }) }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Recarregar
          </button>
          {updateMutation.isError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 ml-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {(updateMutation.error as any)?.response?.data?.message || 'Erro ao salvar'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
