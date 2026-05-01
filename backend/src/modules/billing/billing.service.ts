import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TenantsService } from '../tenants/tenants.service'
import Stripe from 'stripe'
import { TenantPlan, TenantStatus } from '../tenants/entities/tenant.entity'

const PLANS: Record<string, { priceId: string; name: string; minutes: number; price: number }> = {
  starter: { priceId: 'price_starter', name: 'Starter', minutes: 100, price: 97 },
  pro: { priceId: 'price_pro', name: 'Pro', minutes: 500, price: 297 },
  enterprise: { priceId: 'price_enterprise', name: 'Enterprise', minutes: 2000, price: 797 },
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)
  private stripe: Stripe

  constructor(
    private config: ConfigService,
    private tenantsService: TenantsService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' })
  }

  async createCheckoutSession(tenantId: string, plan: TenantPlan): Promise<string> {
    const tenant = await this.tenantsService.findById(tenantId)
    const planConfig = PLANS[plan]

    let customerId = tenant.stripeCustomerId
    if (!customerId) {
      const customer = await this.stripe.customers.create({ email: tenant.email, name: tenant.name })
      customerId = customer.id
      await this.tenantsService.update(tenantId, { stripeCustomerId: customerId })
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${this.config.get('FRONTEND_URL')}/dashboard?upgraded=true`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/billing`,
      metadata: { tenantId, plan },
    })

    return session.url
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(payload, signature, this.config.get('STRIPE_WEBHOOK_SECRET'))

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { tenantId, plan } = session.metadata
        await this.tenantsService.update(tenantId, {
          plan: plan as TenantPlan,
          status: TenantStatus.ACTIVE,
          stripeSubscriptionId: session.subscription as string,
          minutesLimitPerMonth: PLANS[plan].minutes,
        })
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const tenant = await this.findByStripeSubscription(sub.id)
        if (tenant) {
          await this.tenantsService.update(tenant.id, { status: TenantStatus.CANCELLED })
        }
        break
      }
    }
  }

  async getPlans() {
    return Object.entries(PLANS).map(([key, val]) => ({ id: key, ...val }))
  }

  private async findByStripeSubscription(subscriptionId: string) {
    return null
  }
}
