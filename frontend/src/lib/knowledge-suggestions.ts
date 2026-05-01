export interface DocumentSuggestion {
  title: string
  description: string
  example: string
  icon: string
}

export const SUGGESTIONS_BY_CATEGORY: Record<string, DocumentSuggestion[]> = {
  clinic: [
    { icon: '🕐', title: 'Horários de Funcionamento', description: 'Dias e horários de atendimento, incluindo feriados', example: 'Segunda a sexta: 7h às 19h. Sábados: 8h às 12h. Feriados: fechado.' },
    { icon: '👩‍⚕️', title: 'Especialidades e Médicos', description: 'Lista de especialidades disponíveis e nomes dos médicos', example: 'Cardiologia — Dr. João Silva (3ª e 5ª). Dermatologia — Dra. Ana Costa (2ª e 4ª).' },
    { icon: '💳', title: 'Convênios Aceitos', description: 'Planos de saúde e convênios aceitos', example: 'Aceitamos: Unimed, Amil, Bradesco Saúde, SulAmérica, Hapvida e particular.' },
    { icon: '📋', title: 'Como Agendar', description: 'Processo de agendamento e documentos necessários', example: 'Para agendar: nome completo, CPF, convênio e carteirinha. Trazer RG e cartão do convênio.' },
    { icon: '🧪', title: 'Preparo para Exames', description: 'Instruções de preparo para exames comuns', example: 'Hemograma: jejum de 4h. Glicemia em jejum: 8h sem comer.' },
    { icon: '📍', title: 'Endereço e Estacionamento', description: 'Localização e como chegar', example: 'Rua das Flores, 123 — 2º andar. Estacionamento gratuito por 2h no Shopping ao lado.' },
    { icon: '🚨', title: 'Urgências e Emergências', description: 'O que fazer em casos de urgência', example: 'Para emergências, ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo. Não realizamos atendimentos de urgência.' },
  ],
  restaurant: [
    { icon: '🍽️', title: 'Cardápio Principal', description: 'Pratos disponíveis com preços', example: 'Frango grelhado: R$32. Filé à parmegiana: R$45. Salada Caesar: R$28.' },
    { icon: '🕐', title: 'Horários de Funcionamento', description: 'Dias e horários de atendimento', example: 'Terça a domingo, 11h às 23h. Segunda-feira fechado. Delivery até as 22h30.' },
    { icon: '🛵', title: 'Informações de Delivery', description: 'Área de entrega, taxas e tempo', example: 'Entregamos em até 45min. Taxa: R$5 até 3km, R$8 até 6km. Pedido mínimo: R$40.' },
    { icon: '🥗', title: 'Opções Especiais', description: 'Pratos vegetarianos, veganos, sem glúten, etc.', example: 'Temos opções vegetarianas e veganas. Avise sobre alergias ao fazer o pedido.' },
    { icon: '🍷', title: 'Bebidas e Sobremesas', description: 'Carta de bebidas e sobremesas', example: 'Sucos naturais: R$12. Refrigerante: R$8. Petit gateau: R$22.' },
    { icon: '🎉', title: 'Reservas e Eventos', description: 'Como fazer reservas e eventos privados', example: 'Reservas pelo WhatsApp com 2h de antecedência. Espaço para eventos com até 80 pessoas.' },
    { icon: '💳', title: 'Formas de Pagamento', description: 'Métodos de pagamento aceitos', example: 'Aceitamos Pix, cartão de crédito/débito e dinheiro. Não aceitamos cheque.' },
  ],
  retail: [
    { icon: '🛍️', title: 'Produtos e Categorias', description: 'O que você vende e principais categorias', example: 'Trabalhamos com eletrônicos, eletrodomésticos e informática das melhores marcas.' },
    { icon: '🕐', title: 'Horários de Funcionamento', description: 'Dias e horários da loja', example: 'Segunda a sábado: 9h às 18h. Domingo: 10h às 14h.' },
    { icon: '🔄', title: 'Política de Trocas e Devoluções', description: 'Regras para troca e devolução', example: 'Trocas em até 7 dias com nota fiscal. Produtos com defeito: 90 dias de garantia.' },
    { icon: '💳', title: 'Formas de Pagamento e Parcelamento', description: 'Pagamentos aceitos e parcelamento disponível', example: 'Parcelamos em até 12x sem juros no cartão. Pix com 5% de desconto à vista.' },
    { icon: '🚚', title: 'Entrega e Frete', description: 'Opções de entrega e prazos', example: 'Entrega em todo Brasil. Frete grátis acima de R$299. Prazo: 3-7 dias úteis.' },
    { icon: '🏷️', title: 'Promoções Vigentes', description: 'Ofertas e promoções atuais', example: 'Liquidação de verão: até 40% off em climatizadores. Válido até 31/01.' },
  ],
  services: [
    { icon: '✂️', title: 'Serviços Disponíveis e Preços', description: 'Lista de serviços com valores', example: 'Corte masculino: R$35. Barba: R$25. Combo corte + barba: R$55.' },
    { icon: '🕐', title: 'Horários de Funcionamento', description: 'Dias e horários de atendimento', example: 'Segunda a sábado: 8h às 20h. Domingo: 9h às 14h.' },
    { icon: '📅', title: 'Agendamento', description: 'Como agendar e cancelar', example: 'Agendamentos pelo WhatsApp ou telefone. Cancelamentos com mínimo 2h de antecedência.' },
    { icon: '👤', title: 'Profissionais', description: 'Equipe disponível e especialidades', example: 'Carlos — especialista em coloração. Marina — depilação e estética.' },
    { icon: '📍', title: 'Localização', description: 'Endereço e como chegar', example: 'Av. Paulista, 1500 — sala 42. Metrô Trianon-MASP (5 min a pé). Sem estacionamento próprio.' },
    { icon: '💳', title: 'Pagamentos', description: 'Formas de pagamento aceitas', example: 'Aceitamos Pix, dinheiro e cartão de débito/crédito. Sem parcelamento.' },
  ],
  real_estate: [
    { icon: '🏠', title: 'Tipos de Imóveis', description: 'Imóveis disponíveis para venda e locação', example: 'Trabalhamos com apartamentos, casas e terrenos para venda e aluguel na Zona Sul.' },
    { icon: '📋', title: 'Documentação Necessária', description: 'Documentos para locação ou compra', example: 'Locação: RG, CPF, comprovante de renda 3x o aluguel e 1 fiador. Compra: verificar financiamento.' },
    { icon: '💰', title: 'Faixa de Preços', description: 'Valores médios praticados', example: 'Aluguéis: R$1.200 a R$4.500. Vendas: R$280mil a R$1,2mi. Consulte disponibilidade.' },
    { icon: '🔑', title: 'Processo de Locação', description: 'Como funciona o processo para alugar', example: 'Análise de crédito em 24h. Vistoria, assinatura e entrega das chaves em até 5 dias.' },
    { icon: '🏘️', title: 'Bairros Atendidos', description: 'Regiões onde atua', example: 'Atuamos nos bairros: Moema, Vila Mariana, Brooklin, Campo Belo e Jabaquara.' },
    { icon: '📞', title: 'Plantão e Visitas', description: 'Horários para visitas e contato', example: 'Visitas de segunda a sábado das 8h às 18h. Plantão aos domingos para urgências.' },
  ],
  education: [
    { icon: '📚', title: 'Cursos Disponíveis', description: 'Cursos e turmas com horários', example: 'Inglês: básico, intermediário e avançado. Turmas: manhã, tarde e noite. Início das matrículas em fev.' },
    { icon: '💰', title: 'Mensalidades e Formas de Pagamento', description: 'Valores e condições', example: 'Mensalidade: R$280/mês. Boleto ou Pix. Desconto de 10% para irmãos.' },
    { icon: '📅', title: 'Calendário e Horários', description: 'Grade de aulas e calendário', example: 'Aulas de 2ª a 6ª. Provas no último sábado de cada mês. Recesso em julho e dezembro.' },
    { icon: '📝', title: 'Processo de Matrícula', description: 'Como realizar a matrícula', example: 'Documentos: RG, CPF, comprovante de residência e foto 3x4. Taxa de matrícula: R$120.' },
    { icon: '🎓', title: 'Metodologia', description: 'Como funciona o ensino', example: 'Turmas de no máximo 10 alunos. Material incluso. Aulas práticas em laboratório.' },
    { icon: '🏫', title: 'Estrutura e Infraestrutura', description: 'Instalações disponíveis', example: 'Salas climatizadas, Wi-Fi, biblioteca digital e área de descanso. Estacionamento gratuito.' },
  ],
  custom: [
    { icon: '📌', title: 'Sobre o Negócio', description: 'Descrição geral do que você faz', example: 'Somos uma empresa especializada em... Atendemos... Nosso diferencial é...' },
    { icon: '🕐', title: 'Horários de Funcionamento', description: 'Quando você atende', example: 'Segunda a sexta: 8h às 18h. Sábado: 8h às 12h.' },
    { icon: '💰', title: 'Preços e Serviços', description: 'O que você oferece e quanto custa', example: 'Serviço A: R$X. Serviço B: R$Y. Pacotes disponíveis.' },
    { icon: '📍', title: 'Localização e Contato', description: 'Onde você está e como te encontrar', example: 'Endereço, referências, como chegar.' },
    { icon: '💳', title: 'Formas de Pagamento', description: 'Como os clientes podem pagar', example: 'Aceitamos Pix, cartão e dinheiro.' },
    { icon: '❓', title: 'Perguntas Frequentes', description: 'As dúvidas mais comuns dos seus clientes', example: 'Pergunta: ... Resposta: ... Pergunta: ... Resposta: ...' },
  ],
}

export function getSuggestions(category: string): DocumentSuggestion[] {
  return SUGGESTIONS_BY_CATEGORY[category] || SUGGESTIONS_BY_CATEGORY['custom']
}
