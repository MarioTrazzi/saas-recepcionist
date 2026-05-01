import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { WhatsappService } from './whatsapp.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly svc: WhatsappService) {}

  @Post('webhook/:tenantId')
  async webhook(@Param('tenantId') tenantId: string, @Body() body: any) {
    const event = body?.data
    if (!event || event.messageType !== 'conversation') return { ok: true }

    const from = event.key?.remoteJid?.replace('@s.whatsapp.net', '')
    const message = event.message?.conversation || event.message?.extendedTextMessage?.text
    if (!from || !message) return { ok: true }

    await this.svc.handleIncoming(tenantId, from, message, event.key?.id)
    return { ok: true }
  }

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setup(@Request() req, @Body() body: { phoneNumber: string }) {
    return this.svc.createInstance(req.user.tenantId, body.phoneNumber)
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async status(@Request() req) {
    return this.svc.checkStatus(req.user.tenantId)
  }
}
