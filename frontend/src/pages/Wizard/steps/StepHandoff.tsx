import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronLeft, UserCheck, Calendar, CheckCircle, Loader2, ExternalLink, Clock, Info } from 'lucide-react'
import { WizardData } from '../index'
import { calendarApi } from '@/lib/api'
import { getTemplateContext } from '@/lib/template-context'

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

const HANDOFF_OPTIONS = [
  { value: 'none', label: 'Sem transferência', desc: 'O agente lida com tudo sozinho' },
  { value: 'phone', label: 'Transferir ligação', desc: 'Quando necessário, transfere para um número de telefone' },
  { value: 'whatsapp', label: 'Avisar por WhatsApp', desc: 'Envia um aviso para seu WhatsApp quando precisa de ajuda' },
  { value: 'both', label: 'Ambos', desc: 'Transfere a ligação e avisa por WhatsApp' },
]

const SLOT_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
]

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type GoogleState = 'idle' | 'loading' | 'connected' | 'error' | 'not_configured'

export function StepHandoff({ data, update, onNext, onBack }: Props) {
  const ctx = getTemplateContext(data.templateCategory)
  const [googleState, setGoogleState] = useState<GoogleState>('idle')
  const [googleError, setGoogleError] = useState('')

  // Working hours state: Mon–Fri active by default
  const [workingHours, setWorkingHours] = useState([
    { dayOfWeek: 0, label: 'Dom', startTime: '08:00', endTime: '18:00', isActive: false },
    { dayOfWeek: 1, label: 'Seg', startTime: '08:00', endTime: '18:00', isActive: true },
    { dayOfWeek: 2, label: 'Ter', startTime: '08:00', endTime: '18:00', isActive: true },
    { dayOfWeek: 3, label: 'Qua', startTime: '08:00', endTime: '18:00', isActive: true },
    { dayOfWeek: 4, label: 'Qui', startTime: '08:00', endTime: '18:00', isActive: true },
    { dayOfWeek: 5, label: 'Sex', startTime: '08:00', endTime: '18:00', isActive: true },
    { dayOfWeek: 6, label: 'Sáb', startTime: '08:00', endTime: '12:00', isActive: false },
  ])

  // Listen for Google OAuth popup result
  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.data?.googleCalendarConnected === true) {
      setGoogleState('connected')
      update({ googleCalendarConnected: true, calendarMode: 'google' })
    } else if (e.data?.googleCalendarConnected === false) {
      setGoogleState('error')
      setGoogleError(e.data.error || 'Falha na autenticação')
    }
  }, [update])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  const connectGoogle = async () => {
    setGoogleState('loading')
    setGoogleError('')
    try {
      const { url, configured } = await calendarApi.googleUrl()
      if (!configured || !url) {
        setGoogleState('not_configured')
        return
      }
      window.open(url, 'google-auth', 'width=520,height=620,left=200,top=100')
      setGoogleState('idle') // waiting for postMessage
    } catch {
      setGoogleState('error')
      setGoogleError('Não foi possível iniciar a autenticação')
    }
  }

  const updateDay = (dayOfWeek: number, field: string, value: any) => {
    setWorkingHours(prev => prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
  }

  // Default the calendar slot duration to the value that fits the template,
  // unless the user already customized it (i.e. it differs from the generic 60 default).
  useEffect(() => {
    if (data.calendarSlotMinutes === 60 && ctx.defaultSlotMinutes !== 60) {
      update({ calendarSlotMinutes: ctx.defaultSlotMinutes })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Transferência e Agendamento</h2>
      <p className="text-gray-400 mb-8">Configure quando o agente deve acionar um humano e como gerenciar agendamentos.</p>

      <div className="max-w-2xl space-y-6">

        {/* Handoff options */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Transferência para humano</h3>
          <div className="flex items-start gap-2 mb-3 text-xs text-gray-500 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2">
            <Info className="h-3.5 w-3.5 text-primary/80 flex-shrink-0 mt-0.5" />
            <p>{ctx.handoffHint}</p>
          </div>
          <div className="space-y-2">
            {HANDOFF_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ handoffMode: opt.value })}
                className={`card p-4 w-full text-left transition-all hover:border-gray-700 flex items-start gap-3 ${data.handoffMode === opt.value ? 'border-primary ring-1 ring-primary' : ''}`}
              >
                <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${data.handoffMode === opt.value ? 'border-primary bg-primary' : 'border-gray-600'}`} />
                <div>
                  <p className="font-medium text-sm text-white">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {(data.handoffMode === 'phone' || data.handoffMode === 'both') && (
          <div>
            <label className="text-sm text-gray-300 block mb-1.5">
              <UserCheck className="h-4 w-4 inline mr-1" />
              Telefone para transferência
            </label>
            <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden bg-gray-800 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
              <span className="px-3 py-2 text-sm text-gray-400 bg-gray-700/60 border-r border-gray-700 select-none">+55</span>
              <input
                className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none"
                value={data.handoffPhone.replace(/^\+55/, '')}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '')
                  update({ handoffPhone: digits ? `+55${digits}` : '' })
                }}
                placeholder="11 99999-9999"
                maxLength={11}
              />
            </div>
          </div>
        )}

        {(data.handoffMode === 'whatsapp' || data.handoffMode === 'both') && (
          <div>
            <label className="text-sm text-gray-300 block mb-1.5">WhatsApp para avisos</label>
            <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden bg-gray-800 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
              <span className="px-3 py-2 text-sm text-gray-400 bg-gray-700/60 border-r border-gray-700 select-none">+55</span>
              <input
                className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none"
                value={data.handoffWhatsapp.replace(/^\+55/, '')}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '')
                  update({ handoffWhatsapp: digits ? `+55${digits}` : '' })
                }}
                placeholder="11 99999-9999"
                maxLength={11}
              />
            </div>
          </div>
        )}

        {/* Calendar section */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Agendamento</h3>
          </div>

          <div className="space-y-3">
            {/* None */}
            <button
              onClick={() => update({ calendarMode: 'none' })}
              className={`card p-4 w-full text-left flex items-start gap-3 transition-all hover:border-gray-700 ${data.calendarMode === 'none' ? 'border-primary ring-1 ring-primary' : ''}`}
            >
              <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${data.calendarMode === 'none' ? 'border-primary bg-primary' : 'border-gray-600'}`} />
              <div>
                <p className="font-medium text-sm text-white">Sem agendamento</p>
                <p className="text-xs text-gray-400 mt-0.5">O agente não agenda consultas</p>
              </div>
            </button>

            {/* Google Calendar */}
            <button
              onClick={() => update({ calendarMode: 'google' })}
              className={`card p-4 w-full text-left flex items-start gap-3 transition-all hover:border-gray-700 ${data.calendarMode === 'google' ? 'border-blue-500 ring-1 ring-blue-500/50' : ''}`}
            >
              <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${data.calendarMode === 'google' ? 'border-blue-500 bg-blue-500' : 'border-gray-600'}`} />
              <div className="flex-1">
                <p className="font-medium text-sm text-white">Google Agenda</p>
                <p className="text-xs text-gray-400 mt-0.5">Sincroniza com sua agenda Google. O agente consulta disponibilidade e agenda em tempo real.</p>
              </div>
            </button>

            {/* Google OAuth inline when selected */}
            {data.calendarMode === 'google' && (
              <div className="ml-7 card p-4 space-y-3">
                {data.googleCalendarConnected || googleState === 'connected' ? (
                  <div className="flex items-center gap-3 text-green-400">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Google Agenda conectado!</p>
                      <p className="text-xs text-gray-400 mt-0.5">Sua agenda está pronta para uso pelo agente.</p>
                    </div>
                  </div>
                ) : googleState === 'not_configured' ? (
                  <div className="text-sm text-yellow-400 space-y-1">
                    <p className="font-medium">Google OAuth não configurado</p>
                    <p className="text-xs text-gray-400">Configure <code className="bg-gray-800 px-1 rounded">GOOGLE_CLIENT_ID</code> e <code className="bg-gray-800 px-1 rounded">GOOGLE_CLIENT_SECRET</code> no servidor.</p>
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1">
                      <ExternalLink className="h-3 w-3" /> Criar credenciais no Google Cloud
                    </a>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-400">Clique para entrar na sua conta Google e autorizar o acesso à agenda.</p>
                    <button
                      onClick={connectGoogle}
                      disabled={googleState === 'loading'}
                      className="btn-secondary flex items-center gap-2 text-sm py-2 w-full justify-center disabled:opacity-50"
                    >
                      {googleState === 'loading' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      {googleState === 'loading' ? 'Abrindo…' : 'Entrar com Google'}
                    </button>
                    {googleState === 'error' && (
                      <p className="text-xs text-red-400">{googleError}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Built-in */}
            <button
              onClick={() => update({ calendarMode: 'builtin' })}
              className={`card p-4 w-full text-left flex items-start gap-3 transition-all hover:border-gray-700 ${data.calendarMode === 'builtin' ? 'border-accent ring-1 ring-accent/50' : ''}`}
            >
              <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${data.calendarMode === 'builtin' ? 'border-accent bg-accent' : 'border-gray-600'}`} />
              <div>
                <p className="font-medium text-sm text-white">Agenda própria <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full ml-1">Recomendado</span></p>
                <p className="text-xs text-gray-400 mt-0.5">Agenda integrada no sistema. Ideal para começar do zero sem precisar de conta Google.</p>
              </div>
            </button>

            {/* Built-in config when selected */}
            {data.calendarMode === 'builtin' && (
              <div className="ml-7 card p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Duração de cada consulta
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SLOT_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => update({ calendarSlotMinutes: s.value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                          data.calendarSlotMinutes === s.value
                            ? 'bg-accent text-gray-900 border-accent'
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-2">Horário de atendimento</label>
                  <div className="space-y-2">
                    {workingHours.map(day => (
                      <div key={day.dayOfWeek} className="flex items-center gap-3">
                        <button
                          onClick={() => updateDay(day.dayOfWeek, 'isActive', !day.isActive)}
                          className={`w-9 text-xs font-semibold py-1 rounded-md transition-colors flex-shrink-0 ${
                            day.isActive ? 'bg-accent text-gray-900' : 'bg-gray-800 text-gray-500'
                          }`}
                        >
                          {day.label}
                        </button>
                        {day.isActive ? (
                          <div className="flex items-center gap-2 text-xs text-gray-300">
                            <input
                              type="time"
                              value={day.startTime}
                              onChange={e => updateDay(day.dayOfWeek, 'startTime', e.target.value)}
                              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-accent"
                            />
                            <span className="text-gray-500">até</span>
                            <input
                              type="time"
                              value={day.endTime}
                              onChange={e => updateDay(day.dayOfWeek, 'endTime', e.target.value)}
                              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-accent"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">Fechado</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Clique no dia para ativar/desativar. Você pode ajustar depois no painel.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-10">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <button onClick={onNext} className="btn-primary flex items-center gap-2">
          Revisar configuração <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
