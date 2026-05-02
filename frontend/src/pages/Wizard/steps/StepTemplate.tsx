import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { templatesApi } from '@/lib/api'
import { CheckCircle2, ArrowLeft, Bot, MessageSquare, Calendar, ShoppingCart, Building2, GraduationCap, Wrench } from 'lucide-react'
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

const CATEGORY_ICONS: Record<string, any> = {
  clinic: Calendar,
  restaurant: ShoppingCart,
  retail: Building2,
  services: Wrench,
  real_estate: Building2,
  education: GraduationCap,
  custom: Bot,
}

const TEMPLATE_DETAILS: Record<string, { features: string[]; example: string; howItWorks: string }> = {
  clinic: {
    features: [
      'Agenda consultas automaticamente com data e hora',
      'Informa especialidades disponíveis e médicos',
      'Verifica convênios e planos de saúde',
      'Envia lembretes de consulta',
      'Cancela ou reagenda horários',
    ],
    example: 'Paciente: "Quero marcar com o cardiologista"\nSofia: "Temos cardiologia disponível terça às 14h ou quarta às 10h. Qual prefere?"',
    howItWorks: 'A Sofia entende pedidos de agendamento, verifica a disponibilidade na sua agenda e confirma automaticamente. Se o paciente perguntar sobre especialidades ou convênios, ela responde com base nas informações cadastradas.',
  },
  restaurant: {
    features: [
      'Mostra o cardápio completo com preços',
      'Aceita pedidos para delivery ou retirada',
      'Informa horários de funcionamento',
      'Faz reservas de mesa',
      'Indica pratos do dia e promoções',
    ],
    example: 'Cliente: "Quero uma pizza margherita e uma coca"\nBia: "Pizza margherita R$39,90 + Coca 2L R$12,90 = R$52,80. Delivery ou retirada?"',
    howItWorks: 'A Bia conhece todo o seu cardápio e preços. Ela monta o pedido, calcula o total e pergunta se é delivery ou retirada. Para reservas, ela verifica disponibilidade e confirma na hora.',
  },
  retail: {
    features: [
      'Informa preços e disponibilidade de produtos',
      'Consulta estoque em tempo real',
      'Envia fotos e detalhes dos produtos',
      'Processa encomendas e pedidos',
      'Informa prazos de entrega e formas de pagamento',
    ],
    example: 'Cliente: "Vocês têm tênis Nike Air Max?"\nCarlos: "Temos! Tamanhos 39 a 44, R$599,90. Quer que reserve para você?"',
    howItWorks: 'O Carlos conhece seu catálogo de produtos e preços. Ele responde sobre disponibilidade, ajuda o cliente a encontrar o produto certo e pode registrar encomendas. Se não souber algo, transfere para um atendente.',
  },
  services: {
    features: [
      'Agenda serviços e visitas técnicas',
      'Informa preços e prazos de execução',
      'Tira dúvidas sobre tipos de serviço',
      'Envia orçamentos estimados',
      'Confirma agendamentos por WhatsApp',
    ],
    example: 'Cliente: "Preciso de um encanador"\nAssistente: "Temos disponibilidade amanhã às 9h ou 14h. Qual horário funciona melhor?"',
    howItWorks: 'O assistente entende o tipo de serviço solicitado, verifica disponibilidade na agenda e agenda automaticamente. Para orçamentos, ele coleta as informações necessárias e envia uma estimativa.',
  },
  real_estate: {
    features: [
      'Apresenta imóveis disponíveis com detalhes',
      'Filtra por região, preço e tipo',
      'Agenda visitas presenciais',
      'Informa documentação necessária',
      'Tira dúvidas sobre financiamento',
    ],
    example: 'Cliente: "Procuro apartamento de 2 quartos em São Paulo"\nAssistente: "Tenho 3 opções entre R$350k e R$500k. Quer agendar uma visita?"',
    howItWorks: 'O assistente conhece seu portfólio de imóveis e ajuda o cliente a encontrar o que procura. Ele filtra por região, preço e tipo, e agenda visitas quando o cliente demonstra interesse.',
  },
  education: {
    features: [
      'Informa cursos e grade curricular',
      'Tira dúvidas sobre matrícula e documentos',
      'Informa valores e formas de pagamento',
      'Agenda visitas ou aulas experimentais',
      'Envia material informativo',
    ],
    example: 'Cliente: "Quero saber sobre o curso de Inglês"\nAssistente: "Temos Inglês para adultos, R$450/mês. Aulas 2x por semana. Quer agendar uma aula experimental?"',
    howItWorks: 'O assistente conhece todos os cursos, valores e processos de matrícula. Ele responde dúvidas, envia informações detalhadas e agenda aulas experimentais para novos alunos.',
  },
}

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onNext: () => void
}

