import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react'
import { supportApi } from '@/lib/api'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

interface Props {
  currentStep: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const QUICK_PROMPTS_BY_STEP: Record<number, string[]> = {
  1: [
    'Qual template eu escolho pro meu negócio?',
    'Posso mudar o template depois?',
  ],
  2: [
    'Que tom usar pra clínica?',
    'Como escrever uma boa saudação?',
  ],
  3: [
    'O que devo colocar na base de conhecimento?',
    'Posso adicionar mais coisas depois?',
  ],
  4: [
    'O webhook do WhatsApp está aparecendo "Inscrever-se", está certo?',
    'Como publico o app na Meta?',
    'Onde acho o Phone Number ID?',
    'Qual DDD escolher?',
  ],
  5: [
    'Google Agenda ou agenda própria — qual usar?',
    'Como o handoff por WhatsApp funciona?',
  ],
  6: [
    'Posso editar tudo isso depois?',
    'Quanto tempo pra ativar?',
  ],
}

const FALLBACK_PROMPTS = [
  'Tô com dúvida sobre o WhatsApp',
  'Como configuro o número?',
  'O agente não está recebendo mensagens',
]

export function SupportChat({ currentStep, open: controlledOpen, onOpenChange }: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = (v: boolean) => {
    if (!isControlled) setUncontrolledOpen(v)
    onOpenChange?.(v)
  }

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setInput('')
    setSending(true)

    try {
      const { reply } = await supportApi.chat(next, String(currentStep))
      setMessages(curr => [...curr, { role: 'assistant', content: reply }])
    } catch {
      setMessages(curr => [
        ...curr,
        { role: 'assistant', content: 'Não consegui responder agora. Tenta de novo daqui a pouco.' },
      ])
    } finally {
      setSending(false)
    }
  }

  const quickPrompts = QUICK_PROMPTS_BY_STEP[currentStep] ?? FALLBACK_PROMPTS

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 flex items-center justify-center transition-all hover:scale-105"
          aria-label="Abrir chat de suporte"
        >
          <MessageCircle className="h-6 w-6 text-white" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-accent border-2 border-gray-950 animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[min(420px,calc(100vw-2rem))] h-[min(620px,calc(100vh-3rem))] flex flex-col rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-800 bg-gray-900/95 flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Assistente de suporte</p>
              <p className="text-[10px] text-gray-500">Tira dúvidas sobre a configuração</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-200 transition-colors flex-shrink-0"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="rounded-xl bg-primary/10 border border-primary/25 px-3 py-2.5">
                  <p className="text-xs text-primary-foreground/90 leading-relaxed">
                    <strong className="text-primary">Olá!</strong> Posso ajudar com qualquer dúvida sobre o passo {currentStep} —
                    Meta WhatsApp, números, configuração do agente. Qual sua dúvida?
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Perguntas rápidas</p>
                  <div className="space-y-1.5">
                    {quickPrompts.map(p => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        disabled={sending}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-300 transition-colors disabled:opacity-50"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <Message key={i} role={m.role} content={m.content} />
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-gray-500 pl-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando…
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); send(input) }}
            className="flex items-end gap-2 px-3 py-3 border-t border-gray-800 bg-gray-900/95 flex-shrink-0"
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Pergunte algo sobre a configuração…"
              rows={1}
              className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none max-h-32"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 flex items-center justify-center text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}

function Message({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-white text-sm px-3 py-2 leading-relaxed">
          {content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2">
      <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-800 border border-gray-700 text-sm text-gray-100 px-3 py-2 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}
