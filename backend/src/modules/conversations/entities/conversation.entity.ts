import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum ConversationChannel {
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
  TRANSFERRED = 'transferred',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @Column({ unique: true })
  externalId: string

  @Column({ type: 'enum', enum: ConversationChannel })
  channel: ConversationChannel

  @Column({ nullable: true })
  contactPhone: string

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.ACTIVE })
  status: ConversationStatus

  @Column({ type: 'jsonb', default: [] })
  messages: Array<{ role: string; content: string; timestamp: string }>

  @CreateDateColumn()
  startedAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ nullable: true })
  endedAt: Date
}
