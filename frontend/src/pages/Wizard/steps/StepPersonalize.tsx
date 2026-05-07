import { ChevronRight, ChevronLeft, Tag } from 'lucide-react'
import { WizardData } from '../index'
import { getTemplateContext } from '@/lib/template-context'

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

const TONES = [
  { value: 'friendly', label: 'Amigável', desc: 'Caloroso e acessível' },
  { value: 'professional', label: 'Profissional', desc: 'Objetivo e eficiente' },
  { value: 'formal', label: 'Formal', desc: 'Respeitoso e cerimonioso' },
]

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es', label: 'Español' },
]

export function StepPersonalize({ data, update, onNext, onBack }: Props) {
  const canContinue = data.agentName.trim() && data.greetingMessage.trim()
  const ctx = getTemplateContext(data.templateCategory)

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-white">Personalize seu agente</h2>
        {data.templateCategory && (
          <span className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
            <Tag className="h-3 w-3" /> Template: {ctx.label}
          </span>
        )}
      </div>
      <p className="text-gray-400 mb-8">Defina como seu assistente virtual vai se apresentar.</p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Nome do agente</label>
          <input
            className="input"
            value={data.agentName}
            onChange={e => update({ agentName: e.target.value })}
            placeholder={ctx.agentNamePlaceholder}
          />
          <p className="text-xs text-gray-500 mt-1">Esse é o nome que o agente usará para se apresentar</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-3">Voz do agente</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update({ agentGender: 'female' })}
              className={`card p-4 text-left transition-all ${data.agentGender === 'female' ? 'border-primary ring-1 ring-primary' : 'hover:border-gray-700'}`}
            >
              <p className="font-medium text-sm text-white mb-0.5">Feminina</p>
              <p className="text-xs text-gray-400">Voz padrão: Fabi (PT-BR)</p>
            </button>
            <button
              type="button"
              onClick={() => update({ agentGender: 'male' })}
              className={`card p-4 text-left transition-all ${data.agentGender === 'male' ? 'border-primary ring-1 ring-primary' : 'hover:border-gray-700'}`}
            >
              <p className="font-medium text-sm text-white mb-0.5">Masculina</p>
              <p className="text-xs text-gray-400">Voz padrão: Eliel (PT-BR)</p>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Você pode trocar a voz específica depois nas configurações.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Mensagem de boas-vindas</label>
          <input
            className="input"
            value={data.greetingMessage}
            onChange={e => update({ greetingMessage: e.target.value })}
            placeholder={ctx.greetingPlaceholder}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-3">Tom de voz</label>
          <div className="grid grid-cols-3 gap-3">
            {TONES.map(t => (
              <button
                key={t.value}
                onClick={() => update({ tone: t.value })}
                className={`card p-4 text-left transition-all ${data.tone === t.value ? 'border-primary ring-1 ring-primary' : 'hover:border-gray-700'}`}
              >
                <p className="font-medium text-sm text-white mb-0.5">{t.label}</p>
                <p className="text-xs text-gray-400">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Idioma principal</label>
          <select
            className="input"
            value={data.language}
            onChange={e => update({ language: e.target.value })}
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Instruções específicas (opcional)</label>
          <textarea
            className="input min-h-[100px] resize-none"
            value={data.systemPrompt}
            onChange={e => update({ systemPrompt: e.target.value })}
            placeholder={ctx.systemPromptPlaceholder}
          />
          <p className="text-xs text-gray-500 mt-1">Regras e comportamentos específicos para o seu agente</p>
        </div>
      </div>

      <div className="flex gap-3 mt-10">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <button onClick={onNext} disabled={!canContinue} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          Continuar <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
