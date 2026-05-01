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

  // ── Cloud API setup ────────────────────────────────────────────────────────

  async setupCloudApi(tenantId: string, phoneNumberId: string, accessToken: string): Promise<{ phoneNumber: string }> {
    // Validate credentials against Meta
    try {
      const { data } = await axios.get(
        `https://graph.facebook.com/v19.0/${phoneNumberId}`,
        {
          params: { fields: 'display_phone_number,verified_name', access_token: accessToken },
          timeout: 10000,
        },
      )
      const phoneNumber = data.display_phone_number || ''
      await this.tenantsService.update(tenantId, {
        metaPhoneNumberId: phoneNumberId,
        metaAccessToken: accessToken,
        whatsappPhoneNumber: phoneNumber,
        whatsappChannelEnabled: true,
        whatsappInstanceName: null,
      })
      this.logger.log(`[${tenantId}] Cloud API configured for ${phoneNumber}`)
      return { phoneNumber }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Credenciais inválidas ou sem permissão'
      throw new BadRequestException(`Meta API: ${msg}`)
    }
  }

  // ── Meta webhook verification (GET) ───────────────────────────────────────

  verifyWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = this.config.get('META_WEBHOOK_VERIFY_TOKEN')
    if (mode === 'subscribe' && token === verifyToken) return challenge
    throw new BadRequestException('Webhook verification failed')
  }

  // ── Incoming Meta webhook (POST) ──────────────────────────────────────────

  async handleMetaWebhook(body: any): Promise<void> {
    const entries = body?.entry ?? []
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value
        if (!value?.messages?.length) continue

        const phoneNumberId: string = value.metadata?.phone_number_id
        if (!phoneNumberId) continue

        const tenant = await this.tenantsService.findByMetaPhoneNumberId(phoneNumberId)
        if (!tenant) {
          this.logger.warn(`No tenant found for phone_number_id ${phoneNumberId}`)
          continue
        }

        for (const msg of value.messages) {
          if (msg.type !== 'text') continue
          const from: string = msg.from
          const text: string = msg.text?.body
          if (!from || !text) continue

          await this.handleIncoming(tenant.id, from, text, msg.id)
        }
      }
    }
  }

  // ── Core message handler (shared by Cloud API and Baileys) ────────────────

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

    await this.conversationsService.addMessage(conversationId, 'user', message)
    const history = await this.conversationsService.getHistory(conversation.id)

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

  // ── Send message — Cloud API or Baileys ───────────────────────────────────

  async sendMessage(tenantId: string, to: string, text: string) {
    const tenant = await this.tenantsService.findById(tenantId)

    if (tenant.metaPhoneNumberId && tenant.metaAccessToken) {
      await this.sendCloudApiMessage(tenant.metaPhoneNumberId, tenant.metaAccessToken, to, text)
    } else if (tenant.whatsappInstanceName) {
      await this.sendBaileysMessage(tenant.whatsappInstanceName, to, text)
    } else {
      throw new Error('WhatsApp not configured for this tenant')
    }
  }

  private async sendCloudApiMessage(phoneNumberId: string, accessToken: string, to: string, text: string) {
    await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
  }

  private async sendBaileysMessage(instanceName: string, to: string, text: string) {
    const evolutionUrl = this.config.get('EVOLUTION_API_URL')
    const apiKey = this.config.get('EVOLUTION_API_KEY')
    await axios.post(
      `${evolutionUrl}/message/sendText/${instanceName}`,
      { number: to, text },
      { headers: { apikey: apiKey } },
    )
  }

  // ── Status ────────────────────────────────────────────────────────────────

  async checkStatus(tenantId: string): Promise<{ connected: boolean; state: string; mode: 'cloud-api' | 'baileys' | 'none' }> {
    const tenant = await this.tenantsService.findById(tenantId)

    if (tenant.metaPhoneNumberId && tenant.metaAccessToken) {
      // Verify Cloud API credentials are still valid
      try {
        await axios.get(
          `https://graph.facebook.com/v19.0/${tenant.metaPhoneNumberId}`,
          {
            params: { fields: 'display_phone_number', access_token: tenant.metaAccessToken },
            timeout: 8000,
          },
        )
        return { connected: true, state: 'open', mode: 'cloud-api' }
      } catch {
        return { connected: false, state: 'error', mode: 'cloud-api' }
      }
    }

    if (tenant.whatsappInstanceName) {
      return { ...await this.checkBaileysStatus(tenant.whatsappInstanceName), mode: 'baileys' }
    }

    return { connected: false, state: 'no_instance', mode: 'none' }
  }

  private async checkBaileysStatus(instanceName: string): Promise<{ connected: boolean; state: string }> {
    const evolutionUrl = this.config.get('EVOLUTION_API_URL')
    const apiKey = this.config.get('EVOLUTION_API_KEY')
    if (!evolutionUrl || evolutionUrl.includes('placeholder')) return { connected: false, state: 'not_configured' }
    try {
      const { data } = await axios.get(
        `${evolutionUrl}/instance/connectionState/${instanceName}`,
        { headers: { apikey: apiKey }, timeout: 8000 },
      )
      const state: string = data?.instance?.state ?? data?.state ?? 'unknown'
      return { connected: state === 'open', state }
    } catch {
      return { connected: false, state: 'error' }
    }
  }

  // ── Baileys QR (kept for backward compat) ─────────────────────────────────

  async createInstance(tenantId: string, phoneNumber: string): Promise<{ instanceName: string; qrCode: string }> {
    if (!phoneNumber) throw new BadRequestException('Número de telefone obrigatório')

    const evolutionUrl = this.config.get('EVOLUTION_API_URL')
    const apiKey = this.config.get('EVOLUTION_API_KEY')

    if (!evolutionUrl || evolutionUrl.includes('placeholder')) {
      throw new ServiceUnavailableException('Evolution API não configurada.')
    }

    const instanceName = `tenant_${tenantId.slice(0, 8)}`
    const headers = { apikey: apiKey }

    try {
      try {
        await axios.delete(`${evolutionUrl}/instance/delete/${instanceName}`, { headers, timeout: 8000 })
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch { /* instance didn't exist */ }

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
        whatsappChannelEnabled: false,
        metaPhoneNumberId: null,
        metaAccessToken: null,
      })

      let qrCode = response.data.qrcode?.base64 || ''
      if (!qrCode) qrCode = await this.pollForQrCode(evolutionUrl, instanceName, headers)

      return { instanceName, qrCode }
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new ServiceUnavailableException('Não foi possível conectar à Evolution API.')
      }
      const msg = err.response?.data?.response?.message?.[0] || err.response?.data?.message || err.message
      throw new ServiceUnavailableException(`Evolution API: ${msg}`)
    }
  }

  private async pollForQrCode(evolutionUrl: string, instanceName: string, headers: Record<string, string>): Promise<string> {
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      try {
        const { data } = await axios.get(`${evolutionUrl}/instance/connect/${instanceName}`, { headers, timeout: 5000 })
        if (data?.base64) return data.base64
      } catch { /* keep polling */ }
    }
    return ''
  }
}
