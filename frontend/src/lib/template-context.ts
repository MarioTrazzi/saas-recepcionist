export interface TemplateContext {
  label: string
  agentNamePlaceholder: string
  greetingPlaceholder: string
  systemPromptPlaceholder: string
  manualKnowledgePlaceholder: { title: string; content: string }
  defaultSlotMinutes: number
  handoffHint: string
}

const CONTEXT: Record<string, TemplateContext> = {
  clinic: {
    label: 'Saúde',
    agentNamePlaceholder: 'Ex: Sofia, Mariana, Lucas…',
    greetingPlaceholder: 'Ex: Olá! Sou a Sofia da clínica. Como posso ajudar?',
    systemPromptPlaceholder: 'Ex: Nunca dê diagnóstico. Sempre confirme o convênio antes de agendar. Para emergências, oriente o paciente a procurar o pronto-atendimento.',
    manualKnowledgePlaceholder: {
      title: 'Ex: Convênios Aceitos',
      content: 'Ex: Aceitamos Unimed, Amil, Bradesco Saúde e particular.',
    },
    defaultSlotMinutes: 60,
    handoffHint: 'Quando o paciente pedir orientação médica complexa, urgência ou questionamento sobre tratamento, transfira pra recepção.',
  },
  restaurant: {
    label: 'Alimentação',
    agentNamePlaceholder: 'Ex: Bia, Pedro, Lia…',
    greetingPlaceholder: 'Ex: Oi! Aqui é a Bia do restaurante. Quer ver nosso cardápio ou fazer um pedido?',
    systemPromptPlaceholder: 'Ex: Sempre confirme o pedido (itens, total, forma de pagamento, endereço) antes de fechar. Avise sobre tempo de entrega.',
    manualKnowledgePlaceholder: {
      title: 'Ex: Cardápio do Dia',
      content: 'Ex: Hoje temos: prato executivo R$32, salada Caesar R$28, suco natural R$12.',
    },
    defaultSlotMinutes: 30,
    handoffHint: 'Quando o pedido for muito complexo, houver problema com entrega ou reclamação séria, transfira pra um atendente.',
  },
  salon: {
    label: 'Estética e Beleza',
    agentNamePlaceholder: 'Ex: Lara, Carla, Bruna…',
    greetingPlaceholder: 'Ex: Oi! Aqui é a Lara do salão. Quer agendar algum serviço?',
    systemPromptPlaceholder: 'Ex: Sempre confirme profissional, dia, hora e valor total antes de fechar o agendamento. Indique combos quando o cliente pedir mais de um serviço.',
    manualKnowledgePlaceholder: {
      title: 'Ex: Tabela de Serviços',
      content: 'Ex: Corte feminino R$80. Escova R$45. Coloração a partir de R$180. Manicure R$35.',
    },
    defaultSlotMinutes: 45,
    handoffHint: 'Quando o cliente pedir um serviço muito específico, reagendamento de última hora ou reclamação, transfira pra recepção.',
  },
  services: {
    label: 'Serviços Técnicos',
    agentNamePlaceholder: 'Ex: Carlos, Roberto, Felipe…',
    greetingPlaceholder: 'Ex: Olá! Sou o Carlos da equipe técnica. Me conta o que está acontecendo.',
    systemPromptPlaceholder: 'Ex: Sempre confirme endereço completo e melhor horário. Não dê orçamento fechado sem o técnico ver no local — ofereça uma faixa.',
    manualKnowledgePlaceholder: {
      title: 'Ex: Faixa de Preços',
      content: 'Ex: Vazamento de torneira: R$80–150. Instalação de chuveiro: R$120–200.',
    },
    defaultSlotMinutes: 120,
    handoffHint: 'Quando o cliente descrever um problema fora do escopo, urgência ou pedir orçamento detalhado, transfira pra um técnico.',
  },
  real_estate: {
    label: 'Imóveis',
    agentNamePlaceholder: 'Ex: Ana, Pedro, Bruna…',
    greetingPlaceholder: 'Ex: Olá! Sou a Ana da imobiliária. Está procurando para comprar, alugar ou vender?',
    systemPromptPlaceholder: 'Ex: Quando o cliente demonstrar interesse, peça nome e telefone para um corretor entrar em contato. Não combine valores ou condições sem aprovação.',
    manualKnowledgePlaceholder: {
      title: 'Ex: Bairros Atendidos',
      content: 'Ex: Atuamos em Moema, Vila Mariana, Brooklin e Campo Belo. Imóveis comerciais sob consulta.',
    },
    defaultSlotMinutes: 60,
    handoffHint: 'Quando o cliente fechar interesse em um imóvel ou pedir documentação detalhada, transfira pro corretor responsável.',
  },
  education: {
    label: 'Educação',
    agentNamePlaceholder: 'Ex: Edu, Julia, Marcos…',
    greetingPlaceholder: 'Ex: Olá! Aqui é o Edu da escola. Quer saber sobre algum curso ou agendar uma aula experimental?',
    systemPromptPlaceholder: 'Ex: Sempre oferecer aula experimental gratuita. Não prometer descontos ou bolsas não autorizadas.',
    manualKnowledgePlaceholder: {
      title: 'Ex: Cursos e Mensalidades',
      content: 'Ex: Inglês básico R$280/mês. Programação iniciante R$520/mês. Aula experimental gratuita.',
    },
    defaultSlotMinutes: 60,
    handoffHint: 'Quando o aluno tiver dúvida específica sobre matrícula, bolsa ou plano financeiro, transfira pra secretaria.',
  },
  retail: {
    label: 'Comércio',
    agentNamePlaceholder: 'Ex: Felipe, Lia, Gabriel…',
    greetingPlaceholder: 'Ex: Olá! Sou o Felipe da loja. Posso te ajudar a encontrar um produto?',
    systemPromptPlaceholder: 'Ex: Sempre informar prazo de entrega antes de fechar. Não inventar disponibilidade sem confirmar estoque.',
    manualKnowledgePlaceholder: {
      title: 'Ex: Política de Trocas',
      content: 'Ex: Trocas em até 7 dias com nota fiscal. Produtos com defeito têm garantia de 90 dias.',
    },
    defaultSlotMinutes: 30,
    handoffHint: 'Quando o cliente quiser negociar preço, fechar pedido grande ou tiver problema com entrega, transfira pro vendedor.',
  },
  custom: {
    label: 'Personalizado',
    agentNamePlaceholder: 'Ex: Assistente, Lia, Pixel…',
    greetingPlaceholder: 'Ex: Olá! Como posso ajudar?',
    systemPromptPlaceholder: 'Ex: instruções específicas pro seu caso de uso — o que fazer, o que não fazer, quando escalar.',
    manualKnowledgePlaceholder: {
      title: 'Ex: Sobre o negócio',
      content: 'Ex: descreva aqui o que você faz, horários, preços, etc.',
    },
    defaultSlotMinutes: 60,
    handoffHint: 'Quando a conversa fugir do escopo do agente ou o cliente pedir explicitamente para falar com alguém, transfira.',
  },
}

export function getTemplateContext(category: string | null | undefined): TemplateContext {
  return CONTEXT[category || 'custom'] || CONTEXT.custom
}
