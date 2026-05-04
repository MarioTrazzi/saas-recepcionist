export interface AgentTip {
  icon: string
  title: string
  description: string
}

const TIPS_BY_CATEGORY: Record<string, AgentTip[]> = {
  clinic: [
    {
      icon: '🏥',
      title: 'Lista de convênios aceitos',
      description: 'Adicione quais planos de saúde são aceitos para que o agente confirme cobertura antes da consulta, reduzindo ligações desnecessárias.',
    },
    {
      icon: '📋',
      title: 'Preparo para exames',
      description: 'Inclua as orientações de preparo dos exames mais solicitados (jejum, suspensão de medicamentos) para que o agente oriente o paciente sem depender de retorno humano.',
    },
    {
      icon: '📄',
      title: 'Documentos da primeira consulta',
      description: 'Informe quais documentos o paciente precisa trazer (identidade, cartão do plano, pedido médico) para evitar imprevistos no dia.',
    },
    {
      icon: '🩺',
      title: 'Especialidades e suas particularidades',
      description: 'Descreva brevemente o que cada especialidade atende para que o agente direcione o paciente para a consulta certa logo no primeiro contato.',
    },
    {
      icon: '🔒',
      title: 'Política de cancelamento',
      description: 'Adicione o prazo mínimo para cancelar ou remarcar sem penalidade — o agente pode informar isso ativamente ao confirmar agendamentos.',
    },
  ],
  restaurant: [
    {
      icon: '💲',
      title: 'Cardápio com preços',
      description: 'Insira o cardápio completo com valores para que o agente informe preços com precisão e evite a resposta "ligue para saber o valor".',
    },
    {
      icon: '🚀',
      title: 'Especiais do dia ou da semana',
      description: 'Adicione os pratos especiais ou promoções rotativas para que o agente possa sugerir ativamente e aumentar o ticket médio.',
    },
    {
      icon: '🛵',
      title: 'Raio de entrega e taxas',
      description: 'Descreva os bairros atendidos e as taxas de entrega por região para que o agente confirme se o endereço do cliente está na área coberta.',
    },
    {
      icon: '🥗',
      title: 'Opções para restrições alimentares',
      description: 'Liste as opções veganas, sem glúten, sem lactose ou outros — clientes com restrições perguntam muito e a resposta rápida converte.',
    },
    {
      icon: '📅',
      title: 'Política de reservas',
      description: 'Informe a antecedência mínima para reservas, o limite de pessoas por grupo e a política de cancelamento para que o agente gerencie expectativas.',
    },
  ],
  retail: [
    {
      icon: '🛍️',
      title: 'Catálogo com preços e estoque',
      description: 'Insira os produtos mais vendidos com preços atualizados e disponibilidade para que o agente responda sobre valores sem incertezas.',
    },
    {
      icon: '🔄',
      title: 'Política de trocas e devoluções',
      description: 'Descreva os prazos, condições e o processo de troca — é uma das dúvidas mais frequentes e responder bem evita insatisfação.',
    },
    {
      icon: '💳',
      title: 'Formas de pagamento e parcelamento',
      description: 'Informe as bandeiras aceitas e as opções de parcelamento sem juros para que o agente feche vendas sem transferir para atendente.',
    },
    {
      icon: '📦',
      title: 'Prazos e custos de frete',
      description: 'Adicione as opções de envio, prazos por região e o valor mínimo para frete grátis para que o agente informe no momento da intenção de compra.',
    },
    {
      icon: '🏷️',
      title: 'Promoções e condições especiais',
      description: 'Mantenha a base atualizada com promoções vigentes para que o agente possa oferecer ativamente e aumentar a conversão.',
    },
  ],
  services: [
    {
      icon: '💰',
      title: 'Tabela de preços por serviço',
      description: 'Adicione faixas de valores para os serviços mais procurados. Estimativas rápidas aumentam conversão e evitam ligações sem compromisso.',
    },
    {
      icon: '📍',
      title: 'Regiões de atendimento',
      description: 'Descreva claramente as cidades e bairros cobertos para que o agente não confirme visitas fora da área de operação.',
    },
    {
      icon: '⏱️',
      title: 'Prazo médio de execução',
      description: 'Informe o tempo esperado para cada tipo de serviço para que o agente gerencie a expectativa do cliente desde o primeiro contato.',
    },
    {
      icon: '🛡️',
      title: 'Garantia dos serviços',
      description: 'Descreva a política de garantia — prazo e o que está coberto. É um diferencial competitivo que o agente pode usar para fechar visitas.',
    },
    {
      icon: '🚨',
      title: 'Orientações de emergência',
      description: 'Inclua o que o cliente deve fazer enquanto espera o técnico (ex: desligar o disjuntor, fechar o registro) para agregar valor imediato no atendimento.',
    },
  ],
  salon: [
    {
      icon: '💈',
      title: 'Tabela de preços completa',
      description: 'Insira os preços de todos os serviços — cortes, coloração, tratamentos. O agente pode informar valores e já oferecer o agendamento na mesma conversa.',
    },
    {
      icon: '👩‍🎨',
      title: 'Disponibilidade por especialidade',
      description: 'Descreva quais profissionais atendem cada serviço e os dias disponíveis para que o agente agende sem conflitos.',
    },
    {
      icon: '📆',
      title: 'Política de cancelamento',
      description: 'Adicione o prazo mínimo para cancelar sem cobrança — informar isso ao confirmar o agendamento reduz drasticamente as faltas.',
    },
    {
      icon: '✨',
      title: 'Combos e pacotes disponíveis',
      description: 'Liste os pacotes com preços e condições para que o agente possa oferecer combinações e aumentar o valor médio por visita.',
    },
    {
      icon: '🧴',
      title: 'Marcas e produtos utilizados',
      description: 'Informe as marcas dos produtos usados nos serviços para que o agente possa responder clientes com sensibilidade ou preferência de marca.',
    },
  ],
  real_estate: [
    {
      icon: '🏠',
      title: 'Carteira de imóveis disponíveis',
      description: 'Adicione os imóveis com principais características e faixas de preço. O agente pode fazer a triagem inicial e apresentar opções antes da visita.',
    },
    {
      icon: '📋',
      title: 'Documentos para locação e compra',
      description: 'Informe a lista de documentos necessários para cada tipo de transação para que o agente oriente o cliente a se preparar antes da reunião.',
    },
    {
      icon: '🔑',
      title: 'Processo de visita',
      description: 'Descreva como agendar, a duração típica e o que o cliente deve trazer. Isso reduz perguntas redundantes e qualifica melhor o lead.',
    },
    {
      icon: '🎯',
      title: 'Perguntas de qualificação',
      description: 'Adicione critérios de qualificação (orçamento, prazo, preferências) para que o agente filtre leads e o corretor receba contatos já pré-qualificados.',
    },
    {
      icon: '🗺️',
      title: 'Perfil dos bairros de atuação',
      description: 'Descreva infraestrutura, perfil e pontos de destaque de cada região — o agente pode usar isso para ajudar o cliente a escolher a localização ideal.',
    },
  ],
  education: [
    {
      icon: '📚',
      title: 'Grade de cursos com preços e horários',
      description: 'Insira todos os cursos com carga horária, horários disponíveis e valores para que o agente responda dúvidas de matrícula sem transferir para atendente.',
    },
    {
      icon: '📝',
      title: 'Processo de matrícula passo a passo',
      description: 'Descreva o fluxo completo de matrícula, incluindo documentos e prazos, para que o agente guie o interessado do início ao fim.',
    },
    {
      icon: '🎓',
      title: 'Como agendar aula experimental',
      description: 'Adicione o processo de agendamento de aula experimental (trial) — é o principal gatilho de conversão e o agente pode agendar diretamente.',
    },
    {
      icon: '💸',
      title: 'Bolsas, descontos e parcelamento',
      description: 'Informe condições especiais disponíveis para que o agente possa apresentar opções ao cliente quando o preço for a objeção.',
    },
    {
      icon: '🌟',
      title: 'Metodologia e diferenciais',
      description: 'Descreva a metodologia de ensino e os principais diferenciais para que o agente consiga explicar o valor da instituição além do preço.',
    },
  ],
  custom: [],
}

export function getTipsForCategory(category: string): AgentTip[] {
  return TIPS_BY_CATEGORY[category] ?? TIPS_BY_CATEGORY.custom
}

export const CATEGORY_LABELS: Record<string, string> = {
  clinic: 'Clínica',
  restaurant: 'Restaurante',
  retail: 'Loja / Varejo',
  services: 'Serviços Técnicos',
  salon: 'Salão de Beleza',
  real_estate: 'Imóveis',
  education: 'Educação',
  custom: 'Template Personalizado',
}
