import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TenantsModule } from './modules/tenants/tenants.module'
import { AuthModule } from './modules/auth/auth.module'
import { AgentModule } from './modules/agent/agent.module'
import { PhoneModule } from './modules/channels/phone/phone.module'
import { WhatsappModule } from './modules/channels/whatsapp/whatsapp.module'
import { KnowledgeModule } from './modules/knowledge/knowledge.module'
import { ConversationsModule } from './modules/conversations/conversations.module'
import { TemplatesModule } from './modules/templates/templates.module'
import { BillingModule } from './modules/billing/billing.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { CalendarModule } from './modules/calendar/calendar.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        retryAttempts: 10,
        retryDelay: 3000,
        connectTimeoutMS: 10000,
      }),
    }),
    TenantsModule,
    AuthModule,
    AgentModule,
    PhoneModule,
    WhatsappModule,
    KnowledgeModule,
    ConversationsModule,
    TemplatesModule,
    BillingModule,
    DashboardModule,
    CalendarModule,
  ],
})
export class AppModule {}
