import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export enum KnowledgeType {
  TEXT = 'text',
  FAQ = 'faq',
  DOCUMENT = 'document',
}

@Entity('knowledge_items')
export class KnowledgeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @Column({ type: 'enum', enum: KnowledgeType, default: KnowledgeType.TEXT })
  type: KnowledgeType

  @Column()
  title: string

  @Column({ type: 'text' })
  content: string

  @Column({ nullable: true })
  sourceFileName: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date
}
