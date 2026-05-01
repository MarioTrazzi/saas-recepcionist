import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Conversation, ConversationChannel, ConversationStatus } from './entities/conversation.entity'

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation) private repo: Repository<Conversation>,
  ) {}

  async startConversation(dto: { tenantId: string; channel: string; externalId: string; contactPhone: string }) {
    const conv = this.repo.create({
      tenantId: dto.tenantId,
      channel: dto.channel as ConversationChannel,
      externalId: dto.externalId,
      contactPhone: dto.contactPhone,
      messages: [],
    })
    return this.repo.save(conv)
  }

  async getByExternalId(externalId: string) {
    return this.repo.findOne({ where: { externalId } })
  }

  async getHistory(conversationId: string): Promise<Array<{ role: string; content: string }>> {
    const conv = await this.repo.findOne({ where: { id: conversationId } })
    if (!conv) return []
    return conv.messages.map(m => ({ role: m.role, content: m.content }))
  }

  async addMessage(externalId: string, role: string, content: string) {
    const conv = await this.repo.findOne({ where: { externalId } })
    if (!conv) return
    conv.messages = [...(conv.messages || []), { role, content, timestamp: new Date().toISOString() }]
    await this.repo.save(conv)
  }

  async endConversation(externalId: string) {
    const conv = await this.repo.findOne({ where: { externalId } })
    if (!conv) return
    conv.status = ConversationStatus.ENDED
    conv.endedAt = new Date()
    await this.repo.save(conv)
  }

  async listByTenant(tenantId: string, page = 1, limit = 20) {
    const [data, total] = await this.repo.findAndCount({
      where: { tenantId },
      order: { startedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { data, total, page, totalPages: Math.ceil(total / limit) }
  }

  async getStats(tenantId: string) {
    const total = await this.repo.count({ where: { tenantId } })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = await this.repo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.startedAt >= :today', { today })
      .getCount()
    const byChannel = await this.repo
      .createQueryBuilder('c')
      .select('c.channel', 'channel')
      .addSelect('COUNT(*)', 'count')
      .where('c.tenantId = :tenantId', { tenantId })
      .groupBy('c.channel')
      .getRawMany()

    return { total, today: todayCount, byChannel }
  }
}
