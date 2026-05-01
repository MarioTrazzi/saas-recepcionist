import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { TenantsService } from './tenants.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('Tenant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenant')
export class TenantsController {
  constructor(private readonly svc: TenantsService) {}

  @Get('me')
  async getMyTenant(@Request() req) {
    return this.svc.findById(req.user.tenantId)
  }

  @Patch('me')
  async updateMyTenant(@Request() req, @Body() body: any) {
    const allowed = ['name']
    const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
    return this.svc.update(req.user.tenantId, data)
  }
}
