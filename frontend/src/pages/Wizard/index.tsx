import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ChevronRight, ChevronLeft, Phone } from 'lucide-react'
import { StepTemplate } from './steps/StepTemplate'
import { StepPersonalize } from './steps/StepPersonalize'
import { StepKnowledge } from './steps/StepKnowledge'
import { StepChannels } from './steps/StepChannels'
import { StepHandoff } from './steps/StepHandoff'
import { StepActivate } from './steps/StepActivate'
import { SupportChat } from '@/components/wizard/SupportChat'
import { agentApi, phoneApi, calendarApi, whatsappApi, knowledgeApi, tenantApi } from '@/lib/api'

const STEPS = [
  { id: 1, title: 'Template', desc: 'Escolha o tipo de negócio' },
  { id: 2, title: 'Personalize', desc: 'Nome, voz e tom' },
  { id: 3, title: 'Conhecimento', desc: 'Informe sobre seu negócio' },
  { id: 4, title: 'Canais', desc: 'Telefone e WhatsApp' },
  { id: 5, title: 'Transferência', desc: 'Quando passar para humano' },
  { id: 6, title: 'Ativar', desc: 'Revise e publique' },
]

export interface WizardData {
  templateId: string
  templateCategory: string
  agentName: string
  greetingMessage: string
  systemPrompt: string
  tone: string
  language: string
  knowledgeItems: Array<{ title: string; content: string; _saved?: boolean }>
  phoneEnabled: boolean
  phoneNumberSid: string
  whatsappEnabled: boolean
  metaAppId: string
  metaPhoneNumberId: string
  metaAccessToken: string
  whatsappVerified: boolean
  evolutionFallbackEnabled: boolean
  evolutionApiUrl: string
  evolutionApiKey: string
  evolutionPhone: string
  evolutionVerified: boolean
  handoffMode: string
  handoffPhone: string
  handoffWhatsapp: string
  calendarMode: 'none' | 'google' | 'builtin'
  calendarSlotMinutes: number
  googleCalendarConnected: boolean
}

const DRAFT_KEY = 'wizard_draft'

function loadDraft(): { step: number; data: WizardData } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const EMPTY: WizardData = {
  templateId: '',
  templateCategory: 'custom',
  agentName: '',
  greetingMessage: '',
  systemPrompt: '',
  tone: 'friendly',
  language: 'pt-BR',
  knowledgeItems: [],
  phoneEnabled: true,
  phoneNumberSid: '',
  whatsappEnabled: false,
  metaAppId: '',
  metaPhoneNumberId: '',
  metaAccessToken: '',
  whatsappVerified: false,
  evolutionFallbackEnabled: false,
  evolutionApiUrl: '',
  evolutionApiKey: '',
  evolutionPhone: '',
  evolutionVerified: false,
  handoffMode: 'none',
  handoffPhone: '',
  handoffWhatsapp: '',
  calendarMode: 'none',
  calendarSlotMinutes: 60,
  googleCalendarConnected: false,
}

export default function WizardPage() {
  const [step, setStep] = useState(() => loadDraft()?.step ?? 1)
  const [data, setData] = useState<WizardData>(() => {
    const saved = loadDraft()?.data
    return saved ? { ...EMPTY, ...saved } : EMPTY
  })
  const [saving, setSaving] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, data }))
  }, [step, data])

  // Pre-fill WhatsApp state if tenant already has it configured (e.g. Meta login)
  useEffect(() => {
    tenantApi.getMe().then(tenant => {
      if (tenant.whatsappChannelEnabled && !data.whatsappVerified) {
        update({ whatsappEnabled: true, whatsappVerified: true })
      }
    }).catch(() => {})
  }, [])

  const update = (partial: Partial<WizardData>) => setData(d => ({ ...d, ...partial }))

  const next = async () => {
    if (step === 3) {
      const unsaved = data.knowledgeItems.filter(item => !item._saved)
      if (unsaved.length > 0) {
        try {
          await Promise.all(unsaved.map(item => knowledgeApi.create({ title: item.title, content: item.content })))
          update({ knowledgeItems: data.knowledgeItems.map(item => ({ ...item, _saved: true })) })
        } catch (e) {
          console.warn('Failed to save knowledge items:', e)
        }
      }
    }
    setStep(s => Math.min(s + 1, 6))
  }
  const back = () => setStep(s => Math.max(s - 1, 1))

  const finish = async () => {
    setSaving(true)
    try {
      await agentApi.upsertConfig({
        agentName: data.agentName,
        greetingMessage: data.greetingMessage,
        systemPrompt: data.systemPrompt,
        tone: data.tone,
        language: data.language,
        handoffMode: data.handoffMode,
        handoffPhone: data.handoffPhone,
        handoffWhatsapp: data.handoffWhatsapp,
        calendarMode: data.calendarMode,
        templateCategory: data.templateCategory || 'custom',
        isActive: true,
      })

      const unsavedItems = data.knowledgeItems.filter(item => !item._saved)
      if (unsavedItems.length > 0) {
        await Promise.allSettled(unsavedItems.map(item => knowledgeApi.create({ title: item.title, content: item.content })))
      }

      if (data.calendarMode === 'builtin') {
        await calendarApi.setupBuiltin(data.calendarSlotMinutes)
      }

      if (data.phoneEnabled && data.phoneNumberSid) {
        await phoneApi.assign(data.phoneNumberSid)
        try {
          await phoneApi.createElevenLabsAgent()
        } catch (e) {
          console.warn('ElevenLabs agent creation skipped:', e)
        }
      }

      if (data.whatsappEnabled && data.whatsappVerified && data.metaPhoneNumberId && data.metaAccessToken) {
        try {
          await whatsappApi.setupCloudApi(data.metaPhoneNumberId, data.metaAccessToken)
        } catch (e) {
          console.warn('WhatsApp Cloud API setup skipped:', e)
        }
      }

      // Generate and persist tips — fire and forget, don't block navigation
      agentApi.generateTips(data.systemPrompt, data.agentName || '', data.templateCategory || 'custom').catch(() => {})

      localStorage.removeItem(DRAFT_KEY)
      navigate('/app/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const stepProps = { data, update, onNext: next, onBack: back }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Phone className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-white">Configurar seu AI Receptionist</span>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    s.id < step ? 'bg-accent text-gray-900' :
                    s.id === step ? 'bg-primary text-white' :
                    'bg-gray-800 text-gray-500'
                  }`}>
                    {s.id < step ? <CheckCircle className="h-4 w-4" /> : s.id}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-medium ${s.id === step ? 'text-white' : 'text-gray-500'}`}>{s.title}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-8 ${s.id < step ? 'bg-accent' : 'bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {step === 1 && <StepTemplate {...stepProps} />}
        {step === 2 && <StepPersonalize {...stepProps} />}
        {step === 3 && <StepKnowledge {...stepProps} />}
        {step === 4 && <StepChannels {...stepProps} onOpenSupport={() => setChatOpen(true)} />}
        {step === 5 && <StepHandoff {...stepProps} />}
        {step === 6 && <StepActivate {...stepProps} onFinish={finish} saving={saving} />}
      </div>

      <SupportChat currentStep={step} open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  )
}
