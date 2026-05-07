import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AgentService } from '../../agent/agent.service'
import { KnowledgeService } from '../../knowledge/knowledge.service'
import { ConversationsService } from '../../conversations/conversations.service'
import { TenantsService } from '../../tenants/tenants.service'
import axios from 'axios'
import * as twilio from 'twilio'

// Default Portuguese (BR) voices, picked from the account's available pt-labeled voices.
// Used when creating a fresh agent if the user hasn't picked a voice yet.
const DEFAULT_PT_VOICE = {
  male: 'y3X5crcIDtFawPx7bcNq',   // Eliel - Contador de histórias
  female: 'e06XicPETIbfUaeHM9zH', // Fabi - Portuguese (BR)
} as const

@Injectable()
export class PhoneService {
  private readonly logger = new Logger(PhoneService.name)
  private client: twilio.Twilio

  // In-memory map: elevenLabsAgentId → { callSid, tenantId }
  // Updated each time a call starts so we can look it up when the transfer webhook fires
  private readonly activeCallMap = new Map<string, { callSid: string; tenantId: string }>()

  constructor(
    private config: ConfigService,
    private agentService: AgentService,
    private knowledgeService: KnowledgeService,
    private conversationsService: ConversationsService,
    private tenantsService: TenantsService,
  ) {
    this.client = twilio(config.get('TWILIO_ACCOUNT_SID'), config.get('TWILIO_AUTH_TOKEN'))
  }

  async handleIncomingCall(tenantId: string, callSid: string, from: string): Promise<string> {
    const [cfg, tenant] = await Promise.all([
      this.agentService.getConfig(tenantId),
      this.tenantsService.findById(tenantId),
    ])

    await this.conversationsService.startConversation({
      tenantId,
      channel: 'phone',
      externalId: callSid,
      contactPhone: from,
    })

    const agentId = tenant.elevenLabsAgentId

    if (!agentId) {
      // Fallback: Twilio STT path (no ElevenLabs agent yet)
      return this.buildTwiml(
        `<Say language="pt-BR">${cfg.greetingMessage}</Say>` +
        `<Gather input="speech" language="pt-BR" action="/api/phone/speech/${tenantId}/${callSid}" timeout="5">` +
        `<Say language="pt-BR">Como posso ajudá-lo?</Say></Gather>`,
      )
    }

    // Store active call so the transfer webhook can look up callSid by agentId
    this.activeCallMap.set(agentId, { callSid, tenantId })
    this.logger.log(`[${tenantId}] Incoming call ${callSid} → ElevenLabs agent ${agentId}`)

    // Stream audio directly to ElevenLabs Conversational AI
    return this.buildTwiml(`
      <Connect>
        <Stream url="wss://api.elevenlabs.io/v1/convai/twilio?agent_id=${agentId}" />
      </Connect>
    `)
  }

  // Called by ElevenLabs transfer_to_human tool webhook
  async transferCall(agentId: string): Promise<{ success: boolean; message: string }> {
    const active = this.activeCallMap.get(agentId)
    if (!active) {
      this.logger.warn(`[transfer] No active call found for agent ${agentId}`)
      throw new NotFoundException('No active call for this agent')
    }

    const { callSid, tenantId } = active
    const cfg = await this.agentService.getConfig(tenantId)

    if (!cfg.handoffPhone) {
      this.logger.warn(`[${tenantId}] Transfer requested but no handoffPhone configured`)
      return { success: false, message: 'No handoff number configured' }
    }

    const transferTwiml = this.buildTwiml(
      `<Say language="pt-BR">Um momento, vou transferir sua ligação para um atendente.</Say>` +
      `<Dial timeout="30" action="/api/phone/status/${tenantId}">${cfg.handoffPhone}</Dial>`,
    )

    await this.client.calls(callSid).update({ twiml: transferTwiml })
    this.activeCallMap.delete(agentId)
    this.logger.log(`[${tenantId}] Call ${callSid} transferred to ${cfg.handoffPhone}`)

    return { success: true, message: 'Call transferred' }
  }

