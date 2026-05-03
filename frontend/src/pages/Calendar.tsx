import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon, ExternalLink, Clock, MapPin, User, AlertCircle,
  CheckCircle, Loader2, ChevronRight,
} from 'lucide-react'
import { agentApi, calendarApi } from '@/lib/api'

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
}

const APPOINTMENT_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-green-500/15 text-green-300 border-green-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
  completed: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
}

export default function CalendarPage() {
  const { data: agentConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ['agent-config'],
    queryFn: agentApi.getConfig,
    retry: false,
  })

  const calendarMode = agentConfig?.calendarMode ?? 'none'

  if (loadingConfig) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-6" />
        <div className="card h-64 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-400" /> Calendário
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {calendarMode === 'google' && 'Sincronizado com seu Google Agenda'}
            {calendarMode === 'builtin' && 'Agenda própria do sistema'}
            {calendarMode === 'none' && 'Nenhum calendário configurado'}
          </p>
        </div>
        <ModeBadge mode={calendarMode} />
      </div>

      {calendarMode === 'google' && <GoogleCalendarView />}
      {calendarMode === 'builtin' && <BuiltinCalendarView />}
      {calendarMode === 'none' && <NoCalendarView />}
    </div>
  )
}

function ModeBadge({ mode }: { mode: string }) {
  if (mode === 'google') {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
        Google Agenda
      </span>
    )
  }
  if (mode === 'builtin') {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-accent/15 text-accent border border-accent/30">
        Agenda própria
      </span>
    )
  }
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-500/15 text-gray-400 border border-gray-500/30">
      Não configurado
    </span>
  )
}

