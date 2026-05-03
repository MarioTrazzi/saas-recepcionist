import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { google } from 'googleapis'
import { WorkingHours } from './entities/working-hours.entity'
import { Appointment } from './entities/appointment.entity'
import { AgentConfig, CalendarMode } from '../agent/entities/agent-config.entity'

const DEFAULT_WORKING_HOURS = [
  { dayOfWeek: 1, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 2, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 3, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 4, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 5, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 6, startTime: '08:00', endTime: '12:00', isActive: false },
  { dayOfWeek: 0, startTime: '08:00', endTime: '12:00', isActive: false },
]

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name)

  constructor(
    private config: ConfigService,
    @InjectRepository(WorkingHours) private whRepo: Repository<WorkingHours>,
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(AgentConfig) private agentConfigRepo: Repository<AgentConfig>,
  ) {}

  private getOAuthClient() {
    return new google.auth.OAuth2(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
      this.config.get('GOOGLE_REDIRECT_URI'),
    )
  }

  getGoogleAuthUrl(tenantId: string): string {
    const clientId = this.config.get('GOOGLE_CLIENT_ID')
    if (!clientId || clientId.includes('placeholder')) {
      throw new Error('Google OAuth não configurado. Adicione GOOGLE_CLIENT_ID no .env')
    }

    const oauth2 = this.getOAuthClient()
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: tenantId,
    })
  }

  async handleGoogleCallback(code: string, tenantId: string): Promise<void> {
    const oauth2 = this.getOAuthClient()
    const { tokens } = await oauth2.getToken(code)

    oauth2.setCredentials(tokens)
    const calendarApi = google.calendar({ version: 'v3', auth: oauth2 })
    const calList = await calendarApi.calendarList.get({ calendarId: 'primary' })
    const calendarId = calList.data.id || 'primary'

    await this.agentConfigRepo.update(
      { tenantId },
      {
        calendarMode: CalendarMode.GOOGLE,
        googleCalendarToken: tokens.access_token,
        googleCalendarRefreshToken: tokens.refresh_token,
        googleCalendarId: calendarId,
      },
    )

    this.logger.log(`[${tenantId}] Google Calendar connected: ${calendarId}`)
  }

  async setupBuiltin(tenantId: string, slotDurationMinutes = 60): Promise<WorkingHours[]> {
    // Remove existing rows for this tenant
    await this.whRepo.delete({ tenantId })

    const rows = DEFAULT_WORKING_HOURS.map(d =>
      this.whRepo.create({ tenantId, slotDurationMinutes, ...d }),
    )
    const saved = await this.whRepo.save(rows)

    await this.agentConfigRepo.update({ tenantId }, { calendarMode: CalendarMode.BUILTIN })
    this.logger.log(`[${tenantId}] Built-in calendar setup with ${slotDurationMinutes}min slots`)
    return saved
  }

  async getWorkingHours(tenantId: string): Promise<WorkingHours[]> {
    return this.whRepo.find({ where: { tenantId }, order: { dayOfWeek: 'ASC' } })
  }

  async saveWorkingHours(tenantId: string, hours: Partial<WorkingHours>[]): Promise<WorkingHours[]> {
    await this.whRepo.delete({ tenantId })
    const rows = hours.map(h => this.whRepo.create({ tenantId, ...h }))
    return this.whRepo.save(rows)
  }

  async listAppointments(tenantId: string, from?: Date, to?: Date) {
    const qb = this.appointmentRepo.createQueryBuilder('a')
      .where('a."tenantId" = :tenantId', { tenantId })
      .orderBy('a.datetime', 'ASC')
    if (from) qb.andWhere('a.datetime >= :from', { from })
    if (to) qb.andWhere('a.datetime <= :to', { to })
    return qb.getMany()
  }

  async createAppointment(tenantId: string, data: Partial<Appointment>): Promise<Appointment> {
    const appt = this.appointmentRepo.create({ tenantId, ...data })
    return this.appointmentRepo.save(appt)
  }

  isGoogleConfigured(): boolean {
    const id = this.config.get('GOOGLE_CLIENT_ID')
    return !!(id && !id.includes('placeholder'))
  }

  async listGoogleEvents(tenantId: string, from?: Date, to?: Date) {
    const cfg = await this.agentConfigRepo.findOne({ where: { tenantId } })
    if (!cfg?.googleCalendarRefreshToken) {
      throw new Error('Google Calendar não conectado para este tenant')
    }

    const oauth2 = this.getOAuthClient()
    oauth2.setCredentials({
      access_token: cfg.googleCalendarToken,
      refresh_token: cfg.googleCalendarRefreshToken,
    })

    const calendarApi = google.calendar({ version: 'v3', auth: oauth2 })
    const calendarId = cfg.googleCalendarId || 'primary'

    const timeMin = (from ?? new Date()).toISOString()
    const timeMax = (to ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString()

    const res = await calendarApi.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    })

    return (res.data.items ?? []).map(ev => ({
      id: ev.id,
      summary: ev.summary ?? '(sem título)',
      description: ev.description ?? null,
      location: ev.location ?? null,
      start: ev.start?.dateTime ?? ev.start?.date ?? null,
      end: ev.end?.dateTime ?? ev.end?.date ?? null,
      allDay: !ev.start?.dateTime,
      htmlLink: ev.htmlLink ?? null,
      attendees: (ev.attendees ?? []).map(a => ({ email: a.email, responseStatus: a.responseStatus })),
    }))
  }
}