export function StepTemplate({ data, update, onNext }: Props) {
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['templates'], queryFn: templatesApi.list })
  const [detailId, setDetailId] = useState<string | null>(null)

  const detailTemplate = detailId ? templates.find((t: any) => t.id === detailId) : null

  const selectTemplate = (t: any) => {
    update({
      templateId: t.id,
      templateCategory: t.category,
      agentName: t.agentName,
      greetingMessage: t.greetingMessage,
      systemPrompt: t.systemPrompt,
      knowledgeItems: t.sampleKnowledge || [],
    })
  }

  const confirmAndAdvance = (t: any) => {
    selectTemplate(t)
    onNext()
  }

  const skipTemplate = () => {
    update({ templateId: 'custom', templateCategory: 'custom', agentName: 'Assistente', greetingMessage: 'Olá! Como posso ajudar?' })
    onNext()
  }

  // Detail view when a template is selected for preview
  if (detailTemplate) {
    const details = TEMPLATE_DETAILS[detailTemplate.category] || TEMPLATE_DETAILS.clinic
    const Icon = CATEGORY_ICONS[detailTemplate.category] || Bot

    return (
      <div>
        <button
          onClick={() => setDetailId(null)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para templates
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main detail panel */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{detailTemplate.name}</h3>
                  <span className="text-xs text-primary">{CATEGORY_LABELS[detailTemplate.category] || detailTemplate.category}</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Como o {detailTemplate.agentName} funciona
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">{details.howItWorks}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  O que ele faz
                </h4>
                <ul className="space-y-2">
                  {details.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Exemplo de conversa
                </h4>
                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">{details.example}</pre>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => confirmAndAdvance(detailTemplate)}
                  className="btn-primary px-6 py-2.5 text-sm font-semibold"
                >
                  Usar este template
                </button>
                <span className="text-xs text-gray-500">Agente: <span className="text-gray-300">{detailTemplate.agentName}</span></span>
              </div>
            </div>
          </div>

          {/* Sidebar — other templates */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Outros templates</h4>
            {templates.map((t: any) => {
              const TIcon = CATEGORY_ICONS[t.category] || Bot
              const isActive = t.id === detailTemplate.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    selectTemplate(t)
                    setDetailId(t.id)
                  }}
                  className={`w-full card p-4 text-left transition-all ${isActive ? 'border-primary ring-1 ring-primary' : 'hover:border-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-gray-700'}`}>
                      <TIcon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h5 className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>{t.name}</h5>
                      <p className="text-xs text-gray-500">{t.agentName}</p>
                    </div>
                    {isActive && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                </button>
              )
            })}

            <button
              onClick={skipTemplate}
              className="w-full card p-4 text-left hover:border-gray-600 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-300">Personalizado</h5>
                  <p className="text-xs text-gray-500">Sem template, configurar do zero</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Grid view (initial state)
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
          {templates.map((t: any) => {
            const Icon = CATEGORY_ICONS[t.category] || Bot
            return (
              <button
                key={t.id}
                onClick={() => {
                  selectTemplate(t)
                  setDetailId(t.id)
                }}
                className={`card p-5 text-left hover:border-primary/60 transition-all ${data.templateId === t.id ? 'border-primary ring-1 ring-primary' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  {data.templateId === t.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <h3 className="font-semibold text-white mb-1">{t.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{t.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Agente: <span className="text-gray-300">{t.agentName}</span></span>
                  <span className="text-xs text-primary/80">Ver detalhes →</span>
                </div>
              </button>
            )
          })}
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
