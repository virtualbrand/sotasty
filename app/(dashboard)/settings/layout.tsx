'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Settings as SettingsIcon, 
  CreditCard, 
  Users,
  CakeSlice, 
  ShoppingCart, 
  Bell, 
  Activity,
  MessageCircle,
  MessageSquare,
  Calendar,
  DollarSign,
  UserCog,
  Info
} from 'lucide-react'

const settingsNavigation = [
  { 
    name: 'Perfil', 
    href: '/settings/profile', 
    icon: User,
    description: 'Gerencie suas informações pessoais'
  },
  { 
    name: 'Notificações', 
    href: '/settings/notifications', 
    icon: Bell,
    description: 'Configure suas notificações'
  },
  { 
    name: 'Planos', 
    href: '/settings/plans', 
    icon: CreditCard,
    description: 'Gerencie sua assinatura e pagamentos'
  },
  { 
    name: 'Usuários', 
    href: '/settings/users', 
    icon: Users,
    description: 'Gerencie usuários e permissões'
  },
  { 
    name: 'Produtos', 
    href: '/settings/products', 
    icon: CakeSlice,
    description: 'Configurações de produtos'
  },
  { 
    name: 'Pedidos', 
    href: '/settings/orders', 
    icon: ShoppingCart,
    description: 'Configurações de pedidos'
  },
  { 
    name: 'Clientes', 
    href: '/settings/customers', 
    icon: UserCog,
    description: 'Configurações de clientes'
  },
  { 
    name: 'Mensagens', 
    href: '/settings/whatsapp', 
    icon: MessageSquare,
    description: 'Conecte e configure suas mensagens'
  },
  { 
    name: 'Atendimento', 
    href: '/settings/atendimento', 
    icon: MessageCircle,
    description: 'Base de conhecimento do assistente'
  },
  { 
    name: 'Agenda', 
    href: '/settings/agenda', 
    icon: Calendar,
    description: 'Configurações de agenda'
  },
  { 
    name: 'Financeiro', 
    href: '/settings/financeiro', 
    icon: DollarSign,
    description: 'Configurações financeiras'
  },
  { 
    name: 'Atividades', 
    href: '/settings/activities', 
    icon: Activity,
    description: 'Histórico de atividades'
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                Gerencie todas as configurações do seu negócio em um só lugar. Personalize seu perfil, configure preferências do sistema, gerencie usuários e permissões e ajuste campos de formulários.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="space-y-0.5 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              {settingsNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-[10px] transition-all group
                      ${isActive 
                        ? 'bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-clay-300)] text-white shadow-lg shadow-[var(--color-clay-500)]/30' 
                        : 'text-gray-600 hover:bg-[var(--color-clay-50)]'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-[var(--color-clay-500)]'
                    }`} />
                    <span className={`font-medium text-sm ${
                      isActive ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {children}
          </main>
        </div>
      </div>
  )
}
