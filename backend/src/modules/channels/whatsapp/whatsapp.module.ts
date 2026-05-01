import { Module } from '@nestjs/common'
import { WhatsappService } from './whatsapp.service'
import { WhatsappController } from './whatsapp.controller'
import { AgentModule } from '../../agent/agent.module'
import { KnowledgeModule } from '../../knowledge/knowledge.module'
import { ConversationsModule } from '../../conversations/conversations.module'
import { TenantsModule } from '../../tenants/tenants.module'

@Module({
  imports: [AgentModule, KnowledgeModule, ConversationsModule, TenantsModule],
  providers: [WhatsappService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
