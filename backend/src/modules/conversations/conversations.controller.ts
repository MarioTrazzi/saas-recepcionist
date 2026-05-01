import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ConversationsService } from './conversations.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly svc: ConversationsService) {}

  @Get()
  list(@Request() req, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.svc.listByTenant(req.user.tenantId, parseInt(page), parseInt(limit))
  }

  @Get('stats')
  stats(@Request() req) {
    return this.svc.getStats(req.user.tenantId)
  }
}
