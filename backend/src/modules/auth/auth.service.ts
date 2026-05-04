import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { TenantsService } from '../tenants/tenants.service'
import { google } from 'googleapis'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
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
}
