import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { templatesApi } from '@/lib/api'
import { CheckCircle2, ArrowLeft, Bot, MessageSquare, Calendar, ShoppingCart, GraduationCap, Wrench, Scissors, Home, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { WizardData } from '../index'

const USE_CASE_EXAMPLES = [
  {
    emoji: '🎮',
    label: 'Streamer / Criador',
    description: 'Sou streamer na Twitch e YouTube. Quero um assistente que avise meus seguidores sobre minha agenda de lives, divulgue sorteios em andamento, responda dúvidas sobre o canal e patrocinadores, e direcione fãs para minhas redes.',
  },
  {
    emoji: '🎤',
    label: 'Organizador de evento',
    description: 'Estou organizando um show de stand-up. Quero um assistente que informe data, local, valor dos ingressos, política de meia-entrada, e ajude com dúvidas comuns sobre o evento.',
  },
  {
    emoji: '💼',
    label: 'Freelancer / Consultor',
    description: 'Sou consultor de marketing digital freelancer. Quero um assistente que receba leads no WhatsApp, qualifique brevemente (qual o problema, orçamento aproximado), e agende uma call de descoberta de 30min comigo na minha agenda.',
  },
  {
    emoji: '🎨',
    label: 'Artista / Comissões',
    description: 'Sou ilustradora e faço comissões. Quero um assistente que dê informações sobre preços por estilo, prazos de entrega, formas de pagamento e fila atual de pedidos.',
  },
  {
    emoji: '🏋️',
    label: 'Personal / Coach',
    description: 'Sou personal trainer. Quero um assistente que tire dúvidas sobre meus pacotes de aula, horários disponíveis, e agende uma aula experimental com novos alunos.',
  },
]

interface GeneratedTemplate {
  agentName: string
  greetingMessage: string
  systemPrompt: string
  sampleKnowledge: Array<{ title: string; content: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  clinic: 'Saúde',
  restaurant: 'Alimentação',
  retail: 'Comércio',
  services: 'Serviços Técnicos',
  salon: 'Estética e Beleza',
  real_estate: 'Imóveis',
  education: 'Educação',
  custom: 'Personalizado',
}

const CATEGORY_ICONS: Record<string, any> = {
  clinic: Calendar,
  restaurant: ShoppingCart,
  retail: ShoppingCart,
  services: Wrench,
  salon: Scissors,
  real_estate: Home,
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
      'Apresenta produtos disponíveis com preços e variações',
      'Consulta estoque e disponibilidade em tempo real',
      'Informa formas de pagamento e parcelamento',
      'Esclarece prazos de entrega e cobertura de frete',
      'Explica política de trocas e devoluções',
    ],
    example: 'Cliente: "Vocês têm tênis Nike Air Max?"\nFelipe: "Temos! Tamanhos 39 a 44, R$599,90. Quer que reserve para você?"',
    howItWorks: 'O Felipe conhece seu catálogo de produtos e preços. Ele responde sobre disponibilidade, ajuda o cliente a escolher o item certo e pode registrar encomendas. Se não souber algo, transfere para um atendente humano.',
  },
  services: {
    features: [
      'Entende o tipo de problema e estima faixa de preço',
      'Agenda visita técnica com base na disponibilidade',
      'Coleta endereço completo e melhor horário',
      'Informa garantia e formas de pagamento',
      'Envia orçamento estimado por WhatsApp',
    ],
    example: 'Cliente: "Meu chuveiro está vazando"\nCarlos: "Vazamento de chuveiro fica entre R$80 e R$150. Tenho amanhã às 9h ou 14h. Qual horário?"',
    howItWorks: 'O Carlos entende o tipo de serviço, estima uma faixa de preço com base no problema descrito e agenda a visita técnica. Para orçamentos detalhados, coleta endereço, fotos e melhor horário para o técnico.',
  },
  salon: {
    features: [
      'Agenda corte, escova, coloração, manicure e estética',
      'Sugere combos quando o cliente pede mais de um serviço',
      'Indica profissional disponível para cada serviço',
      'Confirma horário, valor total e instruções de preparo',
      'Lembra a cliente do horário no dia anterior',
    ],
    example: 'Cliente: "Quero corte e manicure"\nLara: "Corte R$80 + Manicure R$35 = R$115. Amanhã às 10h ou 14h?"',
    howItWorks: 'A Lara conhece a tabela de serviços, preços e duração de cada um. Ela sugere combos, indica o profissional certo e fecha o agendamento com confirmação completa. Acolhedora e próxima, no tom certo de salão.',
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
  const [showCustomBuilder, setShowCustomBuilder] = useState(false)
  const [customDescription, setCustomDescription] = useState('')
  const [generated, setGenerated] = useState<GeneratedTemplate | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

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

  const openCustomBuilder = () => {
    setShowCustomBuilder(true)
    setDetailId(null)
    setGenerated(null)
    setGenError('')
  }

  const closeCustomBuilder = () => {
    setShowCustomBuilder(false)
    setGenerated(null)
    setGenError('')
  }

  const generate = async () => {
    if (!customDescription.trim() || generating) return
    setGenerating(true)
    setGenError('')
    try {
      const result = await templatesApi.generateCustom(customDescription.trim())
      setGenerated(result)
    } catch (e: any) {
      setGenError(e?.response?.data?.message || e.message || 'Não consegui gerar o template agora.')
    } finally {
      setGenerating(false)
    }
  }

  const useGenerated = () => {
    if (!generated) return
    update({
      templateId: 'custom',
      templateCategory: 'custom',
      agentName: generated.agentName,
      greetingMessage: generated.greetingMessage,
      systemPrompt: generated.systemPrompt,
      knowledgeItems: generated.sampleKnowledge,
    })
    onNext()
  }

  // Custom builder view
  if (showCustomBuilder) {
    return (
      <div>
        <button
          onClick={closeCustomBuilder}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para templates
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Personalizado com IA</h2>
            <p className="text-sm text-gray-400">Descreva seu caso de uso e a IA monta o template inteiro pra você.</p>
          </div>
        </div>

        <div className="max-w-3xl mt-8 space-y-6">
          {/* Examples */}
          <div>
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Exemplos — clique para preencher
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {USE_CASE_EXAMPLES.map(ex => (
                <button
                  key={ex.label}
                  onClick={() => { setCustomDescription(ex.description); setGenerated(null); setGenError('') }}
                  className="card p-3 text-left hover:border-primary/60 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ex.emoji}</span>
                    <span className="text-xs font-medium text-gray-200">{ex.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description input */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Descreva o que seu assistente vai fazer
            </label>
            <textarea
              value={customDescription}
              onChange={e => { setCustomDescription(e.target.value); setGenerated(null); setGenError('') }}
              placeholder="Ex: Sou streamer da Twitch e quero um assistente que avise sobre minha agenda de lives, divulgue sorteios e responda dúvidas sobre meus patrocinadores..."
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Quanto mais detalhes você der, melhor o template. Mencione tom de voz, o que NÃO fazer, e tipos de pergunta esperados.
            </p>
          </div>

          {genError && (
            <div className="card border-red-500/25 bg-red-500/5 p-4 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{genError}</p>
            </div>
          )}

          {!generated && (
            <button
              onClick={generate}
              disabled={generating || customDescription.trim().length < 10}
              className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Gerando com IA…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Gerar template com IA</>
              )}
            </button>
          )}

          {/* Generated preview */}
          {generated && (
            <div className="card p-5 border-primary/40 bg-primary/5 space-y-5">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-semibold">Template gerado</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Nome do agente</p>
                <p className="text-lg font-semibold text-white">{generated.agentName}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Mensagem de saudação</p>
                <p className="text-sm text-gray-200 italic">"{generated.greetingMessage}"</p>
              </div>

              <details className="group">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-200 list-none flex items-center gap-1.5">
                  <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
                  Ver instruções do agente (system prompt)
                </summary>
                <pre className="mt-2 text-xs text-gray-300 bg-gray-900/60 border border-gray-700 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                  {generated.systemPrompt}
                </pre>
              </details>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                  Base de conhecimento inicial ({generated.sampleKnowledge.length} itens)
                </p>
                <div className="space-y-2">
                  {generated.sampleKnowledge.map((k, i) => (
                    <div key={i} className="rounded-lg bg-gray-900/60 border border-gray-700 px-3 py-2">
                      <p className="text-xs font-medium text-gray-200">{k.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{k.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={useGenerated} className="btn-primary text-sm py-2 px-5">
                  Usar este template
                </button>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="btn-secondary flex items-center gap-2 text-sm py-2 px-4 disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Gerar de novo
                </button>
                <span className="text-xs text-gray-500 ml-auto">Você pode editar tudo depois</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
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
              onClick={openCustomBuilder}
              className="w-full card p-4 text-left hover:border-primary/60 transition-all border-primary/30 bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-white">Personalizado com IA</h5>
                  <p className="text-xs text-gray-400">A IA monta pra você</p>
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

          {/* AI custom template card — featured */}
          <button
            onClick={openCustomBuilder}
            className="card p-5 text-left transition-all border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 hover:border-primary/70 hover:from-primary/15 relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                Novo
              </span>
            </div>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="font-semibold text-white mb-1">Personalizado com IA</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Não achou seu setor? Descreva o que você faz (streamer, evento, freelancer…) e a IA monta o template inteiro.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Gerado por IA</span>
              <span className="text-xs text-primary font-medium">Criar template →</span>
            </div>
          </button>
        </div>
      )}

      <div className="mt-6">
        <button onClick={skipTemplate} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Pular e configurar tudo manualmente →
        </button>
      </div>
    </div>
  )
}