  async handleSpeechInput(tenantId: string, callSid: string, speechResult: string): Promise<string> {
    this.logger.log(`[${tenantId}] Speech: ${speechResult}`)

    const conversation = await this.conversationsService.getByExternalId(callSid)
    const history = conversation ? await this.conversationsService.getHistory(conversation.id) : []

    await this.conversationsService.addMessage(callSid, 'user', speechResult)

    const knowledgeContext = await this.knowledgeService.searchRelevant(tenantId, speechResult)
    const aiResponse = await this.agentService.processMessage(tenantId, speechResult, history, knowledgeContext)

    await this.conversationsService.addMessage(callSid, 'assistant', aiResponse)

    const shouldHandoff = await this.agentService.detectHandoffIntent(speechResult)
    if (shouldHandoff) {
      const cfg = await this.agentService.getConfig(tenantId)
      if (cfg.handoffPhone) {
        return this.buildTwiml(
          `<Say language="pt-BR">Vou transferir sua ligação para um de nossos atendentes. Aguarde.</Say>` +
          `<Dial>${cfg.handoffPhone}</Dial>`,
        )
      }
    }

    return this.buildTwiml(
      `<Say language="pt-BR">${aiResponse}</Say>` +
      `<Gather input="speech" language="pt-BR" action="/api/phone/speech/${tenantId}/${callSid}" timeout="5">` +
      `<Say language="pt-BR">Posso ajudar com mais alguma coisa?</Say></Gather>`,
    )
  }

  async handleCallEnd(tenantId: string, callSid: string, duration: string) {
    const minutes = Math.ceil(parseInt(duration || '0') / 60)
    const tenant = await this.tenantsService.findById(tenantId)
    await this.tenantsService.update(tenantId, {
      minutesUsedThisMonth: tenant.minutesUsedThisMonth + minutes,
    })
    await this.conversationsService.endConversation(callSid)

    // Clean up active call entry if still present
    if (tenant.elevenLabsAgentId) this.activeCallMap.delete(tenant.elevenLabsAgentId)

    this.logger.log(`[${tenantId}] Call ended. Duration: ${duration}s`)
  }

  async listAccountNumbers(): Promise<Array<{ sid: string; phoneNumber: string; friendlyName: string }>> {
    const numbers = await this.client.incomingPhoneNumbers.list({ limit: 50 })
    return numbers.map(n => ({
      sid: n.sid,
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
    }))
  }

  async assignExistingNumber(tenantId: string, phoneSid: string): Promise<string> {
    const backendUrl = this.config.get('BACKEND_PUBLIC_URL') || this.config.get('BACKEND_URL')

    try {
      const number = await this.client.incomingPhoneNumbers(phoneSid).update({
        voiceUrl: `${backendUrl}/api/phone/incoming/${tenantId}`,
        voiceMethod: 'POST',
        statusCallback: `${backendUrl}/api/phone/status/${tenantId}`,
        statusCallbackMethod: 'POST',
      })

      await this.tenantsService.update(tenantId, {
        twilioPhoneNumber: number.phoneNumber,
        twilioPhoneSid: number.sid,
        phoneChannelEnabled: true,
      })

      this.logger.log(`[${tenantId}] Assigned existing number ${number.phoneNumber}`)
      return number.phoneNumber
    } catch (err: any) {
      const msg = err.message || 'Erro ao configurar número'
      this.logger.error(`[${tenantId}] Twilio assign error: ${msg}`)
      throw new Error(`Twilio: ${msg}`)
    }
  }

