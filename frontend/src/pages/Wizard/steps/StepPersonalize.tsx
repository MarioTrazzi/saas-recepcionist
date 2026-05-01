import { ChevronRight, ChevronLeft } from 'lucide-react'
import { WizardData } from '../index'

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Personalize seu agente</h2>
      <p className="text-gray-400 mb-8">Defina como seu assistente virtual vai se apresentar.</p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Nome do agente</label>
          <input
            className="input"
            value={data.agentName}
            onChange={e => update({ agentName: e.target.value })}
            placeholder="Ex: Sofia, Carlos, Ana..."
          />
          <p className="text-xs text-gray-500 mt-1">Esse é o nome que o agente usará para se apresentar</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Mensagem de boas-vindas</label>
          <input
            className="input"
            value={data.greetingMessage}
            onChange={e => update({ greetingMessage: e.target.value })}
            placeholder="Ex: Olá! Sou a Sofia da Clínica Saúde. Como posso ajudar?"
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
            placeholder="Ex: Nunca dê diagnósticos médicos. Sempre ofereça agendar uma consulta. Não fale sobre concorrentes."
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
