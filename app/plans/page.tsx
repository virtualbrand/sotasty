'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PageLoading from '@/components/PageLoading'

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  recommended?: boolean
  current?: boolean
}

export default function PlansPage() {
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<string>('cake-start')
  const router = useRouter()
  const supabase = createClient()

  const plans: Plan[] = [
    {
      id: 'cake-start',
      name: 'Cake Start',
      price: 0,
      features: [
        'Até 50 pedidos por mês',
        'Gestão básica de produtos',
        '1 usuário',
        'Suporte por email'
      ]
    },
    {
      id: 'cake-grow',
      name: 'Cake Grow',
      price: 49,
      recommended: true,
      features: [
        'Pedidos ilimitados',
        'Gestão completa de produtos',
        'Até 5 usuários',
        'Relatórios avançados',
        'Suporte prioritário'
      ]
    },
    {
      id: 'cake-scale',
      name: 'Cake Scale',
      price: 149,
      features: [
        'Tudo do Profissional',
        'Usuários ilimitados',
        'API personalizada',
        'Suporte 24/7',
        'Gerente de conta dedicado'
      ]
    }
  ]

  useEffect(() => {
    const loadUserPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_plan) {
        setCurrentPlan(profile.subscription_plan)
      }

      setLoading(false)
    }

    loadUserPlan()
  }, [router, supabase])

  const handleSelectPlan = async (planId: string) => {
    // TODO: Implementar lógica de seleção/pagamento do plano
    console.log('Plano selecionado:', planId)
    // Redirecionar para checkout ou atualizar plano
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-app)]">
        <PageLoading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] px-4 flex items-center justify-center">
      <div className="max-w-6xl mx-auto w-full py-12">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/logo.svg" 
            alt="SoTasty" 
            className="h-12"
          />
        </div>

        {/* Card com Planos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 pt-6 pb-8 px-8">
          <h2 className="text-lg font-semibold text-gray-900 text-center m-6">Escolha o plano ideal para o seu negócio</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan
              const isRecommended = plan.recommended

              return (
                <div 
                  key={plan.id}
                  className={`relative rounded-lg border-2 p-6 ${
                    isCurrent 
                      ? 'border-green-500' 
                      : isRecommended 
                        ? 'border-[var(--color-clay-500)] shadow-lg' 
                        : 'border-gray-200'
                  }`}
                >
                  {/* Badge */}
                  {(isCurrent || isRecommended) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span 
                        className={`text-white text-xs font-semibold px-3 py-1 rounded-full ${
                          isCurrent 
                            ? 'bg-green-500' 
                            : 'bg-[var(--color-clay-500)]'
                        }`}
                      >
                        {isCurrent ? 'Plano Atual' : 'Recomendado'}
                      </span>
                    </div>
                  )}

                  {/* Nome e Preço */}
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">R$ {plan.price}</span>
                      <span className="text-gray-600">/mês</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Botão */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 px-4 rounded-full font-semibold transition ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isRecommended
                          ? 'bg-[var(--color-clay-500)] text-white hover:bg-[var(--color-clay-600)]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isCurrent ? 'Plano Atual' : 'Escolher Plano'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
