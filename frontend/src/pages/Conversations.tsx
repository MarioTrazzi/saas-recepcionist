import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Phone, MessageSquare, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { conversationsApi } from '@/lib/api'

export default function ConversationsPage() {
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data, isLoading } = useQuery({ queryKey: ['conversations', page], queryFn: () => conversationsApi.list(page) })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Conversas</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : !data?.data?.length ? (
        <div className="card p-12 text-center">
          <MessageSquare className="h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma conversa ainda</p>
          <p className="text-sm text-gray-600 mt-1">As conversas aparecerão aqui quando seu agente começar a atender</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.data.map((conv: any) => (
            <div key={conv.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${conv.channel === 'phone' ? 'bg-primary/20' : 'bg-green-500/20'}`}>
                  {conv.channel === 'phone'
                    ? <Phone className="h-3.5 w-3.5 text-primary" />
                    : <MessageSquare className="h-3.5 w-3.5 text-green-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{conv.contactPhone || 'Desconhecido'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      conv.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      conv.status === 'ended' ? 'bg-gray-700 text-gray-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {conv.status === 'active' ? 'Ativo' : conv.status === 'ended' ? 'Encerrado' : 'Transferido'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3 text-gray-600" />
                    <p className="text-xs text-gray-500">{new Date(conv.startedAt).toLocaleString('pt-BR')}</p>
                    <span className="text-xs text-gray-600">• {conv.messages?.length ?? 0} mensagens</span>
                  </div>
                </div>
                {expanded === conv.id ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>

              {expanded === conv.id && conv.messages?.length > 0 && (
                <div className="border-t border-gray-800 p-4 space-y-3 max-h-64 overflow-y-auto">
                  {conv.messages.map((msg: any, i: number) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.role === 'user' ? 'bg-gray-800 text-gray-200' : 'bg-primary/20 text-gray-100'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">← Anterior</button>
          <span className="text-sm text-gray-400 py-1.5 px-3">{page} / {data.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === data.totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">Próxima →</button>
        </div>
      )}
    </div>
  )
}
