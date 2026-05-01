import { useQuery } from '@tanstack/react-query'
import { templatesApi } from '@/lib/api'
import { CheckCircle2 } from 'lucide-react'
import { WizardData } from '../index'

const CATEGORY_LABELS: Record<string, string> = {
  clinic: 'Saúde',
  restaurant: 'Alimentação',
  retail: 'Comércio',
  services: 'Serviços',
  real_estate: 'Imóveis',
  education: 'Educação',
  custom: 'Personalizado',
}

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onNext: () => void
}

export function StepTemplate({ data, update, onNext }: Props) {
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['templates'], queryFn: templatesApi.list })

  const select = async (t: any) => {
    update({
      templateId: t.id,
      templateCategory: t.category,
      agentName: t.agentName,
      greetingMessage: t.greetingMessage,
      systemPrompt: t.systemPrompt,
      knowledgeItems: t.sampleKnowledge || [],
    })
    onNext()
  }

  const skipTemplate = () => {
    update({ templateId: 'custom', templateCategory: 'custom', agentName: 'Assistente', greetingMessage: 'Olá! Como posso ajudar?' })
    onNext()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Qual é o seu tipo de negócio?</h2>
      <p className="text-gray-400 mb-8">Escolha um template para começar mais rápido. Você pode personalizar tudo depois.</p>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {templates.map((t: any) => (
            <button
              key={t.id}
              onClick={() => select(t)}
              className={`card p-5 text-left hover:border-primary/60 transition-all ${data.templateId === t.id ? 'border-primary ring-1 ring-primary' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {CATEGORY_LABELS[t.category] || t.category}
                </span>
                {data.templateId === t.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <h3 className="font-semibold text-white mb-1">{t.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{t.description}</p>
              <p className="text-xs text-gray-500 mt-3">Agente: <span className="text-gray-300">{t.agentName}</span></p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button onClick={skipTemplate} className="text-sm text-gray-400 hover:text-gray-200 underline">
          Começar do zero sem template
        </button>
      </div>
    </div>
  )
}
