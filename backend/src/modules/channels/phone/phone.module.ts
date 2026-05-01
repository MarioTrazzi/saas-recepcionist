import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PhoneService } from './phone.service'
import { PhoneController } from './phone.controller'
import { AgentModule } from '../../agent/agent.module'
import { KnowledgeModule } from '../../knowledge/knowledge.module'
import { ConversationsModule } from '../../conversations/conversations.module'
import { TenantsModule } from '../../tenants/tenants.module'

@Module({
  imports: [AgentModule, KnowledgeModule, ConversationsModule, TenantsModule],
  providers: [PhoneService],
  controllers: [PhoneController],
  exports: [PhoneService],
})
export class PhoneModule {}
