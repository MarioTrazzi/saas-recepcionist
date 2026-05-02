import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Res, Logger } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { WhatsappService } from './whatsapp.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name)
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
    this.logger.log(`Meta webhook received: ${JSON.stringify(body).substring(0, 500)}`)
    try {
      await this.svc.handleMetaWebhook(body)
    } catch (err: any) {
      this.logger.error(`Meta webhook error: ${err.message}`)
    }
    return { ok: true }
  }

  // ── Admin: update Meta token (temporary) ────────────────────────────────
  @Post('admin-update-token')
  async adminUpdateToken(
    @Body() body: { secret: string; tenantId: string; accessToken: string },
  ) {
    if (body.secret !== 'fix-whatsapp-2026') {
      return { ok: false, error: 'Invalid secret' }
    }
    await this.svc.adminUpdateToken(body.tenantId, body.accessToken)
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

  // ── Authenticated: configure Evolution API fallback ──────────────────────
  @Post('setup-evolution-fallback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setupEvolutionFallback(
    @Request() req,
    @Body() body: { evolutionApiUrl: string; evolutionApiKey: string; phoneNumber: string },
  ) {
    return this.svc.setupEvolutionFallback(req.user.tenantId, body.evolutionApiUrl, body.evolutionApiKey, body.phoneNumber)
  }

  // ── Authenticated: connection status ─────────────────────────────────────
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async status(@Request() req) {
    return this.svc.checkStatus(req.user.tenantId)
  }

  // ── Authenticated: clear unanswered messages ─────────────────────────────
  @Post('clear-unanswered')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async clearUnanswered(@Request() req) {
    await this.svc.clearUnansweredMessages(req.user.tenantId)
    return { ok: true }
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
