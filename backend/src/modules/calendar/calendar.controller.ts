import { Controller, Get, Post, Body, Query, Res, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { CalendarService } from './calendar.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly svc: CalendarService) {}

  // Returns Google OAuth URL for the popup
  @Get('google/url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getGoogleUrl(@Request() req) {
    const configured = this.svc.isGoogleConfigured()
    if (!configured) {
      return { url: null, configured: false }
    }
    const url = this.svc.getGoogleAuthUrl(req.user.tenantId)
    return { url, configured: true }
  }

  // Google OAuth callback — public, called by Google
  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Query('state') tenantId: string, @Res() res: Response) {
    try {
      await this.svc.handleGoogleCallback(code, tenantId)
      res.send(`
        <html><body><script>
          window.opener?.postMessage({ googleCalendarConnected: true }, '*');
          setTimeout(() => window.close(), 500);
        </script><p>Conectado! Esta janela vai fechar automaticamente.</p></body></html>
      `)
    } catch (err) {
      res.send(`
        <html><body><script>
          window.opener?.postMessage({ googleCalendarConnected: false, error: '${err.message}' }, '*');
          setTimeout(() => window.close(), 1000);
        </script><p>Erro ao conectar. Tente novamente.</p></body></html>
      `)
    }
  }

  // Setup built-in scheduling
  @Post('builtin/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setupBuiltin(@Request() req, @Body() body: { slotDurationMinutes?: number }) {
    const hours = await this.svc.setupBuiltin(req.user.tenantId, body.slotDurationMinutes)
    return { ok: true, workingHours: hours }
  }

  // Get working hours
  @Get('working-hours')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getWorkingHours(@Request() req) {
    return this.svc.getWorkingHours(req.user.tenantId)
  }

  // Save working hours
  @Post('working-hours')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveWorkingHours(@Request() req, @Body() body: { hours: any[] }) {
    return this.svc.saveWorkingHours(req.user.tenantId, body.hours)
  }

  // List appointments
  @Get('appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listAppointments(@Request() req, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.listAppointments(
      req.user.tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    )
  }

  // Create appointment (used by agent)
  @Post('appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createAppointment(@Request() req, @Body() body: any) {
    return this.svc.createAppointment(req.user.tenantId, body)
  }

  // List events from connected Google Calendar
  @Get('google/events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listGoogleEvents(@Request() req, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.listGoogleEvents(
      req.user.tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    )
  }
}
