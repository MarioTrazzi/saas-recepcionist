import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum AgentTone {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  FORMAL = 'formal',
}

export enum HandoffMode {
  NONE = 'none',
  WHATSAPP = 'whatsapp',
  PHONE = 'phone',
  BOTH = 'both',
}

export enum CalendarMode {
  NONE = 'none',
  GOOGLE = 'google',
  BUILTIN = 'builtin',
}

@Entity('agent_configs')
export class AgentConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  tenantId: string

  @Column()
  agentName: string

  @Column({ default: 'Bem-vindo! Como posso ajudar?' })
  greetingMessage: string

  @Column({ type: 'text', nullable: true })
  systemPrompt: string

  @Column({ type: 'enum', enum: AgentTone, default: AgentTone.FRIENDLY })
  tone: AgentTone

  @Column({ type: 'enum', enum: HandoffMode, default: HandoffMode.NONE })
  handoffMode: HandoffMode

  @Column({ nullable: true })
  handoffPhone: string

  @Column({ nullable: true })
  handoffWhatsapp: string

  @Column({ default: 'pt-BR' })
  language: string

  @Column({ type: 'enum', enum: CalendarMode, default: CalendarMode.NONE })
  calendarMode: CalendarMode

  @Column({ nullable: true })
  googleCalendarId: string

  @Column({ nullable: true })
  googleCalendarToken: string

  @Column({ nullable: true })
  googleCalendarRefreshToken: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
