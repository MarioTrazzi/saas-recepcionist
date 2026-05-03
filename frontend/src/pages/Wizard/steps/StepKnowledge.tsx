import { useState } from 'react'
import { ChevronRight, ChevronLeft, Plus, Trash2, Upload, FileText, Globe, Loader2, Lightbulb, ChevronDown, CheckCircle2 } from 'lucide-react'
import { WizardData } from '../index'
import { getSuggestions } from '@/lib/knowledge-suggestions'
import { getTemplateContext } from '@/lib/template-context'
import { knowledgeApi } from '@/lib/api'

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepKnowledge({ data, update, onNext, onBack }: Props) {
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [siteUrl, setSiteUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [scrapeSuccess, setScrapeSuccess] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)

  const suggestions = getSuggestions(data.templateCategory || 'custom')
  const ctx = getTemplateContext(data.templateCategory)

  const addItem = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    update({ knowledgeItems: [...data.knowledgeItems, { title: newTitle, content: newContent }] })
    setNewTitle('')
    setNewContent('')
  }

  const removeItem = (i: number) => {
    update({ knowledgeItems: data.knowledgeItems.filter((_, idx) => idx !== i) })
  }

  const addedTitles = new Set(data.knowledgeItems.map(i => i.title))

  const applySuggestion = (s: { title: string; example: string }) => {
    if (addedTitles.has(s.title)) return
    update({ knowledgeItems: [...data.knowledgeItems, { title: s.title, content: s.example }] })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const text = await file.text()
    update({ knowledgeItems: [...data.knowledgeItems, { title: file.name, content: text.slice(0, 2000) }] })
    setUploading(false)
    e.target.value = ''
  }

  const handleScrape = async () => {
    if (!siteUrl.trim()) return
    setScraping(true)
    setScrapeError('')
    setScrapeSuccess('')
    try {
      // In wizard we store scraped items locally (saved to DB on finish)
      const url = siteUrl.startsWith('http') ? siteUrl : 'https://' + siteUrl
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' }).catch(() => null)

      // Call backend scrape (needs auth token — not available in wizard yet)
      // Store as local items for now, will be saved on activation
      const hostname = new URL(url).hostname.replace('www.', '')
      update({
        knowledgeItems: [
          ...data.knowledgeItems,
          { title: `Site: ${hostname}`, content: `URL para importar: ${url}\n\nEste conteúdo será importado automaticamente quando você ativar o agente.` },
        ],
        siteUrl: url,
      } as any)
      setScrapeSuccess(`Site ${hostname} marcado para importação. O conteúdo será extraído ao ativar.`)
      setSiteUrl('')
    } catch (e: any) {
      setScrapeError('URL inválida. Verifique e tente novamente.')
    } finally {
      setScraping(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Base de conhecimento</h2>
      <p className="text-gray-400 mb-8">Ensine seu agente sobre seu negócio. Quanto mais informação, melhor o atendimento.</p>

      <div className="max-w-3xl space-y-6">

        {/* Website scraping */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-primary" />
            Importar do seu site
          </h3>
          <p className="text-xs text-gray-400 mb-3">Cole o endereço do seu site e extraímos as informações automaticamente</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={siteUrl}
              onChange={e => setSiteUrl(e.target.value)}
              placeholder="https://www.seusite.com.br"
              onKeyDown={e => e.key === 'Enter' && handleScrape()}
            />
            <button
              onClick={handleScrape}
              disabled={!siteUrl.trim() || scraping}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
            >
              {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              {scraping ? 'Buscando...' : 'Importar'}
            </button>
          </div>
          {scrapeError && <p className="text-red-400 text-xs mt-2">{scrapeError}</p>}
          {scrapeSuccess && <p className="text-green-400 text-xs mt-2">{scrapeSuccess}</p>}
        </div>

        {/* Smart suggestions */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Documentos sugeridos para {ctx.label}</h3>
              <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">{suggestions.length} sugestões</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
          </button>

          {showSuggestions && (
            <div className="border-t border-gray-800 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((s, i) => {
                  const added = addedTitles.has(s.title)
                  return (
                    <button
                      key={i}
                      onClick={() => applySuggestion(s)}
                      disabled={added}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors text-left group relative border ${
                        added
                          ? 'border-primary/40 bg-primary/5 cursor-default'
                          : 'border-transparent hover:bg-gray-800 hover:border-gray-700 cursor-pointer'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${added ? 'text-primary' : 'text-gray-200 group-hover:text-white'}`}>
                          {s.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                      </div>
                      {added
                        ? <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        : <Plus className="h-3.5 w-3.5 text-gray-600 group-hover:text-primary flex-shrink-0 mt-0.5" />
                      }
                    </button>
                  )
                })}
              </div>
              {addedTitles.size > 0 && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-1 border-t border-gray-800">
                  <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                  {addedTitles.size} documento(s) adicionado(s). Role abaixo para editar o conteúdo conforme sua realidade.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Items already added — inline editable */}
        {data.knowledgeItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Adicionados ({data.knowledgeItems.length}) — edite o conteúdo conforme sua realidade
            </p>
            {data.knowledgeItems.map((item, i) => (
              <div key={i} className="card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <input
                    className="flex-1 bg-transparent text-sm font-medium text-white outline-none border-b border-transparent focus:border-gray-600 transition-colors py-0.5"
                    value={item.title}
                    onChange={e => {
                      const updated = [...data.knowledgeItems]
                      updated[i] = { ...updated[i], title: e.target.value }
                      update({ knowledgeItems: updated })
                    }}
                  />
                  <button onClick={() => removeItem(i)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 resize-none outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  rows={4}
                  value={item.content}
                  onChange={e => {
                    const updated = [...data.knowledgeItems]
                    updated[i] = { ...updated[i], content: e.target.value }
                    update({ knowledgeItems: updated })
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Manual add */}
        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">Adicionar manualmente</h3>
          <input
            className="input"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder={ctx.manualKnowledgePlaceholder.title}
          />
          <textarea
            className="input min-h-[80px] resize-none"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder={ctx.manualKnowledgePlaceholder.content}
          />
          <div className="flex gap-2">
            <button onClick={addItem} disabled={!newTitle || !newContent} className="btn-secondary flex items-center gap-2 text-sm py-2 disabled:opacity-50">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
            <label className="btn-secondary flex items-center gap-2 text-sm py-2 cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload .txt
              <input type="file" accept=".txt,.md" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Você pode adicionar e editar mais conteúdo a qualquer momento no painel principal.
        </p>
      </div>

      <div className="flex gap-3 mt-10">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <button onClick={onNext} className="btn-primary flex items-center gap-2">
          Continuar <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

