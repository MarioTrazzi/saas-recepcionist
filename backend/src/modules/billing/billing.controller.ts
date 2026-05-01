import { Controller, Get, Post, Body, Param, UseGuards, Request, RawBodyRequest, Req, Headers } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { BillingService } from './billing.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.svc.getPlans()
  }

  @Post('checkout/:plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkout(@Request() req, @Param('plan') plan: any) {
    const url = await this.svc.createCheckoutSession(req.user.tenantId, plan)
    return { url }
  }

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    await this.svc.handleWebhook(req.rawBody as Buffer, sig)
    return { received: true }
  }
}
