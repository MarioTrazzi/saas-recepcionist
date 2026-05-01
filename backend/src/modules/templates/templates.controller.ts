import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TemplatesService } from './templates.service'

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  @Get()
  list() {
    return this.svc.listPublic()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findById(id)
  }
}