  async provisionPhoneNumber(tenantId: string, areaCode: string = '11'): Promise<string> {
    const available = await this.client.availablePhoneNumbers('BR').local.list({ areaCode: parseInt(areaCode), limit: 1 })
    if (!available.length) throw new Error('No numbers available in this area code')

    const backendUrl = this.config.get('BACKEND_PUBLIC_URL') || this.config.get('BACKEND_URL')
    const number = await this.client.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      voiceUrl: `${backendUrl}/api/phone/incoming/${tenantId}`,
      voiceMethod: 'POST',
      statusCallback: `${backendUrl}/api/phone/status/${tenantId}`,
      statusCallbackMethod: 'POST',
    })

    await this.tenantsService.update(tenantId, {
      twilioPhoneNumber: number.phoneNumber,
      twilioPhoneSid: number.sid,
      phoneChannelEnabled: true,
    })

    return number.phoneNumber
  }

  async createElevenLabsAgent(tenantId: string, opts: { gender?: 'male' | 'female' } = {}): Promise<string> {
    const cfg = await this.agentService.getConfig(tenantId)
    const tenant = await this.tenantsService.findById(tenantId)

    if (tenant.elevenLabsAgentId) {
      this.logger.log(`[${tenantId}] ElevenLabs agent already exists: ${tenant.elevenLabsAgentId}`)
      return tenant.elevenLabsAgentId
    }

    const defaultVoice = DEFAULT_PT_VOICE[opts.gender ?? 'female']

    const backendUrl = this.config.get('BACKEND_PUBLIC_URL') || this.config.get('BACKEND_URL')
    const hasHandoff = cfg.handoffMode !== 'none' && cfg.handoffPhone

    const systemPrompt = cfg.systemPrompt || `Você é ${cfg.agentName}, um assistente de atendimento.`

    const tools = hasHandoff
      ? [
          {
            type: 'webhook',
            name: 'transfer_to_human',
            description:
              'Transfere esta chamada para um atendente humano. ' +
              'Use apenas quando: (1) o cliente pedir explicitamente falar com um humano, ' +
              '(2) a situação envolver urgência médica ou emergência, ' +
              '(3) após duas tentativas sem resolver o problema do cliente. ' +
              'Não use por padrão — tente resolver primeiro.',
            webhook: {
              url: `${backendUrl}/api/phone/transfer/{{agent_id}}`,
              method: 'POST',
              api_schema: { type: 'object', properties: {}, required: [] },
            },
          },
        ]
      : []

    // ElevenLabs requires lowercase language codes (e.g. pt-br, not pt-BR)
    const language = (cfg.language || 'pt-br').toLowerCase()

    const agentDisplayName = `${cfg.agentName} - ${tenant.name}`

    const response = await axios.post(
      'https://api.elevenlabs.io/v1/convai/agents/create',
      {
        name: agentDisplayName,
        conversation_config: {
          agent: {
            prompt: { prompt: systemPrompt, tools, llm: 'gemini-2.0-flash' },
            first_message: cfg.greetingMessage,
            language,
          },
          tts: {
            voice_id: tenant.elevenLabsVoiceId || defaultVoice,
            model_id: 'eleven_v3_conversational',
            expressive_mode: true,
          },
        },
      },
      { headers: { 'xi-api-key': this.config.get('ELEVENLABS_API_KEY') } },
    )

    const agentId = response.data.agent_id
    await this.tenantsService.update(tenantId, {
      elevenLabsAgentId: agentId,
      elevenLabsVoiceId: tenant.elevenLabsVoiceId || defaultVoice,
      elevenLabsExpressiveMode: true,
    })
    this.logger.log(`[${tenantId}] ElevenLabs agent created: ${agentId} (transfer tool: ${hasHandoff}, voice: ${opts.gender ?? 'female'})`)
    return agentId
  }

  async getElevenLabsAgent(tenantId: string) {
    const tenant = await this.tenantsService.findById(tenantId)
    if (!tenant.elevenLabsAgentId) throw new NotFoundException('Agente ElevenLabs não criado')
    const apiKey = this.config.get('ELEVENLABS_API_KEY')
    let { data } = await axios.get(
      `https://api.elevenlabs.io/v1/convai/agents/${tenant.elevenLabsAgentId}`,
      { headers: { 'xi-api-key': apiKey } },
    )
    let cfg = data.conversation_config || {}

    // Self-heal: tenant intent says expressive mode is on, but the agent is on a non-v3 model
    // (older agents created before the v3 default). Migrate it transparently to v3 conversational
    // so the UI reflects the saved intent and audio tags actually work.
    if (
      tenant.elevenLabsExpressiveMode &&
      cfg.tts?.model_id !== 'eleven_v3_conversational' &&
      cfg.tts?.expressive_mode !== true
    ) {
      try {
        await axios.patch(
          `https://api.elevenlabs.io/v1/convai/agents/${tenant.elevenLabsAgentId}`,
          { conversation_config: { tts: { model_id: 'eleven_v3_conversational', expressive_mode: true } } },
          { headers: { 'xi-api-key': apiKey } },
        )
        this.logger.log(`[${tenantId}] migrated agent to eleven_v3_conversational + expressive_mode`)
        const refreshed = await axios.get(
          `https://api.elevenlabs.io/v1/convai/agents/${tenant.elevenLabsAgentId}`,
          { headers: { 'xi-api-key': apiKey } },
        )
        data = refreshed.data
        cfg = data.conversation_config || {}
      } catch (e: any) {
        this.logger.warn(`[${tenantId}] expressive-mode migration failed: ${e?.response?.data?.detail || e.message}`)
      }
    }

    return {
      agentId: tenant.elevenLabsAgentId,
      name: data.name,
      prompt: cfg.agent?.prompt?.prompt,
      firstMessage: cfg.agent?.first_message,
      language: cfg.agent?.language || 'pt-br',
      voiceId: cfg.tts?.voice_id,
      modelId: cfg.tts?.model_id,
      expressiveMode: cfg.tts?.expressive_mode ?? tenant.elevenLabsExpressiveMode ?? false,
      interruptible: !(cfg.agent?.disable_first_message_interruptions ?? false),
      llm: cfg.agent?.prompt?.llm || 'gemini-2.0-flash',
    }
  }

  async updateElevenLabsAgent(tenantId: string, dto: {
    name?: string
    prompt?: string
    firstMessage?: string
    language?: string
    voiceId?: string
    expressiveMode?: boolean
    interruptible?: boolean
    llm?: string
  }) {
    const tenant = await this.tenantsService.findById(tenantId)
    if (!tenant.elevenLabsAgentId) throw new NotFoundException('Agente ElevenLabs não criado')
    const apiKey = this.config.get('ELEVENLABS_API_KEY')

    const language = dto.language ? dto.language.toLowerCase() : undefined

    // Rebuild tools so they're always preserved when patching the prompt
    let tools: any[] | undefined
    if (dto.prompt !== undefined) {
      const cfg = await this.agentService.getConfig(tenantId)
      const backendUrl = this.config.get('BACKEND_PUBLIC_URL') || this.config.get('BACKEND_URL')
      const hasHandoff = cfg.handoffMode !== 'none' && cfg.handoffPhone
      tools = hasHandoff
        ? [{
            type: 'webhook',
            name: 'transfer_to_human',
            description:
              'Transfere esta chamada para um atendente humano. ' +
              'Use apenas quando: (1) o cliente pedir explicitamente falar com um humano, ' +
              '(2) a situação envolver urgência médica ou emergência, ' +
              '(3) após duas tentativas sem resolver o problema do cliente. ' +
              'Não use por padrão — tente resolver primeiro.',
            webhook: {
              url: `${backendUrl}/api/phone/transfer/{{agent_id}}`,
              method: 'POST',
              api_schema: { type: 'object', properties: {}, required: [] },
            },
          }]
        : []
    }

    await axios.patch(
      `https://api.elevenlabs.io/v1/convai/agents/${tenant.elevenLabsAgentId}`,
      {
        ...(dto.name !== undefined && { name: dto.name }),
        conversation_config: {
          agent: {
            ...(dto.prompt !== undefined && {
              prompt: {
                prompt: dto.prompt,
                tools,
                ...(dto.llm !== undefined && { llm: dto.llm }),
              },
            }),
            ...(dto.firstMessage !== undefined && { first_message: dto.firstMessage }),
            ...(language && { language }),
            ...(dto.interruptible !== undefined && {
              disable_first_message_interruptions: !dto.interruptible,
            }),
          },
          tts: {
            ...(dto.expressiveMode !== undefined && {
              model_id: dto.expressiveMode ? 'eleven_v3_conversational' : 'eleven_turbo_v2_5',
              expressive_mode: dto.expressiveMode,
            }),
            ...(dto.voiceId !== undefined && { voice_id: dto.voiceId }),
          },
        },
      },
      { headers: { 'xi-api-key': apiKey } },
    )

    const tenantUpdate: Partial<Record<string, any>> = {}
    if (dto.voiceId) tenantUpdate.elevenLabsVoiceId = dto.voiceId
    if (dto.expressiveMode !== undefined) tenantUpdate.elevenLabsExpressiveMode = dto.expressiveMode
    if (Object.keys(tenantUpdate).length > 0) {
      await this.tenantsService.update(tenantId, tenantUpdate)
    }

    this.logger.log(`[${tenantId}] ElevenLabs agent updated`)
    return { ok: true }
  }

  async getConversationSignedUrl(tenantId: string): Promise<string> {
    const tenant = await this.tenantsService.findById(tenantId)
    if (!tenant.elevenLabsAgentId) throw new NotFoundException('Agente ElevenLabs não criado')
    const apiKey = this.config.get('ELEVENLABS_API_KEY')
    const { data } = await axios.get(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${tenant.elevenLabsAgentId}`,
      { headers: { 'xi-api-key': apiKey } },
    )
    return data.signed_url as string
  }

  async listElevenLabsVoices(language?: string) {
    const apiKey = this.config.get('ELEVENLABS_API_KEY')
    const { data } = await axios.get(
      'https://api.elevenlabs.io/v1/voices',
      { headers: { 'xi-api-key': apiKey } },
    )
    const wanted = language?.toLowerCase().split('-')[0]  // 'pt-br' → 'pt'
    return (data.voices || [])
      .filter((v: any) => {
        if (!wanted) return true
        const labelLang = (v.labels?.language || '').toLowerCase()
        return labelLang === wanted
      })
      .map((v: any) => ({
        id: v.voice_id,
        name: v.name,
        preview: v.preview_url,
        category: v.category,
        gender: v.labels?.gender,
        language: v.labels?.language,
      }))
  }

  private buildTwiml(content: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`
  }
}
