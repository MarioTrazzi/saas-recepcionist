import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { TenantsService } from '../tenants/tenants.service'
import { google } from 'googleapis'
import * as bcrypt from 'bcrypt'
import axios from 'axios'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private tenantsService: TenantsService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private getOAuthClient() {
    return new google.auth.OAuth2(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
      this.config.get('GOOGLE_LOGIN_REDIRECT_URI'),
    )
  }

  getGoogleLoginUrl(): string {
    const oauth2 = this.getOAuthClient()
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    })
  }

  async handleGoogleCallback(code: string): Promise<{ token: string; isNew: boolean }> {
    const oauth2 = this.getOAuthClient()
    const { tokens } = await oauth2.getToken(code)
    oauth2.setCredentials(tokens)

    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 })
    const { data: profile } = await oauth2Api.userinfo.get()

    const email = profile.email!
    const name = profile.name || email.split('@')[0]

    let user = await this.tenantsService.getUserByEmail(email)
    let isNew = false

    if (!user) {
      // New user — create tenant + user (no password for Google accounts)
      const { tenant, user: newUser } = await this.tenantsService.createTenantWithOwner({
        tenantName: name,
        email,
        password: Math.random().toString(36), // random, never used
        ownerName: name,
      })
      // Save Google profile info to tenant (no calendar scope at login)
      await this.tenantsService.update(tenant.id, {
        googleEmail: email,
      })
      user = { ...newUser, tenantId: tenant.id } as any
      isNew = true
    } else {
      // Existing user — update profile
      await this.tenantsService.update(user.tenantId, {
        googleEmail: email,
      })
    }

    const token = this.jwtService.sign({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name || name,
      role: user.role,
    })

    return { token, isNew }
  }

  async register(dto: { tenantName: string; email: string; password: string; ownerName: string }) {
    const { tenant, user } = await this.tenantsService.createTenantWithOwner(dto)
    const token = this.jwtService.sign({ sub: user.id, tenantId: tenant.id, email: user.email, name: user.name, role: user.role })
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, tenant }
  }

  async login(email: string, password: string) {
    const user = await this.tenantsService.getUserByEmail(email)
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const token = this.jwtService.sign({ sub: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role })
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } }
  }

  private async exchangeMetaCode(code: string): Promise<string> {
    const appId = this.config.get('META_APP_ID')
    const appSecret = this.config.get('META_APP_SECRET')
    if (!appId || !appSecret) throw new BadRequestException('META_APP_ID ou META_APP_SECRET não configurados no servidor.')

    try {
      // For JS SDK popup flow, redirect_uri is not required
      const { data } = await axios.get('https://graph.facebook.com/oauth/access_token', {
        params: { client_id: appId, client_secret: appSecret, code },
        timeout: 10000,
      })
      this.logger.log(`Meta code exchanged successfully`)
      return data.access_token as string
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message
      this.logger.error(`Meta code exchange failed: ${msg}`)
      throw new BadRequestException(`Falha ao validar autenticação Meta: ${msg}`)
    }
  }

  async handleMetaCallback(accessToken: string): Promise<{ token: string; isNew: boolean; whatsappConfigured: boolean }> {
    if (!accessToken) {
      this.logger.error('Meta callback received without accessToken — likely stale frontend bundle')
      throw new BadRequestException('Access token Meta não recebido. Atualize a página (Ctrl+Shift+R) e tente novamente.')
    }

    // Get user profile
    let profileData: { id: string; name: string; email?: string }
    try {
      const profileRes = await axios.get('https://graph.facebook.com/me', {
        params: { fields: 'id,name,email', access_token: accessToken },
        timeout: 10000,
      })
      profileData = profileRes.data
      this.logger.log(`Meta profile fetched: id=${profileData.id}, hasEmail=${!!profileData.email}`)
    } catch (err: any) {
      this.logger.error(`Meta GET /me failed: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`)
      throw new BadRequestException(
        err.response?.data?.error?.message || 'Falha ao obter perfil Meta. Verifique as permissões do app.',
      )
    }

    const { id: fbId, name } = profileData
    // Facebook Login for Business doesn't return email — use synthetic address based on FB user ID
    const email = profileData.email || `fb_${fbId}@meta.local`

    let user = await this.tenantsService.getUserByEmail(email)
    let isNew = false

    if (!user) {
      const { tenant, user: newUser } = await this.tenantsService.createTenantWithOwner({
        tenantName: name,
        email,
        password: Math.random().toString(36),
        ownerName: name,
      })
      user = { ...newUser, tenantId: tenant.id } as any
      isNew = true
    }

    // Try to auto-configure WhatsApp Business from this token
    let whatsappConfigured = false
    try {
      const waRes = await axios.get('https://graph.facebook.com/v20.0/me/whatsapp_business_accounts', {
        params: { access_token: accessToken },
      })
      const waAccounts: any[] = waRes.data.data || []
      if (waAccounts.length > 0) {
        const phonesRes = await axios.get(`https://graph.facebook.com/v20.0/${waAccounts[0].id}/phone_numbers`, {
          params: { fields: 'id,display_phone_number', access_token: accessToken },
        })
        const phones: any[] = phonesRes.data.data || []
        if (phones.length > 0) {
          await this.tenantsService.update(user.tenantId, {
            metaPhoneNumberId: phones[0].id,
            metaAccessToken: accessToken,
            whatsappPhoneNumber: phones[0].display_phone_number,
            whatsappChannelEnabled: true,
            whatsappInstanceName: null,
          })
          whatsappConfigured = true
        }
      }
    } catch {
      // WhatsApp not available from this token — user can configure later in wizard
    }

    const token = this.jwtService.sign({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name || name,
      role: user.role,
    })

    return { token, isNew, whatsappConfigured }
  }
}
