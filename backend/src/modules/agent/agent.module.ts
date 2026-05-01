import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AgentConfig } from './entities/agent-config.entity'
import { AgentService } from './agent.service'
import { AgentController } from './agent.controller'

@Module({
  imports: [TypeOrmModule.forFeature([AgentConfig])],
  providers: [AgentService],
  controllers: [AgentController],
  exports: [AgentService],
})
export class AgentModule {}
