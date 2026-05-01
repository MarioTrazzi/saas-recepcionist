import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Tenant, TenantStatus } from './entities/tenant.entity'
import { TenantUser } from './entities/tenant-user.entity'
import * as bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantUser) private userRepo: Repository<TenantUser>,
  ) {}

  async createTenantWithOwner(dto: {
    tenantName: string
    email: string
    password: string
    ownerName: string
  }) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email already in use')

    const slug = dto.tenantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + uuidv4().slice(0, 6)

    const tenant = this.tenantRepo.create({
      name: dto.tenantName,
      slug,
      email: dto.email,
      status: TenantStatus.TRIAL,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })
    await this.tenantRepo.save(tenant)

    const hashed = await bcrypt.hash(dto.password, 10)
    const user = this.userRepo.create({
      tenantId: tenant.id,
      name: dto.ownerName,
      email: dto.email,
      password: hashed,
    })
    await this.userRepo.save(user)

    return { tenant, user }
  }

  async findById(id: string) {
    const t = await this.tenantRepo.findOne({ where: { id } })
    if (!t) throw new NotFoundException('Tenant not found')
    return t
  }

  async update(id: string, data: Partial<Tenant>) {
    await this.tenantRepo.update(id, data)
    return this.findById(id)
  }

  async getUserByEmail(email: string) {
    return this.userRepo.findOne({ where: { email }, select: ['id', 'tenantId', 'name', 'email', 'password', 'role'] })
  }
}
