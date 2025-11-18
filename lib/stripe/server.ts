import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

// Planos disponíveis
export const PLANS = {
  start: {
    id: 'start',
    name: 'Start',
    price: 97,
    priceId: process.env.STRIPE_PRICE_START || '',
    features: [
      'Até 50 produtos',
      'Até 100 pedidos/mês',
      'Gestão de clientes',
      'Relatórios básicos',
    ],
  },
  grow: {
    id: 'grow',
    name: 'Grow',
    price: 197,
    priceId: process.env.STRIPE_PRICE_GROW || '',
    features: [
      'Produtos ilimitados',
      'Pedidos ilimitados',
      'Gestão de clientes',
      'Relatórios avançados',
      'Integração WhatsApp',
      'Suporte prioritário',
    ],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 397,
    priceId: process.env.STRIPE_PRICE_SCALE || '',
    features: [
      'Tudo do Grow +',
      'Multi-usuários',
      'API personalizada',
      'Suporte dedicado',
      'Treinamento incluído',
    ],
  },
} as const

export type PlanId = keyof typeof PLANS
