import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle, Zap, CreditCard } from 'lucide-react'
import { billingApi } from '@/lib/api'

export default function BillingPage() {
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['plans'], queryFn: billingApi.plans })

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => billingApi.checkout(plan),
    onSuccess: (data) => { if (data.url) window.location.href = data.url },
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Plano & Cobrança</h1>
      <p className="text-gray-400 mb-8">Escolha o plano ideal para o seu volume de atendimento</p>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-80 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan: any) => (
            <div key={plan.id} className={`card p-6 relative ${plan.id === 'pro' ? 'border-primary ring-1 ring-primary' : ''}`}>
              {plan.id === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Mais popular
                </div>
              )}
              <h3 className="font-bold text-white mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-white">R${plan.price}</span>
                <span className="text-gray-400 text-sm">/mês</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  {plan.minutes} minutos/mês
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  WhatsApp ilimitado
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  Dashboard completo
                </li>
                {plan.id !== 'starter' && (
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    Google Agenda
                  </li>
                )}
                {plan.id === 'enterprise' && (
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    Suporte dedicado
                  </li>
                )}
              </ul>
              <button
                onClick={() => checkoutMutation.mutate(plan.id)}
                disabled={checkoutMutation.isPending}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  plan.id === 'pro' ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-100'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                {checkoutMutation.isPending ? 'Aguarde...' : 'Assinar agora'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 card p-4">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-gray-400">
            <span className="text-gray-200 font-medium">Minutos extras:</span> R$ 1,50/minuto após atingir o limite do plano.
            Cancele quando quiser, sem multa ou fidelidade.
          </p>
        </div>
      </div>
    </div>
  )
}
