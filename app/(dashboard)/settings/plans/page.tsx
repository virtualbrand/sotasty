'use client'

import { CreditCard, Check } from 'lucide-react'

export default function PlansPage() {
  const plans = [
    {
      name: 'Cake Start',
      price: 'R$ 0',
      period: '/mês',
      features: [
        'Até 50 pedidos por mês',
        'Gestão básica de produtos',
        '1 usuário',
        'Suporte por email',
      ],
      current: true,
    },
    {
      name: 'Cake Grow',
      price: 'R$ 49',
      period: '/mês',
      features: [
        'Pedidos ilimitados',
        'Gestão completa de produtos',
        'Até 5 usuários',
        'Relatórios avançados',
        'Suporte prioritário',
      ],
      current: false,
      recommended: true,
    },
    {
      name: 'Cake Scale',
      price: 'R$ 149',
      period: '/mês',
      features: [
        'Tudo do Profissional',
        'Usuários ilimitados',
        'API personalizada',
        'Suporte 24/7',
        'Gerente de conta dedicado',
      ],
      current: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plano Atual</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">Cake Start</p>
            <p className="text-sm text-gray-600 mt-1">Você está usando o plano gratuito</p>
          </div>
          <button className="btn-primary">
            Fazer upgrade
          </button>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Planos Disponíveis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border-2 p-6 ${
                plan.recommended
                  ? 'border-[var(--color-clay-500)] shadow-lg'
                  : plan.current
                  ? 'border-green-500'
                  : 'border-gray-200'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[var(--color-clay-500)] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Recomendado
                  </span>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Plano Atual
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.current}
                className={`w-full py-2.5 px-4 rounded-full font-semibold transition ${
                  plan.current
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.recommended
                    ? 'bg-[var(--color-clay-500)] text-white hover:bg-[var(--color-clay-600)]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {plan.current ? 'Plano Atual' : 'Escolher Plano'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
