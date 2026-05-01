import { ChevronLeft, CheckCircle, Zap, Phone, MessageSquare, BookOpen, UserCheck, Calendar, Loader2 } from 'lucide-react'
import { WizardData } from '../index'

interface Props {
  data: WizardData
  update: (d: Partial<WizardData>) => void
  onBack: () => void
  onFinish: () => void
  saving: boolean
}

export function StepActivate({ data, onBack, onFinish, saving }: Props) {
  const phoneLabel = data.phoneEnabled
    ? data.phoneNumberSid
      ? 'Número selecionado'
      : 'Ativado (sem número selecionado)'
    : 'Desativado'

  const items = [
    { icon: Zap, label: 'Nome do agente', value: data.agentName, ok: !!data.agentName },
    { icon: Phone, label: 'Canal telefone', value: phoneLabel, ok: data.phoneEnabled && !!data.phoneNumberSid },
    { icon: MessageSquare, label: 'Canal WhatsApp', value: data.whatsappEnabled ? `+55${data.whatsappPhone.replace('+55', '')}` : 'Desativado', ok: true },
    { icon: BookOpen, label: 'Base de conhecimento', value: `${data.knowledgeItems.length} item(s)`, ok: true },
    { icon: UserCheck, label: 'Transferência', value: data.handoffMode === 'none' ? 'Desativada' : 'Configurada', ok: true },
    { icon: Calendar, label: 'Agendamento', value: data.calendarMode === 'google' ? 'Google Agenda' : data.calendarMode === 'builtin' ? `Agenda própria (${data.calendarSlotMinutes}min/consulta)` : 'Desativado', ok: true },
  ]

  const willCreatePhone = data.phoneEnabled && !!data.phoneNumberSid

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Tudo pronto para ativar!</h2>
      <p className="text-gray-400 mb-8">Revise as configurações e clique em ativar para publicar seu AI Receptionist.</p>

      <div className="max-w-2xl">
        <div className="card p-6 space-y-4 mb-6">
          {items.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm text-white">{item.value}</p>
              </div>
              <CheckCircle className={`h-4 w-4 flex-shrink-0 ${item.ok ? 'text-accent' : 'text-gray-600'}`} />
            </div>
          ))}
        </div>

        {willCreatePhone && (
          <div className="card p-4 bg-primary/5 border-primary/20 mb-4">
            <p className="text-sm text-gray-300">
              <span className="text-primary font-semibold">Ao ativar:</span> o número Twilio selecionado será configurado
              para receber ligações, e um agente de voz ElevenLabs será criado automaticamente para este negócio.
              {data.calendarMode === 'builtin' && ' A agenda própria será configurada com os horários definidos.'}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onBack} disabled={saving} className="btn-secondary flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
          <button
            onClick={onFinish}
            disabled={saving}
            className="btn-primary flex items-center gap-2 flex-1 justify-center text-base py-3"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Ativando…
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Ativar meu AI Receptionist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
