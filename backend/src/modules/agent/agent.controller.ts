import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { AgentService } from './agent.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('Agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly svc: AgentService) {}

  @Get('config')
  getConfig(@Request() req) {
    return this.svc.getConfig(req.user.tenantId)
  }

  @Put('config')
  upsertConfig(@Request() req, @Body() body: any) {
    return this.svc.upsertConfig(req.user.tenantId, body)
  }

  @Post('tips')
  generateTips(@Request() req, @Body() body: { systemPrompt: string; agentName: string; templateCategory?: string }) {
    return this.svc
      .generateTips(req.user.tenantId, body.systemPrompt || '', body.agentName || '', body.templateCategory)
      .then(tips => ({ tips }))
  }
}
