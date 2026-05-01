import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('working_hours')
export class WorkingHours {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @Column({ type: 'int' }) // 0=Sun, 1=Mon, ..., 6=Sat
  dayOfWeek: number

  @Column({ default: '08:00' })
  startTime: string

  @Column({ default: '18:00' })
  endTime: string

  @Column({ type: 'int', default: 60 })
  slotDurationMinutes: number

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
