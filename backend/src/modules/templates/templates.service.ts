import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import { Template, TemplateCategory } from './entities/template.entity'

export interface GeneratedTemplate {
  agentName: string
  greetingMessage: string
  systemPrompt: string
  sampleKnowledge: Array<{ title: string; content: string }>
}

const SEED_TEMPLATES = [
  {
    category: TemplateCategory.CLINIC,
    name: 'Clínica Médica',
    description: 'Agendamento de consultas, especialidades, convênios e preparo para exames',
    agentName: 'Sofia',
    greetingMessage: 'Olá! Aqui é a Sofia, da clínica. Posso te ajudar com agendamento ou alguma dúvida?',
    systemPrompt: `Você é Sofia, recepcionista virtual de uma clínica médica. Sua missão:
1. Agendar, remarcar ou cancelar consultas com base na agenda disponível
2. Informar especialidades e médicos atendentes
3. Verificar quais convênios são aceitos
4. Orientar sobre preparo para exames (jejum, documentos, etc.)
5. Informar horários de funcionamento e endereço

Seja sempre gentil, empática e profissional. Confirme dados sensíveis (nome completo, CPF) antes de agendar.
Para emergências, oriente o paciente a procurar o pronto-atendimento ou ligar para 192. Nunca dê diagnóstico ou recomendação médica.`,
    sampleKnowledge: [
      { title: 'Horários de Funcionamento', content: 'Segunda a sexta: 7h às 19h. Sábados: 8h às 12h. Feriados: fechado.' },
      { title: 'Especialidades e Médicos', content: 'Cardiologia — Dr. João Silva (3ª e 5ª). Dermatologia — Dra. Ana Costa (2ª e 4ª). Pediatria — Dr. Marcos Lima (segunda a sexta).' },
      { title: 'Convênios Aceitos', content: 'Aceitamos: Unimed, Amil, Bradesco Saúde, SulAmérica, Hapvida, NotreDame e atendimento particular.' },
      { title: 'Como Agendar', content: 'Para agendar preciso do nome completo, CPF e convênio (se houver). Trazer RG e cartão do convênio no dia.' },
      { title: 'Preparo para Exames', content: 'Hemograma: jejum de 4h. Glicemia em jejum: 8h sem comer. Ultrassom abdominal: jejum de 6h e bexiga cheia.' },
      { title: 'Endereço e Estacionamento', content: 'Rua das Flores, 123 — 2º andar. Estacionamento gratuito por 2h no shopping ao lado.' },
      { title: 'Emergências', content: 'Para emergências, ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo. Não realizamos atendimento de urgência.' },
    ],
  },
  {
    category: TemplateCategory.RESTAURANT,
    name: 'Restaurante / Delivery',
    description: 'Cardápio, pedidos, reservas, delivery e formas de pagamento',
    agentName: 'Bia',
    greetingMessage: 'Oi! Aqui é a Bia do restaurante. Posso te ajudar com o cardápio, fazer um pedido ou reservar uma mesa?',
    systemPrompt: `Você é Bia, atendente virtual de um restaurante. Ajude com:
1. Mostrar o cardápio com preços e descrição dos pratos
2. Anotar pedidos (delivery ou retirada), calcular o total e confirmar a forma de pagamento
3. Fazer reservas de mesa, verificando disponibilidade
4. Informar tempo de entrega e área atendida
5. Indicar pratos do dia, promoções e opções vegetarianas/veganas

Seja animada, próxima e use emojis com moderação. Quando o cliente fechar pedido, repita o resumo (itens, total, forma de pagamento, endereço de entrega) antes de confirmar.`,
    sampleKnowledge: [
      { title: 'Cardápio Principal', content: 'Pizza margherita: R$39,90. Pizza calabresa: R$42,90. Frango grelhado: R$32. Filé à parmegiana: R$45. Salada Caesar: R$28.' },
      { title: 'Bebidas e Sobremesas', content: 'Coca 2L: R$12,90. Suco natural 500ml: R$12. Cerveja long neck: R$10. Petit gateau: R$22. Pudim: R$15.' },
      { title: 'Horários e Delivery', content: 'Terça a domingo, 11h às 23h. Segunda fechado. Delivery até 22h30. Tempo médio de entrega: 35-45 minutos.' },
      { title: 'Área de Entrega e Taxas', content: 'Entregamos em até 6km. Taxa: R$5 até 3km, R$8 até 6km. Pedido mínimo: R$40.' },
      { title: 'Reservas', content: 'Reservas via WhatsApp com 2h de antecedência. Espaço para eventos com até 80 pessoas — solicitar com 7 dias de antecedência.' },
      { title: 'Formas de Pagamento', content: 'Pix (com 5% de desconto), cartão de crédito/débito (Visa, Master, Elo), dinheiro. Pix: CNPJ 12.345.678/0001-90.' },
      { title: 'Opções Especiais', content: 'Temos pratos vegetarianos e opções sem glúten. Avise sobre alergias ao fazer o pedido.' },
    ],
  },
  {
    category: TemplateCategory.REAL_ESTATE,
    name: 'Imobiliária',
    description: 'Captação de leads, busca de imóveis, agendamento de visitas e financiamento',
    agentName: 'Ana',
    greetingMessage: 'Olá! Sou a Ana da imobiliária. Está procurando para comprar, alugar ou vender?',
    systemPrompt: `Você é Ana, corretora virtual. Ajude o cliente a:
1. Encontrar imóveis disponíveis filtrando por região, preço, número de quartos e tipo (apartamento, casa, comercial)
2. Apresentar 2-3 opções por vez com detalhes (área, vagas, condomínio, IPTU)
3. Agendar visitas presenciais com base na disponibilidade do corretor responsável
4. Tirar dúvidas sobre documentação para locação ou compra
5. Explicar de forma simples o processo de financiamento e fiador

Quando o cliente demonstrar interesse forte (perguntar sobre visita, financiamento ou disponibilidade), peça nome e telefone para um corretor entrar em contato.`,
    sampleKnowledge: [
      { title: 'Tipos de Imóveis', content: 'Apartamentos, casas e terrenos para venda e aluguel na Zona Sul de São Paulo. Imóveis comerciais sob consulta.' },
      { title: 'Bairros Atendidos', content: 'Moema, Vila Mariana, Brooklin, Campo Belo, Jabaquara, Pinheiros, Itaim Bibi e Vila Olímpia.' },
      { title: 'Faixa de Preços', content: 'Aluguel: R$1.200 a R$8.500/mês. Venda: R$280 mil a R$2,5 milhões. Consulte disponibilidade no portal.' },
      { title: 'Documentação para Locação', content: 'RG, CPF, comprovante de residência, comprovante de renda 3x o aluguel e 1 fiador (ou seguro fiança).' },
      { title: 'Documentação para Compra', content: 'RG, CPF, certidão de casamento (se aplicável), comprovante de renda. Para financiamento, simulação prévia no banco.' },
      { title: 'Processo de Locação', content: 'Análise de crédito em 24h. Vistoria, assinatura do contrato e entrega das chaves em até 5 dias úteis.' },
      { title: 'Visitas e Plantão', content: 'Visitas de segunda a sábado das 8h às 18h. Plantão aos domingos para urgências (apenas com agendamento prévio).' },
    ],
  },
  {
    category: TemplateCategory.SALON,
    name: 'Salão / Estética',
    description: 'Agendamento de serviços de beleza, preços, profissionais e combos',
    agentName: 'Lara',
    greetingMessage: 'Oi! Aqui é a Lara do salão. Quer agendar algum serviço ou saber sobre nossos preços?',
    systemPrompt: `Você é Lara, recepcionista virtual de um salão de beleza/estética. Ajude com:
1. Agendar serviços (corte, escova, coloração, manicure, depilação, estética facial e corporal)
2. Informar preços, duração e profissional disponível para cada serviço
3. Sugerir combos quando o cliente pedir mais de um serviço
4. Indicar horários disponíveis com base na agenda
5. Enviar lembretes de horário e instruções de preparo (ex: chegar 10 min antes para coloração)

Seja acolhedora e próxima. Quando o cliente fechar o agendamento, confirme: serviço, profissional, dia, hora e valor total.`,
    sampleKnowledge: [
      { title: 'Tabela de Preços — Cabelo', content: 'Corte feminino: R$80. Corte masculino: R$50. Escova simples: R$45. Escova progressiva: R$280. Coloração: a partir de R$180.' },
      { title: 'Tabela de Preços — Mãos e Pés', content: 'Manicure: R$35. Pedicure: R$45. Combo manicure + pedicure: R$70. Esmaltação em gel: +R$30.' },
      { title: 'Tabela de Preços — Estética', content: 'Limpeza de pele: R$120. Depilação cera (perna inteira): R$80. Massagem relaxante 60min: R$150. Drenagem linfática: R$130.' },
      { title: 'Combos e Pacotes', content: 'Pacote noiva: maquiagem + cabelo + manicure por R$280. Combo dia da mulher: corte + escova + manicure por R$140.' },
      { title: 'Profissionais', content: 'Patrícia — coloração e cortes femininos. Carla — manicure e pedicure. Marina — depilação e estética facial. Roberto — corte masculino e barba.' },
      { title: 'Horários', content: 'Terça a sábado: 9h às 20h. Domingo: 10h às 16h. Segunda fechado. Atendimento em domicílio com taxa adicional aos sábados.' },
      { title: 'Política de Cancelamento', content: 'Cancelamentos com no mínimo 2h de antecedência. Faltas sem aviso podem ser cobradas em 50% do valor do serviço.' },
      { title: 'Endereço e Pagamentos', content: 'Rua dos Bobos, 0 — Vila Madalena. Aceitamos Pix, dinheiro e cartão. Sem parcelamento abaixo de R$200.' },
    ],
  },
  {
    category: TemplateCategory.SERVICES,
    name: 'Serviços Técnicos',
    description: 'Encanador, eletricista, técnico em geral — agendamento de visitas e orçamentos',
    agentName: 'Carlos',
    greetingMessage: 'Olá! Sou o Carlos, da equipe técnica. Me conta o que está acontecendo que eu agendo a visita.',
    systemPrompt: `Você é Carlos, atendente virtual de uma empresa de serviços técnicos (encanador, eletricista, manutenção). Ajude com:
1. Entender o problema/serviço que o cliente precisa (ex: chuveiro vazando, tomada queimada, ar-condicionado não gela)
2. Estimar uma faixa de preço com base no tipo de serviço
3. Agendar visita técnica com base na disponibilidade dos técnicos
4. Coletar endereço completo e melhor horário para a visita
5. Informar sobre garantia do serviço, formas de pagamento e taxa de visita

Seja direto, prático e profissional. Antes de fechar o agendamento, repita: tipo de serviço, endereço, dia e horário aproximado, faixa de preço estimada.`,
    sampleKnowledge: [
      { title: 'Serviços Oferecidos', content: 'Encanamento (vazamentos, instalação de chuveiro/torneira), elétrica (tomadas, disjuntores, instalação de luminárias), ar-condicionado (instalação e limpeza) e pequenos reparos.' },
      { title: 'Faixa de Preços', content: 'Vazamento de torneira/chuveiro: R$80–150. Instalação de chuveiro elétrico: R$120–200. Troca de disjuntor: R$80–140. Limpeza de ar-condicionado split: R$150–220.' },
      { title: 'Taxa de Visita', content: 'Visita técnica de orçamento: R$80 (descontados do serviço se contratado). Visita de emergência fora do horário: +50%.' },
      { title: 'Horários e Disponibilidade', content: 'Atendimento de segunda a sábado: 8h às 18h. Plantão de emergência 24h (taxa diferenciada). Agendamento em até 48h dependendo da região.' },
      { title: 'Área de Atendimento', content: 'Atendemos toda a Grande São Paulo. Para cidades além de 30km, taxa de deslocamento de R$1,50/km.' },
      { title: 'Garantia', content: '90 dias de garantia em todos os serviços executados. Peças têm garantia do fabricante (geralmente 12 meses).' },
      { title: 'Formas de Pagamento', content: 'Pix (5% desconto), dinheiro, cartão de crédito/débito. Parcelamos serviços acima de R$300 em até 3x sem juros.' },
    ],
  },
  {
    category: TemplateCategory.EDUCATION,
    name: 'Escola / Cursos',
    description: 'Cursos disponíveis, mensalidades, matrícula e aulas experimentais',
    agentName: 'Edu',
    greetingMessage: 'Olá! Aqui é o Edu, da escola. Quer saber sobre algum curso ou agendar uma aula experimental?',
    systemPrompt: `Você é Edu, atendente virtual de uma escola/curso livre. Ajude com:
1. Apresentar cursos disponíveis com nível, carga horária e horários de turmas
2. Informar mensalidades, taxa de matrícula e formas de pagamento
3. Tirar dúvidas sobre processo de matrícula e documentação
4. Agendar aulas experimentais gratuitas
5. Explicar metodologia, materiais inclusos e infraestrutura

Seja claro, paciente e didático. Para alunos interessados em matrícula, peça nome, idade (se for criança) e melhor horário para um consultor entrar em contato.`,
    sampleKnowledge: [
      { title: 'Cursos Disponíveis', content: 'Inglês (básico, intermediário, avançado), espanhol, francês, programação para iniciantes, design gráfico e fotografia digital.' },
      { title: 'Mensalidades', content: 'Idiomas: R$280–450/mês. Programação: R$520/mês. Design: R$390/mês. Aula experimental: gratuita.' },
      { title: 'Turmas e Horários', content: 'Manhã (9h-11h), tarde (14h-16h) e noite (19h-21h). Aulas 2x por semana, 90 minutos cada. Recesso em julho e dezembro.' },
      { title: 'Processo de Matrícula', content: 'Documentos: RG, CPF, comprovante de residência e foto 3x4. Taxa de matrícula: R$120 (parcelável em 2x). Formas de pagamento: boleto, Pix ou cartão.' },
      { title: 'Metodologia', content: 'Turmas de no máximo 10 alunos. Material didático incluso. Aulas práticas com projetos reais. Avaliações mensais.' },
      { title: 'Aulas Experimentais', content: 'Aula experimental 100% gratuita, sem compromisso. Duração 60 minutos. Agendamento via WhatsApp com 24h de antecedência.' },
      { title: 'Estrutura', content: 'Salas climatizadas, Wi-Fi gratuito, biblioteca digital, laboratório de informática e área de descanso. Estacionamento gratuito.' },
    ],
  },
  {
    category: TemplateCategory.RETAIL,
    name: 'Comércio / Loja',
    description: 'Catálogo, preços, estoque, frete e formas de pagamento',
    agentName: 'Felipe',
    greetingMessage: 'Olá! Sou o Felipe, da loja. Posso te ajudar a encontrar um produto ou tirar alguma dúvida?',
    systemPrompt: `Você é Felipe, atendente virtual de uma loja (varejo físico ou e-commerce). Ajude com:
1. Apresentar produtos disponíveis, com preços e variações (cor, tamanho, modelo)
2. Consultar estoque e disponibilidade
3. Informar formas de pagamento, parcelamento e descontos à vista
4. Esclarecer prazos de entrega, frete e área de cobertura
5. Explicar política de trocas e devoluções

Seja consultivo: ajude o cliente a escolher o produto certo. Quando o cliente fechar a compra, confirme o resumo (produto, valor, forma de pagamento, endereço).`,
    sampleKnowledge: [
      { title: 'Categorias de Produtos', content: 'Eletrônicos, eletrodomésticos, informática, telefonia e acessórios. Marcas: Samsung, LG, Apple, Xiaomi, Dell e outras.' },
      { title: 'Horários de Atendimento', content: 'Loja física: segunda a sábado 9h às 18h, domingo 10h às 14h. Atendimento online 24/7 via WhatsApp.' },
      { title: 'Pagamento e Parcelamento', content: 'Pix com 5% de desconto à vista. Cartão em até 12x sem juros (acima de R$300). Boleto à vista com 8% de desconto.' },
      { title: 'Frete e Entrega', content: 'Entrega em todo Brasil. Frete grátis acima de R$299. Prazo: 3-7 dias úteis para capitais; 7-12 dias para interior.' },
      { title: 'Trocas e Devoluções', content: 'Trocas em até 7 dias com nota fiscal. Produtos com defeito: 90 dias de garantia da loja + garantia do fabricante.' },
      { title: 'Promoções Vigentes', content: 'Liquidação de fim de coleção: até 40% off em itens selecionados. Cupom PRIMEIRA10 dá 10% off na primeira compra.' },
      { title: 'Endereço da Loja', content: 'Av. Brasil, 1500 — Centro. Estacionamento conveniado no edifício ao lado (R$5/h).' },
    ],
  },
]

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name)
  private openai: OpenAI | null = null
  private model = 'gpt-4o-mini'

  constructor(
    @InjectRepository(Template) private repo: Repository<Template>,
    private readonly config: ConfigService,
  ) {
    const groqKey = config.get<string>('GROQ_API_KEY')
    const geminiKey = config.get<string>('GEMINI_API_KEY')
    const openaiKey = config.get<string>('OPENAI_API_KEY')

    if (groqKey) {
      this.openai = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' })
      this.model = config.get('GROQ_MODEL') || 'llama-3.3-70b-versatile'
    } else if (geminiKey) {
      this.openai = new OpenAI({ apiKey: geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
      this.model = config.get('GEMINI_MODEL') || 'gemini-2.0-flash'
    } else if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey })
      this.model = config.get('OPENAI_MODEL') || 'gpt-4o-mini'
    }
  }

  async onModuleInit() {
    try {
      for (const seed of SEED_TEMPLATES) {
        const existing = await this.repo.findOne({ where: { category: seed.category } })
        if (existing) {
          await this.repo.update(existing.id, {
            name: seed.name,
            description: seed.description,
            agentName: seed.agentName,
            greetingMessage: seed.greetingMessage,
            systemPrompt: seed.systemPrompt,
            sampleKnowledge: seed.sampleKnowledge,
          })
        } else {
          await this.repo.save(this.repo.create(seed))
        }
      }
      this.logger.log(`Templates synced (${SEED_TEMPLATES.length} canonical entries)`)
    } catch (err) {
      this.logger.warn(`Templates sync skipped: ${err.message}`)
    }
  }

  async listPublic() {
    return this.repo.find({ where: { isPublic: true }, order: { category: 'ASC' } })
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } })
  }

  async generateCustom(description: string): Promise<GeneratedTemplate> {
    if (!this.openai) {
      throw new Error('Nenhuma LLM configurada. Defina GROQ_API_KEY, GEMINI_API_KEY ou OPENAI_API_KEY.')
    }

    const trimmed = description.trim()
    if (trimmed.length < 10) {
      throw new Error('Descreva seu caso de uso com pelo menos algumas palavras (ex: "streamer divulgando agenda de lives e sorteios").')
    }

    const systemPrompt = `Você é um especialista em montar configurações de assistentes virtuais (recepcionistas de IA) que atendem por WhatsApp e telefone.

O usuário vai descrever o que ele precisa que o assistente faça. Sua tarefa é gerar uma configuração completa do agente.

Output: JSON estritamente nesse formato:
{
  "agentName": "<primeiro nome curto em português, criativo, que combine com o caso de uso (ex: Lia, Pixel, Nina, Theo)>",
  "greetingMessage": "<mensagem de saudação em pt-BR, 1-2 frases, amigável, mencionando o nome do agente e a função>",
  "systemPrompt": "<instruções claras para o agente em pt-BR — o que ele faz, o que NÃO faz, tom de voz, quando escalar para humano. Use bullets numerados.>",
  "sampleKnowledge": [
    { "title": "<título curto>", "content": "<conteúdo de exemplo realista, em pt-BR, 1-3 frases>" }
  ]
}

Regras:
- Gere de 4 a 7 itens em sampleKnowledge, cobrindo as informações que clientes mais perguntariam.
- O sampleKnowledge deve ser PLAUSÍVEL e ÚTIL como ponto de partida — o usuário vai editar depois.
- Nunca peça ao usuário dados que não foram fornecidos. Use placeholders genéricos quando precisar (ex: "consulte nosso link na bio").
- Tudo em pt-BR.
- NÃO inclua nada fora do JSON. Sem markdown, sem texto antes ou depois.`

    const userPrompt = `Caso de uso descrito pelo usuário:
"""
${trimmed}
"""

Gere a configuração completa em JSON.`

    try {
      const res = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' } as any,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })

      const raw = res.choices[0]?.message?.content?.trim() || ''
      const parsed = this.parseGenerated(raw)
      return parsed
    } catch (err: any) {
      this.logger.error(`Custom template generation failed: ${err.message}`)
      throw new Error('Não consegui gerar o template agora. Tente reformular a descrição ou tente de novo em instantes.')
    }
  }

  private parseGenerated(raw: string): GeneratedTemplate {
    let json: any
    try {
      json = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('LLM retornou formato inválido')
      json = JSON.parse(match[0])
    }

    if (!json.agentName || typeof json.agentName !== 'string') {
      throw new Error('agentName ausente na resposta da LLM')
    }
    if (!json.greetingMessage || typeof json.greetingMessage !== 'string') {
      throw new Error('greetingMessage ausente na resposta da LLM')
    }
    if (!json.systemPrompt || typeof json.systemPrompt !== 'string') {
      throw new Error('systemPrompt ausente na resposta da LLM')
    }
    const knowledge = Array.isArray(json.sampleKnowledge) ? json.sampleKnowledge : []
    const sampleKnowledge = knowledge
      .filter((k: any) => k && typeof k.title === 'string' && typeof k.content === 'string')
      .slice(0, 8)
      .map((k: any) => ({ title: k.title.trim(), content: k.content.trim() }))

    return {
      agentName: json.agentName.trim().slice(0, 40),
      greetingMessage: json.greetingMessage.trim().slice(0, 300),
      systemPrompt: json.systemPrompt.trim().slice(0, 4000),
      sampleKnowledge,
    }
  }
}