function NoCalendarView() {
  return (
    <div className="card p-8 text-center">
      <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <CalendarIcon className="h-6 w-6 text-gray-500" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">Calendário não configurado</h2>
      <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
        Configure o agendamento no assistente de configuração para que o agente possa marcar consultas com seus clientes.
      </p>
      <Link to="/wizard" className="btn-primary inline-flex items-center gap-2 text-sm">
        Abrir wizard <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function GoogleCalendarView() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['google-calendar-events'],
    queryFn: () => calendarApi.listGoogleEvents(),
    retry: false,
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="card p-8 flex items-center justify-center gap-3 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando eventos do Google Agenda…
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-red-500/25 bg-red-500/5 p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-300">Não foi possível carregar os eventos</p>
          <p className="text-xs text-gray-400 mt-1">
            Verifique se o Google Agenda continua autorizado. Você pode reconectar pelo wizard.
          </p>
          <Link to="/wizard" className="text-xs text-red-400 hover:text-red-300 mt-2 inline-block">
            Reconectar Google Agenda →
          </Link>
        </div>
      </div>
    )
  }

  const list = events ?? []
  const grouped = groupEventsByDay(list)

  return (
    <div className="space-y-5">
      <div className="card border-blue-500/25 bg-blue-500/5 p-4 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-200">Google Agenda conectado</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Mostrando próximos {list.length} evento{list.length === 1 ? '' : 's'} dos próximos 30 dias.
          </p>
        </div>
        <a
          href="https://calendar.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
        >
          Abrir Google Agenda <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center">
          <CalendarIcon className="h-8 w-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Nenhum evento nos próximos 30 dias.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.dateKey} className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/40">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  {formatDayHeader(group.date)}
                </p>
              </div>
              <div className="divide-y divide-gray-800/60">
                {group.events.map((ev: any) => (
                  <div key={ev.id} className="flex gap-4 px-5 py-3.5">
                    <div className="flex-shrink-0 w-20 text-xs text-gray-400 pt-0.5">
                      {ev.allDay ? (
                        <span className="text-blue-400 font-medium">Dia inteiro</span>
                      ) : (
                        <>
                          <p className="font-mono text-gray-200">{formatTime(ev.start)}</p>
                          <p className="font-mono text-gray-500">{formatTime(ev.end)}</p>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ev.summary}</p>
                      {ev.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" /> {ev.location}
                        </p>
                      )}
                      {ev.attendees?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <User className="h-3 w-3 flex-shrink-0" />
                          {ev.attendees.length} participante{ev.attendees.length === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                    {ev.htmlLink && (
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-400 transition-colors flex-shrink-0"
                        title="Abrir no Google Agenda"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BuiltinCalendarView() {
  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => calendarApi.listAppointments(),
    refetchInterval: 60_000,
  })
  const { data: workingHours = [], isLoading: loadingHours } = useQuery({
    queryKey: ['working-hours'],
    queryFn: calendarApi.getWorkingHours,
  })

  if (loadingAppts || loadingHours) {
    return (
      <div className="card p-8 flex items-center justify-center gap-3 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando agenda…
      </div>
    )
  }

  const upcoming = appointments
    .filter((a: any) => new Date(a.datetime) >= new Date())
    .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

  const past = appointments
    .filter((a: any) => new Date(a.datetime) < new Date())
    .sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
    .slice(0, 10)

  const slotMinutes = workingHours[0]?.slotDurationMinutes ?? 60

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Upcoming + past */}
      <div className="lg:col-span-2 space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            Próximos agendamentos {upcoming.length > 0 && <span className="text-gray-500">({upcoming.length})</span>}
          </h2>
          {upcoming.length === 0 ? (
            <div className="card p-8 text-center">
              <CalendarIcon className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhum agendamento futuro.</p>
              <p className="text-xs text-gray-500 mt-1">
                Quando o agente marcar uma consulta, ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden divide-y divide-gray-800/60">
              {upcoming.map((appt: any) => (
                <AppointmentRow key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Histórico recente
            </h2>
            <div className="card overflow-hidden divide-y divide-gray-800/60 opacity-75">
              {past.map((appt: any) => (
                <AppointmentRow key={appt.id} appt={appt} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Working hours sidebar */}
      <aside className="space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-accent" /> Horário de atendimento
          </h3>
          {workingHours.length === 0 ? (
            <p className="text-xs text-gray-500">Horário ainda não configurado.</p>
          ) : (
            <ul className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 0].map(dow => {
                const day = workingHours.find((d: any) => d.dayOfWeek === dow)
                if (!day) return null
                return (
                  <li key={dow} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 w-12">{DAY_SHORT[dow]}</span>
                    {day.isActive ? (
                      <span className="font-mono text-gray-200">
                        {day.startTime} – {day.endTime}
                      </span>
                    ) : (
                      <span className="text-gray-600">Fechado</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
            Duração padrão: <span className="font-mono text-gray-300">{slotMinutes} min</span>
          </div>
          <Link
            to="/wizard"
            className="mt-3 block text-xs text-accent hover:text-accent/80 transition-colors"
          >
            Editar no wizard →
          </Link>
        </div>

        <div className="card p-5 bg-gray-900/40">
          <p className="text-xs text-gray-400 leading-relaxed">
            Esta agenda é gerenciada pelo sistema. Para usar o Google Agenda, troque o modo no wizard.
          </p>
        </div>
      </aside>
    </div>
  )
}

function AppointmentRow({ appt }: { appt: any }) {
  const date = new Date(appt.datetime)
  const statusKey = appt.status ?? 'pending'
  return (
    <div className="flex gap-4 px-5 py-3.5">
      <div className="flex-shrink-0 w-16 text-center">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">
          {DAY_SHORT[date.getDay()]}
        </p>
        <p className="text-lg font-bold text-white leading-tight">
          {date.getDate().toString().padStart(2, '0')}
        </p>
        <p className="text-[10px] text-gray-500 capitalize">
          {date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-white truncate">{appt.clientName}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${APPOINTMENT_STATUS_COLOR[statusKey] ?? APPOINTMENT_STATUS_COLOR.pending}`}>
            {APPOINTMENT_STATUS_LABEL[statusKey] ?? statusKey}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
          <span className="font-mono">
            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-gray-600">·</span>
          <span>{appt.durationMinutes} min</span>
          {appt.clientPhone && (
            <>
              <span className="text-gray-600">·</span>
              <span>{appt.clientPhone}</span>
            </>
          )}
        </p>
        {appt.notes && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{appt.notes}</p>
        )}
      </div>
    </div>
  )
}

function groupEventsByDay(events: any[]) {
  const map = new Map<string, { dateKey: string; date: Date; events: any[] }>()
  for (const ev of events) {
    if (!ev.start) continue
    const d = new Date(ev.start)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!map.has(key)) {
      map.set(key, { dateKey: key, date: d, events: [] })
    }
    map.get(key)!.events.push(ev)
  }
  return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}

function formatDayHeader(d: Date): string {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (isSameDay(d, today)) return `Hoje · ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`
  if (isSameDay(d, tomorrow)) return `Amanhã · ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`
  return `${DAY_NAMES[d.getDay()]} · ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
