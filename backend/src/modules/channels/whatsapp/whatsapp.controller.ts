import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { WhatsappService } from './whatsapp.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly svc: WhatsappService) {}

  // ── Meta Cloud API webhook — verification (GET) ───────────────────────────
  @Get('meta-webhook')
  verifyMetaWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.svc.verifyWebhook(mode, token, challenge)
    res.send(result)
  }

  // ── Meta Cloud API webhook — incoming messages (POST) ─────────────────────
  @Post('meta-webhook')
  async metaWebhook(@Body() body: any) {
    await this.svc.handleMetaWebhook(body)
    return { ok: true }
  }

  // ── Authenticated: configure Cloud API credentials ────────────────────────
  @Post('setup-cloudapi')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setupCloudApi(
    @Request() req,
    @Body() body: { phoneNumberId: string; accessToken: string },
  ) {
    return this.svc.setupCloudApi(req.user.tenantId, body.phoneNumberId, body.accessToken)
  }

  // ── Authenticated: connection status ─────────────────────────────────────
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async status(@Request() req) {
    return this.svc.checkStatus(req.user.tenantId)
  }

  // ── Baileys webhook (kept for backward compat) ────────────────────────────
  @Post('webhook/:tenantId')
  async baileysWebhook(@Param('tenantId') tenantId: string, @Body() body: any) {
    const event = body?.data
    if (!event || event.messageType !== 'conversation') return { ok: true }
    if (event.key?.fromMe) return { ok: true }
    const remoteJid: string = event.key?.remoteJid || ''
    if (remoteJid.endsWith('@g.us')) return { ok: true }
    const from = remoteJid.replace('@s.whatsapp.net', '')
    const message = event.message?.conversation || event.message?.extendedTextMessage?.text
    if (!from || !message) return { ok: true }
    await this.svc.handleIncoming(tenantId, from, message, event.key?.id)
    return { ok: true }
  }

  // ── Baileys setup (kept for backward compat) ──────────────────────────────
  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setup(@Request() req, @Body() body: { phoneNumber: string }) {
    return this.svc.createInstance(req.user.tenantId, body.phoneNumber)
  }
}
