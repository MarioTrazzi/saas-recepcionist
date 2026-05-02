import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum TenantPlan {
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  slug: string

  @Column({ unique: true })
  email: string

  @Column({ type: 'enum', enum: TenantPlan, default: TenantPlan.STARTER })
  plan: TenantPlan

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.TRIAL })
  status: TenantStatus

  @Column({ nullable: true })
  stripeCustomerId: string

  @Column({ nullable: true })
  stripeSubscriptionId: string

  @Column({ default: 0 })
  minutesUsedThisMonth: number

  @Column({ default: 100 })
  minutesLimitPerMonth: number

  @Column({ nullable: true })
  twilioPhoneNumber: string

  @Column({ nullable: true })
  twilioPhoneSid: string

  @Column({ nullable: true })
  elevenLabsVoiceId: string

  @Column({ nullable: true })
  elevenLabsAgentId: string

  @Column({ nullable: true })
  whatsappInstanceName: string

  @Column({ nullable: true })
  whatsappPhoneNumber: string

  // Evolution API fallback (Baileys) — optional, doesn't consume Meta credits
  @Column({ nullable: true })
  evolutionApiUrl: string

  @Column({ nullable: true })
  evolutionApiKey: string

  // WhatsApp Business Cloud API credentials (official Meta integration)
  @Column({ nullable: true })
  metaPhoneNumberId: string

  @Column({ nullable: true })
  metaAccessToken: string

  @Column({ type: 'boolean', default: false })
  phoneChannelEnabled: boolean

  @Column({ type: 'boolean', default: false })
  whatsappChannelEnabled: boolean

  @Column({ nullable: true })
  whatsappError: string

  @Column({ type: 'timestamp', nullable: true })
  whatsappErrorAt: Date

  // Unanswered messages due to WhatsApp credit exhaustion
  @Column({ type: 'jsonb', nullable: true })
  unansweredMessages: Array<{ phone: string; message: string; receivedAt: string; conversationId: string }>

  // Google OAuth — stored at login, reused for Calendar
  @Column({ nullable: true })
  googleAccessToken: string

  @Column({ nullable: true })
  googleRefreshToken: string

  @Column({ nullable: true })
  googleEmail: string

  @Column({ type: 'boolean', default: false })
  googleCalendarConnected: boolean

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
