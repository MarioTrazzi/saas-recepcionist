import { useConversation } from '@11labs/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, PhoneOff, Loader2 } from 'lucide-react'
import { phoneApi } from '@/lib/api'

interface Props {
  agentId: string
}

export default function ConvaiTestWidget({ agentId }: Props) {
  const [error, setError] = useState('')
  const [fetchingToken, setFetchingToken] = useState(false)
  const animFrameRef = useRef<number>()
  const orbRef = useRef<HTMLDivElement>(null)
  const ring1Ref = useRef<HTMLDivElement>(null)
  const ring2Ref = useRef<HTMLDivElement>(null)
  const ring3Ref = useRef<HTMLDivElement>(null)

  const conversation = useConversation({
    onError: (err: any) => setError(typeof err === 'string' ? err : 'Erro na conexão. Tente novamente.'),
    onConnect: () => setError(''),
  })

  const { status, isSpeaking, startSession, endSession, getInputVolume, getOutputVolume } = conversation

  const statusStr = status as string
  const isConnecting = statusStr === 'connecting' || fetchingToken
  const isConnected = statusStr === 'connected'
  const isIdle = !isConnecting && !isConnected

  // ── Audio visualization loop ───────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      ;[ring1Ref, ring2Ref, ring3Ref].forEach(r => {
        if (r.current) { r.current.style.transform = 'scale(1)'; r.current.style.opacity = '0.15' }
      })
      if (orbRef.current) orbRef.current.style.transform = 'scale(1)'
      return
    }

    const tick = () => {
      const vol = isSpeaking ? getOutputVolume() : getInputVolume()
      const smooth = Math.min(vol * 2.5, 1)

      if (orbRef.current) {
        orbRef.current.style.transform = `scale(${1 + smooth * 0.08})`
      }
      if (ring1Ref.current) {
        ring1Ref.current.style.transform = `scale(${1 + smooth * 0.22})`
        ring1Ref.current.style.opacity = `${0.35 + smooth * 0.45}`
      }
      if (ring2Ref.current) {
        ring2Ref.current.style.transform = `scale(${1 + smooth * 0.42})`
        ring2Ref.current.style.opacity = `${0.2 + smooth * 0.3}`
      }
      if (ring3Ref.current) {
        ring3Ref.current.style.transform = `scale(${1 + smooth * 0.65})`
        ring3Ref.current.style.opacity = `${0.08 + smooth * 0.18}`
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [isConnected, isSpeaking, getInputVolume, getOutputVolume])

  const handleStart = useCallback(async () => {
    setError('')
    setFetchingToken(true)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const { signedUrl } = await phoneApi.getConversationToken()
      await startSession({ signedUrl })
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setError('Permissão de microfone negada. Libere o acesso nas configurações do navegador.')
      } else {
        setError(e?.response?.data?.message || e.message || 'Não foi possível iniciar a conversa.')
      }
    } finally {
      setFetchingToken(false)
    }
  }, [startSession])

  const handleStop = useCallback(async () => {
    await endSession()
  }, [endSession])

  const statusLabel = isConnecting
    ? 'Conectando…'
    : isConnected
    ? isSpeaking
      ? 'Agente está falando…'
      : 'Ouvindo você…'
    : 'Clique para testar'

  const orbColor = isConnected
    ? isSpeaking
      ? 'bg-primary shadow-[0_0_32px_rgba(139,92,246,0.6)]'
      : 'bg-emerald-500 shadow-[0_0_32px_rgba(16,185,129,0.6)]'
    : 'bg-gray-700 hover:bg-gray-600'

  const ringColor = isConnected
    ? isSpeaking ? 'border-primary/40' : 'border-emerald-400/40'
    : 'border-gray-600/20'

  return (
    <div className="flex flex-col items-center gap-5 py-6 select-none">

      <div className="relative flex items-center justify-center w-36 h-36">
        <div ref={ring3Ref} className={`absolute inset-0 rounded-full border-2 ${ringColor} transition-none`} style={{ opacity: 0.08 }} />
        <div ref={ring2Ref} className={`absolute inset-4 rounded-full border-2 ${ringColor} transition-none`} style={{ opacity: 0.15 }} />
        <div ref={ring1Ref} className={`absolute inset-8 rounded-full border-2 ${ringColor} transition-none`} style={{ opacity: 0.25 }} />

        <div
          ref={orbRef}
          onClick={isIdle ? handleStart : undefined}
          className={`
            relative z-10 h-16 w-16 rounded-full flex items-center justify-center
            transition-colors duration-300
            ${orbColor}
            ${isIdle ? 'cursor-pointer' : 'cursor-default'}
          `}
          style={{ transition: 'background-color 0.3s, box-shadow 0.3s' }}
        >
          {isConnecting ? (
            <Loader2 className="h-7 w-7 text-white animate-spin" />
          ) : isConnected ? (
            <button
              onClick={handleStop}
              className="absolute inset-0 rounded-full flex items-center justify-center group"
              title="Encerrar conversa"
            >
              <PhoneOff className="h-6 w-6 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <Mic className="h-7 w-7 text-white" />
          )}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className={`text-sm font-medium transition-colors ${
          isConnected
            ? isSpeaking ? 'text-primary' : 'text-emerald-400'
            : 'text-gray-400'
        }`}>
          {statusLabel}
        </p>
        {isConnected && (
          <button
            onClick={handleStop}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors underline underline-offset-2"
          >
            Encerrar
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 text-center max-w-xs">{error}</p>
      )}
    </div>
  )
}
