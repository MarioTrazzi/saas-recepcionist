import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { KnowledgeItem, KnowledgeType } from './entities/knowledge-item.entity'
import axios from 'axios'
import { parse } from 'node-html-parser'

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeItem) private itemRepo: Repository<KnowledgeItem>,
  ) {}

  async listByTenant(tenantId: string) {
    return this.itemRepo.find({ where: { tenantId, isActive: true }, order: { createdAt: 'DESC' } })
  }

  async create(tenantId: string, dto: { title: string; content: string; type?: KnowledgeType; sourceFileName?: string }) {
    const item = this.itemRepo.create({ tenantId, ...dto })
    return this.itemRepo.save(item)
  }

  async remove(tenantId: string, id: string) {
    await this.itemRepo.update({ id, tenantId }, { isActive: false })
  }

  async scrapeWebsite(tenantId: string, url: string): Promise<KnowledgeItem[]> {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    let html: string
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-Receptionist-Bot/1.0)' },
        maxContentLength: 1024 * 1024,
      })
      html = response.data
    } catch (e) {
      throw new BadRequestException(`Não foi possível acessar o site: ${e.message}`)
    }

    const root = parse(html)

    // Remove scripts, styles, nav, footer, ads
    root.querySelectorAll('script, style, nav, footer, header, aside, [class*="menu"], [class*="cookie"], [class*="popup"], [id*="menu"], [id*="cookie"]').forEach(el => el.remove())

    const hostname = new URL(url).hostname.replace('www.', '')

    // Extract page title
    const pageTitle = root.querySelector('title')?.text?.trim() || hostname

    // Extract meta description
    const metaDesc = root.querySelector('meta[name="description"]')?.getAttribute('content')?.trim()

    // Extract structured content by sections
    const sections: Array<{ title: string; content: string }> = []

    // Try to get main content areas
    const mainEl = root.querySelector('main, article, [role="main"], .content, #content, .main, #main') || root.querySelector('body')

    if (mainEl) {
      const headings = mainEl.querySelectorAll('h1, h2, h3')

      if (headings.length > 0) {
        headings.forEach((heading) => {
          const title = heading.text.trim()
          if (!title || title.length < 3) return

          // Collect text from siblings until next heading
          let content = ''
          let sibling = heading.nextElementSibling
          let count = 0
          while (sibling && !['H1', 'H2', 'H3'].includes(sibling.tagName) && count < 5) {
            const text = sibling.text.trim()
            if (text.length > 20) content += text + '\n'
            sibling = sibling.nextElementSibling
            count++
          }

          if (content.trim().length > 30) {
            sections.push({ title: `${hostname} — ${title}`, content: content.trim() })
          }
        })
      }

      // Fallback: get all paragraph text if no structured sections found
      if (sections.length === 0) {
        const paragraphs = mainEl.querySelectorAll('p, li')
        const text = paragraphs
          .map(p => p.text.trim())
          .filter(t => t.length > 30)
          .join('\n')

        if (text.length > 50) {
          const chunks = this.chunkText(text, 800)
          chunks.forEach((chunk, i) => {
            sections.push({ title: `${hostname} — conteúdo ${i + 1}`, content: chunk })
          })
        }
      }
    }

    // Always add meta description as first item
    if (metaDesc && metaDesc.length > 20) {
      sections.unshift({ title: `${hostname} — sobre`, content: metaDesc })
    }

    if (sections.length === 0) {
      throw new BadRequestException('Não foi possível extrair conteúdo útil deste site. Tente adicionar as informações manualmente.')
    }

    const items = sections.slice(0, 15).map(s =>
      this.itemRepo.create({
        tenantId,
        type: KnowledgeType.DOCUMENT,
        title: s.title,
        content: s.content,
        sourceFileName: url,
      }),
    )

    return this.itemRepo.save(items)
  }

  async searchRelevant(tenantId: string, query: string): Promise<string> {
    const items = await this.itemRepo.find({ where: { tenantId, isActive: true } })
    if (!items.length) return ''

    const queryLower = query.toLowerCase()
    const scored = items
      .map(item => {
        const text = `${item.title} ${item.content}`.toLowerCase()
        const words = queryLower.split(/\s+/)
        const hits = words.filter(w => text.includes(w)).length
        return { item, score: hits }
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    if (!scored.length) {
      return items.slice(0, 5).map(i => `${i.title}: ${i.content}`).join('\n\n')
    }

    return scored.map(x => `${x.item.title}:\n${x.item.content}`).join('\n\n')
  }

  async importFromText(tenantId: string, text: string, fileName: string) {
    const chunks = this.chunkText(text, 1000)
    const items = chunks.map((chunk, i) =>
      this.itemRepo.create({
        tenantId,
        type: KnowledgeType.DOCUMENT,
        title: `${fileName} — parte ${i + 1}`,
        content: chunk,
        sourceFileName: fileName,
      }),
    )
    return this.itemRepo.save(items)
  }

  private chunkText(text: string, maxChars: number): string[] {
    const chunks: string[] = []
    const paragraphs = text.split(/\n\n+/)
    let current = ''
    for (const para of paragraphs) {
      if ((current + para).length > maxChars && current) {
        chunks.push(current.trim())
        current = ''
      }
      current += para + '\n\n'
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks
  }
}
