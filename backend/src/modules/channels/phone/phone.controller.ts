import { Controller, Post, Body, Param, Res, UseGuards, Request, Get, Patch, Headers } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { PhoneService } from './phone.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@ApiTags('Phone')
@Controller('phone')
export class PhoneController {
  constructor(private readonly svc: PhoneService) {}

  // Twilio webhook — incoming call (public, validated by Twilio signature)
  @Post('incoming/:tenantId')
  async incoming(@Param('tenantId') tenantId: string, @Body() body: any, @Res() res: Response) {
    const twiml = await this.svc.handleIncomingCall(tenantId, body.CallSid, body.From)
    res.set('Content-Type', 'text/xml').send(twiml)
  }

  // Twilio webhook — speech recognition result
  @Post('speech/:tenantId/:callSid')
  async speech(@Param('tenantId') tenantId: string, @Param('callSid') callSid: string, @Body() body: any, @Res() res: Response) {
    const twiml = await this.svc.handleSpeechInput(tenantId, callSid, body.SpeechResult || '')
    res.set('Content-Type', 'text/xml').send(twiml)
  }

  // Twilio webhook — call status callback
  @Post('status/:tenantId')
  async status(@Param('tenantId') tenantId: string, @Body() body: any) {
    if (body.CallStatus === 'completed') {
      await this.svc.handleCallEnd(tenantId, body.CallSid, body.CallDuration)
    }
    return { ok: true }
  }

  // Authenticated — list numbers already on the Twilio account
  @Get('numbers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listNumbers() {
    return this.svc.listAccountNumbers()
  }

  // Authenticated — assign an existing Twilio number to this tenant
  @Post('assign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async assign(@Request() req, @Body() body: { phoneSid: string }) {
    const phone = await this.svc.assignExistingNumber(req.user.tenantId, body.phoneSid)
    return { phoneNumber: phone }
  }

  // Authenticated — provision a new phone number
  @Post('provision')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async provision(@Request() req, @Body() body: { areaCode?: string }) {
    const phone = await this.svc.provisionPhoneNumber(req.user.tenantId, body.areaCode)
    return { phoneNumber: phone }
  }

  // Authenticated — create ElevenLabs agent
  @Post('create-elevenlabs-agent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createAgent(@Request() req) {
    const agentId = await this.svc.createElevenLabsAgent(req.user.tenantId)
    return { agentId }
  }

  // Authenticated — get current ElevenLabs agent config
  @Get('elevenlabs-agent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getElevenLabsAgent(@Request() req) {
    return this.svc.getElevenLabsAgent(req.user.tenantId)
  }

  // Authenticated — update ElevenLabs agent config
  @Patch('elevenlabs-agent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateElevenLabsAgent(@Request() req, @Body() body: any) {
    return this.svc.updateElevenLabsAgent(req.user.tenantId, body)
  }

  // Authenticated — list ElevenLabs voices for this account
  @Get('elevenlabs-voices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listVoices() {
    return this.svc.listElevenLabsVoices()
  }

  // Public webhook — called by ElevenLabs when agent decides to transfer the call
  @Post('transfer/:agentId')
  async transfer(@Param('agentId') agentId: string) {
    return this.svc.transferCall(agentId)
  }
}
