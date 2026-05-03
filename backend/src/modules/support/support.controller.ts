import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { SupportService, SupportMessage } from './support.service'

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly svc: SupportService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async chat(@Body() body: { messages: SupportMessage[]; currentStep?: string }) {
    const reply = await this.svc.chat(body.messages ?? [], body.currentStep)
    return { reply }
  }
}
