import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AgentService } from '../../agent/agent.service'
import { KnowledgeService } from '../../knowledge/knowledge.service'
import { ConversationsService } from '../../conversations/conversations.service'
import { TenantsService } from '../../tenants/tenants.service'
import axios from 'axios'

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name)

  constructor(
    private config: ConfigService,
    private agentService: AgentService,
    private knowledgeService: KnowledgeService,
    private conversationsService: ConversationsService,
    private tenantsService: TenantsService,
  ) {}

  async handleIncoming(tenantId: string, from: string, message: string, messageId: string) {
    this.logger.log(`[${tenantId}] WhatsApp from ${from}: ${message}`)

    const conversationId = `wa_${tenantId}_${from}`

    let conversation = await this.conversationsService.getByExternalId(conversationId)
    if (!conversation) {
      conversation = await this.conversationsService.startConversation({
        tenantId,
        channel: 'whatsapp',
        externalId: conversationId,
        contactPhone: from,
      })
    }

    const history = await this.conversationsService.getHistory(conversation.id)
    await this.conversationsService.addMessage(conversationId, 'user', message)

    const knowledgeContext = await this.knowledgeService.searchRelevant(tenantId, message)
    const aiResponse = await this.agentService.processMessage(tenantId, message, history, knowledgeContext)

    await this.conversationsService.addMessage(conversationId, 'assistant', aiResponse)

    const shouldHandoff = await this.agentService.detectHandoffIntent(message)
    if (shouldHandoff) {
      const cfg = await this.agentService.getConfig(tenantId)
      if (cfg.handoffWhatsapp) {
        await this.sendMessage(tenantId, from, 'Vou conectar você com um de nossos atendentes. Um momento...')
        return
      }
    }

    await this.sendMessage(tenantId, from, aiResponse)
  }

  async sendMessage(tenantId: string, to: string, text: string) {
    const tenant = await this.tenantsService.findById(tenantId)
    if (!tenant.whatsappInstanceName) throw new Error('WhatsApp not configured for this tenant')

    const evolutionUrl = this.config.get('EVOLUTION_API_URL')
    const apiKey = this.config.get('EVOLUTION_API_KEY')

    await axios.post(
      `${evolutionUrl}/message/sendText/${tenant.whatsappInstanceName}`,
      { number: to, text },
      { headers: { apikey: apiKey } },
    )
  }

  async checkStatus(tenantId: string): Promise<{ connected: boolean; state: string }> {
    const tenant = await this.tenantsService.findById(tenantId)
    if (!tenant?.whatsappInstanceName) return { connected: false, state: 'no_instance' }

    const evolutionUrl = this.config.get('EVOLUTION_API_URL')
    const apiKey = this.config.get('EVOLUTION_API_KEY')

    if (!evolutionUrl || evolutionUrl.includes('placeholder')) return { connected: false, state: 'not_configured' }

    try {
      const { data } = await axios.get(
        `${evolutionUrl}/instance/connectionState/${tenant.whatsappInstanceName}`,
        { headers: { apikey: apiKey }, timeout: 8000 },
      )
      const state: string = data?.instance?.state ?? data?.state ?? 'unknown'
      // Mark tenant as connected when state is open
      if (state === 'open' && !tenant.whatsappChannelEnabled) {
        await this.tenantsService.update(tenantId, { whatsappChannelEnabled: true })
      }
      return { connected: state === 'open', state }
    } catch {
      return { connected: false, state: 'error' }
    }
  }

  async createInstance(tenantId: string, phoneNumber: string): Promise<{ instanceName: string; qrCode: string }> {
    if (!phoneNumber) throw new BadRequestException('Número de telefone obrigatório')

    const evolutionUrl = this.config.get('EVOLUTION_API_URL')
    const apiKey = this.config.get('EVOLUTION_API_KEY')

    if (!evolutionUrl || evolutionUrl.includes('placeholder')) {
      throw new ServiceUnavailableException('Evolution API não configurada. Configure EVOLUTION_API_URL no .env')
    }

    const instanceName = `tenant_${tenantId.slice(0, 8)}`
    const headers = { apikey: apiKey }

    try {
      // Delete own instance first
      try {
        await axios.delete(`${evolutionUrl}/instance/delete/${instanceName}`, { headers, timeout: 8000 })
        this.logger.log(`Deleted own instance: ${instanceName}`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch {
        // Instance does not exist — fine
      }

      // Delete any OTHER instance that has the same phone number already connected
      // (happens when testing with the same number across different tenants)
      try {
        const phoneDigits = phoneNumber.replace(/\D/g, '')
        const { data: instances } = await axios.get(`${evolutionUrl}/instance/fetchInstances`, { headers, timeout: 8000 })
        const stale = (instances as any[]).filter(inst =>
          inst.name !== instanceName &&
          inst.ownerJid?.startsWith(phoneDigits),
        )
        for (const inst of stale) {
          await axios.delete(`${evolutionUrl}/instance/delete/${inst.name}`, { headers, timeout: 8000 }).catch(() => {})
          this.logger.log(`Deleted stale instance with same number: ${inst.name}`)
        }
        if (stale.length) await new Promise(resolve => setTimeout(resolve, 1000))
      } catch {
        // Non-fatal — proceed even if we can't clean stale instances
      }

      const response = await axios.post(
        `${evolutionUrl}/instance/create`,
        {
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          webhook: {
            url: `${this.config.get('BACKEND_PUBLIC_URL') || this.config.get('BACKEND_URL')}/api/whatsapp/webhook/${tenantId}`,
            enabled: true,
            events: ['MESSAGES_UPSERT'],
          },
        },
        { headers, timeout: 15000 },
      )

      await this.tenantsService.update(tenantId, {
        whatsappInstanceName: instanceName,
        whatsappPhoneNumber: phoneNumber,
        whatsappChannelEnabled: false, // set to true only after QR is scanned and connected
      })

      // QR code is generated asynchronously by Baileys — poll the connect endpoint
      let qrCode = response.data.qrcode?.base64 || ''
      if (!qrCode) {
        qrCode = await this.pollForQrCode(evolutionUrl, instanceName, headers)
      }

      return { instanceName, qrCode }
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new ServiceUnavailableException('Não foi possível conectar à Evolution API. Verifique se o serviço está rodando.')
      }
      const msg = err.response?.data?.response?.message?.[0]
        || err.response?.data?.message
        || err.response?.data?.error
        || err.message
      this.logger.error(`Evolution API error: ${msg}`)
      throw new ServiceUnavailableException(`Evolution API: ${msg}`)
    }
  }

  private async pollForQrCode(evolutionUrl: string, instanceName: string, headers: Record<string, string>): Promise<string> {
    const maxAttempts = 10
    const delayMs = 2000
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      try {
        const { data } = await axios.get(
          `${evolutionUrl}/instance/connect/${instanceName}`,
          { headers, timeout: 5000 },
        )
        if (data?.base64) return data.base64
      } catch {
        // ignore transient errors and keep polling
      }
    }
    this.logger.warn(`QR code not available for ${instanceName} after ${maxAttempts} attempts`)
    return ''
  }
}
