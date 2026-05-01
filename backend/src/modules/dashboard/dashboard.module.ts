import { Module } from '@nestjs/common'
import { DashboardController } from './dashboard.controller'
import { ConversationsModule } from '../conversations/conversations.module'
import { TenantsModule } from '../tenants/tenants.module'

@Module({
  imports: [ConversationsModule, TenantsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
