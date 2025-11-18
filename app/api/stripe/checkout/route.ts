import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, PlanId } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!planId || !PLANS[planId as PlanId]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const plan = PLANS[planId as PlanId]

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      customer_email: profile?.email || user.email,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: plan.id,
        },
        trial_period_days: 14, // 14 dias de trial gratuito
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Erro ao criar checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
