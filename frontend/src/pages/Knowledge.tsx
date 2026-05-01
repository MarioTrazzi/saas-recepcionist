import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Trash2, Upload, FileText, BookOpen, Globe, Loader2, Lightbulb, ChevronDown } from 'lucide-react'
import { knowledgeApi, agentApi } from '@/lib/api'
import { getSuggestions } from '@/lib/knowledge-suggestions'

export default function KnowledgePage() {
  const qc = useQueryClient()
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const { data: items = [], isLoading } = useQuery({ queryKey: ['knowledge'], queryFn: knowledgeApi.list })
  const { data: agentConfig } = useQuery({ queryKey: ['agent-config'], queryFn: agentApi.getConfig, retry: false })

  // Derive category from agent config — stored in systemPrompt or we use a heuristic
  // For now, pull from templates by matching agent name patterns
  const category = detectCategoryFromConfig(agentConfig)
  const suggestions = getSuggestions(category)

  const addMutation = useMutation({
    mutationFn: () => knowledgeApi.create({ title: newTitle, content: newContent }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['knowledge'] }); setNewTitle(''); setNewContent('') },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => knowledgeApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => knowledgeApi.upload(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })

  const handleScrape = async () => {
    if (!siteUrl.trim()) return
    setScraping(true)
    setScrapeMsg(null)
    try {
      const result = await knowledgeApi.scrape(siteUrl)
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      setScrapeMsg({ type: 'success', text: `${result.length} seção(ões) importada(s) com sucesso!` })
      setSiteUrl('')
    } catch (e: any) {
      setScrapeMsg({ type: 'error', text: e.response?.data?.message || 'Não foi possível acessar o site.' })
    } finally {
      setScraping(false)
    }
  }

  const applySuggestion = (s: any) => {
    setNewTitle(s.title)
    setNewContent(s.example)
    setShowSuggestions(false)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Base de Conhecimento</h1>
          <p className="text-gray-400 text-sm mt-1">Informações que seu agente usa para responder clientes</p>
        </div>
        <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
          {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload .txt
          <input type="file" accept=".txt,.md" className="hidden" onChange={e => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])} />
        </label>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: forms */}
        <div className="lg:col-span-1 space-y-4">

          {/* Website scraping */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-primary" /> Importar do site
            </h2>
            <p className="text-xs text-gray-400 mb-3">Cole a URL e extraímos o conteúdo automaticamente</p>
            <input
              className="input mb-2"
              value={siteUrl}
              onChange={e => setSiteUrl(e.target.value)}
              placeholder="https://www.seusite.com.br"
              onKeyDown={e => e.key === 'Enter' && handleScrape()}
            />
            <button
              onClick={handleScrape}
              disabled={!siteUrl.trim() || scraping}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              {scraping ? 'Importando...' : 'Importar site'}
            </button>
            {scrapeMsg && (
              <p className={`text-xs mt-2 ${scrapeMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {scrapeMsg.text}
              </p>
            )}
          </div>

          {/* Manual add */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Adicionar manualmente
            </h2>
            <input className="input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título" />
            <textarea
              className="input min-h-[100px] resize-none"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Conteúdo..."
            />
            <button
              onClick={() => addMutation.mutate()}
              disabled={!newTitle || !newContent || addMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {addMutation.isPending ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>

          {/* Suggestions */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/40 transition-colors"
            >
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                Sugestões para o seu setor
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
            </button>
            {showSuggestions && (
              <div className="border-t border-gray-800 p-3 space-y-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion(s)}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-gray-800 transition-colors text-left group"
                  >
                    <span className="text-lg flex-shrink-0">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 group-hover:text-white">{s.title}</p>
                      <p className="text-[11px] text-gray-500 truncate">{s.description}</p>
                    </div>
                    <Plus className="h-3 w-3 text-gray-600 group-hover:text-primary flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: items list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">{items.length} item(s) na base</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="card p-12 text-center">
              <BookOpen className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma informação adicionada ainda</p>
              <p className="text-sm text-gray-600 mt-1">Use o formulário ao lado ou importe do seu site</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="card p-4 flex items-start gap-3 hover:border-gray-700 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {item.sourceFileName?.startsWith('http') ? (
                      <Globe className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.content}</p>
                    {item.sourceFileName && (
                      <p className="text-[11px] text-gray-600 mt-1 truncate">
                        {item.sourceFileName.startsWith('http') ? '🌐 ' : '📄 '}{item.sourceFileName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function detectCategoryFromConfig(config: any): string {
  if (!config) return 'custom'
  const name = (config.agentName || '').toLowerCase()
  const prompt = (config.systemPrompt || '').toLowerCase()
  if (prompt.includes('clínica') || prompt.includes('consulta') || prompt.includes('médic')) return 'clinic'
  if (prompt.includes('restaurante') || prompt.includes('cardápio') || prompt.includes('delivery')) return 'restaurant'
  if (prompt.includes('loja') || prompt.includes('produto') || prompt.includes('estoque')) return 'retail'
  if (prompt.includes('imóvel') || prompt.includes('imobiliária') || prompt.includes('aluguel')) return 'real_estate'
  if (prompt.includes('curso') || prompt.includes('escola') || prompt.includes('ensino')) return 'education'
  return 'services'
}
