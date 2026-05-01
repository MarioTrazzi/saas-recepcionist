import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CalendarController } from './calendar.controller'
import { CalendarService } from './calendar.service'
import { WorkingHours } from './entities/working-hours.entity'
import { Appointment } from './entities/appointment.entity'
import { AgentConfig } from '../agent/entities/agent-config.entity'

@Module({
  imports: [TypeOrmModule.forFeature([WorkingHours, Appointment, AgentConfig])],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
