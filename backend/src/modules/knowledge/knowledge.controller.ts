import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { KnowledgeService } from './knowledge.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('Knowledge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly svc: KnowledgeService) {}

  @Get()
  list(@Request() req) {
    return this.svc.listByTenant(req.user.tenantId)
  }

  @Post()
  create(@Request() req, @Body() body: { title: string; content: string; type?: any }) {
    return this.svc.create(req.user.tenantId, body)
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.svc.remove(req.user.tenantId, id)
  }

  @Post('scrape')
  scrape(@Request() req, @Body() body: { url: string }) {
    return this.svc.scrapeWebsite(req.user.tenantId, body.url)
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async upload(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const text = file.buffer.toString('utf-8')
    return this.svc.importFromText(req.user.tenantId, text, file.originalname)
  }
}
