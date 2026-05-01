import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Tenant } from './entities/tenant.entity'
import { TenantUser } from './entities/tenant-user.entity'
import { TenantsService } from './tenants.service'
import { TenantsController } from './tenants.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantUser])],
  providers: [TenantsService],
  controllers: [TenantsController],
  exports: [TenantsService],
})
export class TenantsModule {}
