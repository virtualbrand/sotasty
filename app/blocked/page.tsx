'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, CreditCard, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PageLoading from '@/components/PageLoading'

export default function BlockedPage() {
  const [reason, setReason] = useState<'trial_expired' | 'payment_overdue' | null>(null)
  const [daysOverdue, setDaysOverdue] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkBlockStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_end_date, subscription_status, last_payment_date')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setLoading(false)
        return
      }

      // Verificar se trial expirou
      if (profile.trial_end_date) {
        const trialEnd = new Date(profile.trial_end_date)
        const now = new Date()
        const daysSinceExpiry = Math.floor((now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceExpiry >= 1 && profile.subscription_status !== 'active') {
          setReason('trial_expired')
          setDaysOverdue(daysSinceExpiry)
          setLoading(false)
          return
        }
      }

      // Verificar inadimplência
      if (profile.subscription_status === 'past_due' && profile.last_payment_date) {
        const lastPayment = new Date(profile.last_payment_date)
        const now = new Date()
        const daysSincePayment = Math.floor((now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSincePayment >= 2) {
          setReason('payment_overdue')
          setDaysOverdue(daysSincePayment)
          setLoading(false)
          return
        }
      }

      // Se não está bloqueado, redirecionar
      router.push('/dashboard')
    }

    checkBlockStatus()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <PageLoading />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-app)] px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/logo.svg" 
            alt="SoTasty" 
            className="h-12"
          />
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          {/* Ícone */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-red-600" />
            </div>
          </div>

          {/* Título e Descrição */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {reason === 'trial_expired' ? 'Período de teste expirado' : 'Acesso bloqueado'}
            </h1>
            <p className="text-gray-600">
              {reason === 'trial_expired' 
                ? `Seu período de teste de 7 dias terminou há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}. Para continuar usando o SoTasty, escolha um plano.`
                : 'Sua assinatura está com pagamento pendente. Regularize seu pagamento para reativar o acesso.'
              }
            </p>
          </div>

          {/* Informações de Bloqueio */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 text-sm mb-1">
                  Acesso temporariamente suspenso
                </h3>
                <p className="text-red-700 text-sm">
                  {reason === 'trial_expired'
                    ? 'Suas receitas, pedidos e dados estão seguros. Ao assinar um plano, você terá acesso imediato a tudo novamente.'
                    : 'Regularize seu pagamento para reativar seu acesso imediatamente. Seus dados estão preservados.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div>
            <Link
              href="/plans"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {reason === 'trial_expired' ? 'Ver planos disponíveis' : 'Regularizar pagamento'}
            </Link>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Após escolher um plano, seu acesso será reativado imediatamente e você poderá continuar de onde parou.
              </p>
            </div>
          </div>
        </div>

        {/* Link de Suporte */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Precisa de ajuda?{' '}
            <Link href="/help" className="text-primary hover:underline font-medium">
              Entre em contato com o suporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
