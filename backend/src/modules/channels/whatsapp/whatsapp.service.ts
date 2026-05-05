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

  async adminUpdateToken(tenantId: string, accessToken: string, twilioPhone?: string) {
    const update: any = {
      metaAccessToken: accessToken,
      whatsappError: null,
      whatsappErrorAt: null,
    }
    if (twilioPhone) {
      update.twilioPhoneNumber = twilioPhone
    }
    await this.tenantsService.update(tenantId, update)
    this.logger.log(`[${tenantId}] Admin updated Meta access token${twilioPhone ? ' + Twilio phone' : ''}`)
  }

  async embeddedSignup(tenantId: string, code: string, redirectUri: string): Promise<{ phoneNumber: string }> {
    const appId = this.config.get('META_APP_ID')
    const appSecret = this.config.get('META_APP_SECRET')

    const tokenRes = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
      params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code },
      timeout: 10000,
    })
    const accessToken: string = tokenRes.data.access_token

    const waRes = await axios.get('https://graph.facebook.com/v20.0/me/whatsapp_business_accounts', {
      params: { access_token: accessToken },
      timeout: 10000,
    })
    const waAccounts: any[] = waRes.data.data || []
    if (!waAccounts.length) throw new BadRequestException('Nenhuma conta WhatsApp Business encontrada nesta conta Meta.')

    const phonesRes = await axios.get(`https://graph.facebook.com/v20.0/${waAccounts[0].id}/phone_numbers`, {
      params: { fields: 'id,display_phone_number,verified_name', access_token: accessToken },
      timeout: 10000,
    })
    const phones: any[] = phonesRes.data.data || []
    if (!phones.length) throw new BadRequestException('Nenhum número de telefone encontrado nesta conta WhatsApp Business.')

    const { id: phoneNumberId, display_phone_number: phoneNumber } = phones[0]
    await this.tenantsService.update(tenantId, {
      metaPhoneNumberId: phoneNumberId,
      metaAccessToken: accessToken,
      whatsappPhoneNumber: phoneNumber,
      whatsappChannelEnabled: true,
      whatsappInstanceName: null,
    })

    this.logger.log(`[${tenantId}] WhatsApp configured via Embedded Signup: ${phoneNumber}`)
    return { phoneNumber }
  }

  async setupCloudApi(tenantId: string, phoneNumberId: string, accessToken: string, appId?: string): Promise<{ phoneNumber: string }> {
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
        metaAppId: appId,
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

  // ── Evolution API fallback setup ──────────────────────────────────────────

  async setupEvolutionFallback(tenantId: string, evolutionApiUrl: string, evolutionApiKey: string, phoneNumber: string): Promise<{ instanceName: string; qrCode: string }> {
    // Validate Evolution API connection
    try {
      await axios.get(`${evolutionApiUrl}/instance/fetchInstances`, {
        headers: { apikey: evolutionApiKey },
        timeout: 10000,
      })
    } catch (err: any) {
      throw new BadRequestException('Não foi possível conectar à Evolution API. Verifique a URL e a chave.')
    }

    // Create instance
    const instanceName = `tenant_${tenantId.slice(0, 8)}_fallback`
    const headers = { apikey: evolutionApiKey }

    try {
      // Delete existing instance if any
      try {
        await axios.delete(`${evolutionApiUrl}/instance/delete/${instanceName}`, { headers, timeout: 8000 })
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch { /* instance didn't exist */ }

      const response = await axios.post(
        `${evolutionApiUrl}/instance/create`,
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
        evolutionApiUrl,
        evolutionApiKey,
        whatsappInstanceName: instanceName,
      })

      let qrCode = response.data.qrcode?.base64 || ''
      if (!qrCode) qrCode = await this.pollForQrCode(evolutionApiUrl, instanceName, headers)

      this.logger.log(`[${tenantId}] Evolution API fallback configured: ${instanceName}`)
      return { instanceName, qrCode }
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new ServiceUnavailableException('Não foi possível conectar à Evolution API.')
      }
      const msg = err.response?.data?.response?.message?.[0] || err.response?.data?.message || err.message
      throw new ServiceUnavailableException(`Evolution API: ${msg}`)
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
      this.logger.log(`[${tenantId}] Creating new conversation: ${conversationId}`)
      conversation = await this.conversationsService.startConversation({
        tenantId,
        channel: 'whatsapp',
        externalId: conversationId,
        contactPhone: from,
      })
      this.logger.log(`[${tenantId}] Conversation created: ${conversation.id}`)
    } else {
      this.logger.log(`[${tenantId}] Found existing conversation: ${conversation.id}`)
    }

    this.logger.log(`[${tenantId}] Saving user message...`)
    await this.conversationsService.addMessage(conversationId, 'user', message)
    this.logger.log(`[${tenantId}] User message saved`)

    const history = await this.conversationsService.getHistory(conversation.id)
    this.logger.log(`[${tenantId}] History loaded: ${history.length} messages`)

    let aiResponse: string
    try {
      const knowledgeContext = await this.knowledgeService.searchRelevant(tenantId, message)
      aiResponse = await this.agentService.processMessage(tenantId, message, history, knowledgeContext)
      this.logger.log(`[${tenantId}] AI response generated: ${aiResponse.substring(0, 100)}...`)
    } catch (err: any) {
      this.logger.error(`[${tenantId}] AI processing failed: ${err.message}`)
      const tenant = await this.tenantsService.findById(tenantId)
      const phone = tenant.twilioPhoneNumber || tenant.whatsappPhoneNumber
      const phoneFormatted = phone ? this.formatPhone(phone) : null
      aiResponse = phoneFormatted
        ? `Olá! No momento nosso atendimento automático está com uma instabilidade. Por favor, ligue para: ${phoneFormatted}`
        : 'Olá! No momento nosso atendimento automático está com uma instabilidade. Por favor, tente novamente em instantes.'
    }

    this.logger.log(`[${tenantId}] Saving assistant message...`)
    await this.conversationsService.addMessage(conversationId, 'assistant', aiResponse)
    this.logger.log(`[${tenantId}] Assistant message saved`)

    const shouldHandoff = await this.agentService.detectHandoffIntent(message)
    if (shouldHandoff) {
      const cfg = await this.agentService.getConfig(tenantId)
      if (cfg.handoffWhatsapp) {
        await this.sendMessage(tenantId, from, 'Vou conectar você com um de nossos atendentes. Um momento...', conversationId)
        return
      }
    }

    this.logger.log(`[${tenantId}] Sending WhatsApp response...`)
    await this.sendMessage(tenantId, from, aiResponse, conversationId)
    this.logger.log(`[${tenantId}] WhatsApp response sent`)
  }

  // ── Send message — Cloud API with Evolution API fallback ──────────────────

  async sendMessage(tenantId: string, to: string, text: string, conversationId?: string) {
    const tenant = await this.tenantsService.findById(tenantId)

    // Check if we have a recorded credit error in the last 15 minutes to avoid repeated Meta failures
    const isRecentlyOutOfCredits = 
      tenant.whatsappError?.includes('131042') && 
      tenant.whatsappErrorAt && 
      (new Date().getTime() - new Date(tenant.whatsappErrorAt).getTime() < 15 * 60 * 1000)

    // Try Cloud API first (official Meta integration) if not recently failed for credits
    if (tenant.metaPhoneNumberId && tenant.metaAccessToken && !isRecentlyOutOfCredits) {
      try {
        await this.sendCloudApiMessage(tenant.metaPhoneNumberId, tenant.metaAccessToken, to, text)
        // Clear any previous error on success
        if (tenant.whatsappError) {
          await this.tenantsService.update(tenantId, { whatsappError: null, whatsappErrorAt: null })
        }
        // Clear unanswered messages when WhatsApp starts working again
        if (tenant.unansweredMessages?.length > 0) {
          await this.clearUnansweredMessages(tenantId)
        }
        return
      } catch (err: any) {
        const errorData = err.response?.data?.error
        const errorCode = errorData?.code
        const msg = errorData?.message || err.message || 'Erro desconhecido'
        
        // 131042 = Payment required/Out of credits
        const fullError = errorCode ? `[${errorCode}] ${msg}` : msg
        this.logger.error(`[${tenantId}] Cloud API failed: ${fullError}`)
        await this.tenantsService.update(tenantId, { whatsappError: fullError, whatsappErrorAt: new Date() })

        // If it was a credit error, skip to fallback immediately
        if (errorCode === 131042 || msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('payment')) {
          this.logger.warn(`[${tenantId}] Meta credits exhausted. Switching to fallback.`)
        } else {
          // For other errors (like token expired), we might not want to spam fallback if it's a config issue
          // but for now, we try fallback for everything
        }
      }
    }

    // Evolution API fallback (doesn't consume Meta credits)
    if (tenant.evolutionApiUrl && tenant.evolutionApiKey && tenant.whatsappInstanceName) {
      try {
        this.logger.log(`[${tenantId}] Trying Evolution API...`)
        await this.sendBaileysMessage(tenant.evolutionApiUrl, tenant.evolutionApiKey, tenant.whatsappInstanceName, to, text)
        this.logger.log(`[${tenantId}] Message sent via Evolution API`)
        
        // If we were in credit-error state but fallback works, we keep the error in DB 
        // so the dashboard alert stays visible, but we succeeded in sending.
        // However, we clear any non-credit transient errors.
        if (tenant.whatsappError && !tenant.whatsappError.includes('131042')) {
          await this.tenantsService.update(tenantId, { whatsappError: null, whatsappErrorAt: null })
        }
        return
      } catch (fallbackErr: any) {
        this.logger.error(`[${tenantId}] Evolution API failed: ${fallbackErr.message}`)
      }
    }

    // Both failed — save unanswered message for dashboard alert
    await this.saveUnansweredMessage(tenantId, to, text, conversationId)

    // Try to send fallback "out of order" message (via Evolution first)
    await this.sendFallbackMessage(tenant, to)
    
    // Final throw if we couldn't send the original message via any channel
    throw new Error('WhatsApp delivery failed across all channels')
  }

  private async saveUnansweredMessage(tenantId: string, phone: string, message: string, conversationId?: string) {
    const tenant = await this.tenantsService.findById(tenantId)
    const unanswered = tenant.unansweredMessages || []

    // Add new unanswered message (keep last 50)
    unanswered.unshift({
      phone,
      message: message.substring(0, 100), // Truncate for storage
      receivedAt: new Date().toISOString(),
      conversationId: conversationId || `wa_${tenantId}_${phone}`,
    })

    // Keep only last 50 messages
    const trimmed = unanswered.slice(0, 50)
    await this.tenantsService.update(tenantId, { unansweredMessages: trimmed })
    this.logger.warn(`[${tenantId}] Unanswered message saved for ${phone}`)
  }

  async clearUnansweredMessages(tenantId: string) {
    await this.tenantsService.update(tenantId, { unansweredMessages: [] })
    this.logger.log(`[${tenantId}] Cleared unanswered messages`)
  }

  private async sendFallbackMessage(tenant: any, to: string) {
    const phone = tenant.twilioPhoneNumber || tenant.whatsappPhoneNumber
    const phoneFormatted = phone ? ` ${this.formatPhone(phone)}` : ''
    const fallbackText = `Olá! Estamos com uma instabilidade temporária no atendimento por WhatsApp.${phoneFormatted ? `\n\nPara falar conosco, ligue para: ${phoneFormatted}` : '\n\nPor favor, tente novamente em instantes ou entre em contato por telefone.'}`

    // Try Evolution API first (doesn't consume Meta credits)
    if (tenant.evolutionApiUrl && tenant.evolutionApiKey && tenant.whatsappInstanceName) {
      try {
        await this.sendBaileysMessage(tenant.evolutionApiUrl, tenant.evolutionApiKey, tenant.whatsappInstanceName, to, fallbackText)
        this.logger.log(`[${tenant.id}] Fallback message sent via Evolution API to ${to}`)
        return
      } catch {
        this.logger.warn(`[${tenant.id}] Evolution API fallback failed`)
      }
    }

    // Try Cloud API as last resort (might fail if credits exhausted, but worth a shot for small texts)
    if (tenant.metaPhoneNumberId && tenant.metaAccessToken && !tenant.whatsappError?.includes('131042')) {
      try {
        await this.sendCloudApiMessage(tenant.metaPhoneNumberId, tenant.metaAccessToken, to, fallbackText)
        this.logger.log(`[${tenant.id}] Fallback message sent via Cloud API to ${to}`)
      } catch {
        this.logger.warn(`[${tenant.id}] Could not send fallback message to ${to}`)
      }
    }
  }

  private formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('55') && digits.length === 13) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
    }
    if (digits.startsWith('1') && digits.length === 11) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    return raw
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

  private async sendBaileysMessage(evolutionUrl: string, apiKey: string, instanceName: string, to: string, text: string) {
    await axios.post(
      `${evolutionUrl}/message/sendText/${instanceName}`,
      { number: to, text },
      { headers: { apikey: apiKey } },
    )
  }

  // ── Status ────────────────────────────────────────────────────────────────

  async checkStatus(tenantId: string): Promise<{ connected: boolean; state: string; mode: 'cloud-api' | 'baileys' | 'none'; fallbackConfigured: boolean; error?: string }> {
    const tenant = await this.tenantsService.findById(tenantId)

    const fallbackConfigured = !!(tenant.evolutionApiUrl && tenant.evolutionApiKey && tenant.whatsappInstanceName)

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
        
        // Even if connected, report if there is a pending credit error
        if (tenant.whatsappError?.includes('131042')) {
          return { 
            connected: true, 
            state: 'open', 
            mode: 'cloud-api', 
            fallbackConfigured,
            error: 'Créditos da Meta esgotados. Operando via fallback (se disponível).'
          }
        }

        return { connected: true, state: 'open', mode: 'cloud-api', fallbackConfigured }
      } catch (err: any) {
        return { connected: false, state: 'error', mode: 'cloud-api', fallbackConfigured, error: tenant.whatsappError }
      }
    }

    if (tenant.evolutionApiUrl && tenant.evolutionApiKey && tenant.whatsappInstanceName) {
      return { ...await this.checkBaileysStatus(tenant.evolutionApiUrl, tenant.evolutionApiKey, tenant.whatsappInstanceName), mode: 'baileys', fallbackConfigured }
    }

    return { connected: false, state: 'no_instance', mode: 'none', fallbackConfigured }
  }

  private async checkBaileysStatus(evolutionUrl: string, apiKey: string, instanceName: string): Promise<{ connected: boolean; state: string }> {
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
        evolutionApiUrl: evolutionUrl,
        evolutionApiKey: apiKey,
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
