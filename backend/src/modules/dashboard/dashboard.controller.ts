import { Controller, Get, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ConversationsService } from '../conversations/conversations.service'
import { TenantsService } from '../tenants/tenants.service'

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private conversationsService: ConversationsService,
    private tenantsService: TenantsService,
  ) {}

  @Get()
  async getDashboard(@Request() req) {
    const [stats, tenant] = await Promise.all([
      this.conversationsService.getStats(req.user.tenantId),
      this.tenantsService.findById(req.user.tenantId),
    ])

    return {
      tenant: {
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        phoneEnabled: tenant.phoneChannelEnabled,
        phoneNumber: tenant.twilioPhoneNumber ?? null,
        whatsappEnabled: tenant.whatsappChannelEnabled,
        whatsappPhone: tenant.whatsappPhoneNumber ?? null,
        minutesUsed: tenant.minutesUsedThisMonth,
        minutesLimit: tenant.minutesLimitPerMonth,
        usagePercent: Math.round((tenant.minutesUsedThisMonth / tenant.minutesLimitPerMonth) * 100),
      },
      conversations: stats,
    }
  }
}
