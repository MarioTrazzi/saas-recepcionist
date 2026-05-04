import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import { AgentConfig } from './entities/agent-config.entity'

@Injectable()
export class AgentService {
  private openai: OpenAI

  constructor(
    @InjectRepository(AgentConfig) private configRepo: Repository<AgentConfig>,
    private configService: ConfigService,
  ) {
    const groqKey = configService.get('GROQ_API_KEY')
    const geminiKey = configService.get('GEMINI_API_KEY')
    const openaiKey = configService.get('OPENAI_API_KEY')

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey })
    } else if (geminiKey) {
      this.openai = new OpenAI({
        apiKey: geminiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      })
    } else if (groqKey) {
      this.openai = new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
      })
    }
  }

  async getConfig(tenantId: string): Promise<AgentConfig> {
    const cfg = await this.configRepo.findOne({ where: { tenantId } })
    if (!cfg) throw new NotFoundException('Agent config not found. Complete the setup wizard first.')
    return cfg
  }

  async upsertConfig(tenantId: string, data: Partial<AgentConfig>): Promise<AgentConfig> {
    let cfg = await this.configRepo.findOne({ where: { tenantId } })
    if (!cfg) {
      cfg = this.configRepo.create({ tenantId, ...data })
    } else {
      Object.assign(cfg, data)
    }
    return this.configRepo.save(cfg)
  }

  async processMessage(tenantId: string, userMessage: string, conversationHistory: Array<{ role: string; content: string }>, knowledgeContext?: string): Promise<string> {
    const cfg = await this.getConfig(tenantId)

    const systemPrompt = this.buildSystemPrompt(cfg, knowledgeContext)

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage },
    ]

    const model = this.configService.get('GEMINI_API_KEY')
      ? (this.configService.get('GEMINI_MODEL') || 'gemini-2.0-flash')
      : (this.configService.get('OPENAI_MODEL') || 'gpt-4o')

    const response = await this.openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    })

    return response.choices[0].message.content || ''
  }

  private buildSystemPrompt(cfg: AgentConfig, knowledgeContext?: string): string {
    const toneMap = {
      professional: 'profissional e objetivo',
      friendly: 'amigável e acolhedor',
      formal: 'formal e respeitoso',
    }

    let prompt = cfg.systemPrompt || `Você é ${cfg.agentName}, um assistente virtual de atendimento. Responda de forma ${toneMap[cfg.tone]}.`

    if (knowledgeContext) {
      prompt += `\n\nInformações da empresa (use apenas estas para responder perguntas sobre produtos, preços e serviços):\n${knowledgeContext}`
    }

    if (cfg.handoffMode !== 'none') {
      prompt += `\n\nSe o cliente solicitar falar com um humano ou se a situação for complexa demais, informe que vai transferir o atendimento.`
    }

    prompt += `\n\nResponda sempre em ${cfg.language === 'pt-BR' ? 'português do Brasil' : cfg.language}. Seja conciso em respostas de voz (máximo 2-3 frases).`

    return prompt
  }

  async generateTips(systemPrompt: string, agentName: string): Promise<string[]> {
    if (!this.openai) return []

    const model = this.configService.get('GEMINI_API_KEY')
      ? (this.configService.get('GEMINI_MODEL') || 'gemini-2.0-flash')
      : this.configService.get('GROQ_API_KEY')
      ? (this.configService.get('GROQ_MODEL') || 'llama-3.3-70b-versatile')
      : (this.configService.get('OPENAI_MODEL') || 'gpt-4o-mini')

    try {
      const res = await this.openai.chat.completions.create({
        model,
        temperature: 0.5,
        max_tokens: 600,
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em otimização de agentes de atendimento por IA.
Analise as instruções do agente abaixo e gere exatamente 5 dicas práticas e específicas para melhorar o atendimento.
Cada dica deve indicar algo concreto que o usuário pode adicionar à base de conhecimento do agente para ele responder melhor.
Responda SOMENTE com um array JSON de 5 strings, sem markdown, sem explicações. Exemplo:
["Dica 1", "Dica 2", "Dica 3", "Dica 4", "Dica 5"]`,
          },
          {
            role: 'user',
            content: `Nome do agente: ${agentName}\n\nInstruções:\n${systemPrompt}`,
          },
        ],
      })

      const raw = res.choices[0]?.message?.content?.trim() || '[]'
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.slice(0, 5).filter(t => typeof t === 'string')
      return []
    } catch {
      return []
    }
  }

  async detectHandoffIntent(message: string): Promise<boolean> {
    const keywords = ['humano', 'atendente', 'pessoa real', 'falar com alguém', 'transferir', 'gerente', 'responsável']
    return keywords.some(k => message.toLowerCase().includes(k))
  }
}
