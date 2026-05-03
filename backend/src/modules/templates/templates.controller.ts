import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { TemplatesService } from './templates.service'

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  @Get()
  list() {
    return this.svc.listPublic()
  }

  @Post('custom/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async generateCustom(@Body() body: { description: string }) {
    return this.svc.generateCustom(body.description ?? '')
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findById(id)
  }
}
