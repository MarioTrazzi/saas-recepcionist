import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export enum TemplateCategory {
  CLINIC = 'clinic',
  RESTAURANT = 'restaurant',
  RETAIL = 'retail',
  SERVICES = 'services',
  REAL_ESTATE = 'real_estate',
  EDUCATION = 'education',
  CUSTOM = 'custom',
}

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'enum', enum: TemplateCategory })
  category: TemplateCategory

  @Column()
  name: string

  @Column()
  description: string

  @Column()
  agentName: string

  @Column({ type: 'text' })
  systemPrompt: string

  @Column()
  greetingMessage: string

  @Column({ type: 'jsonb', default: [] })
  sampleKnowledge: Array<{ title: string; content: string }>

  @Column({ type: 'boolean', default: true })
  isPublic: boolean

  @Column({ nullable: true })
  previewImageUrl: string

  @CreateDateColumn()
  createdAt: Date
}
