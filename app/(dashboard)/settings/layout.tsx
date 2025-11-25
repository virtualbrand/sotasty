'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
    description: 'Gerencie suas informações pessoais',
    permission: null, // Sempre visível
    requiresFullAccess: false
  },
  { 
    name: 'Notificações', 
    href: '/settings/notifications', 
    icon: Bell,
    description: 'Configure suas notificações',
    permission: null, // Sempre visível
    requiresFullAccess: false
  },
  { 
    name: 'Planos', 
    href: '/settings/plans', 
    icon: CreditCard,
    description: 'Gerencie sua assinatura e pagamentos',
    permission: 'admin', // Apenas admin
    requiresFullAccess: false
  },
  { 
    name: 'Usuários', 
    href: '/settings/users', 
    icon: Users,
    description: 'Gerencie usuários e permissões',
    permission: 'admin', // Apenas admin
    requiresFullAccess: false
  },
  { 
    name: 'Produtos', 
    href: '/settings/products', 
    icon: CakeSlice,
    description: 'Configurações de produtos',
    permission: 'products',
    requiresFullAccess: false // Membros com permissão podem acessar (só categorias)
  },
  { 
    name: 'Pedidos', 
    href: '/settings/orders', 
    icon: ShoppingCart,
    description: 'Configurações de pedidos',
    permission: 'orders',
    requiresFullAccess: true // Apenas admin ou admin como membro
  },
  { 
    name: 'Clientes', 
    href: '/settings/customers', 
    icon: UserCog,
    description: 'Configurações de clientes',
    permission: 'customers',
    requiresFullAccess: true // Apenas admin ou admin como membro
  },
  { 
    name: 'Mensagens', 
    href: '/settings/whatsapp', 
    icon: MessageSquare,
    description: 'Conecte e configure suas mensagens',
    permission: 'messages',
    requiresFullAccess: true // Apenas admin ou admin como membro
  },
  { 
    name: 'Atendimento', 
    href: '/settings/atendimento', 
    icon: MessageCircle,
    description: 'Base de conhecimento do assistente',
    permission: 'support',
    requiresFullAccess: true // Apenas admin ou admin como membro
  },
  { 
    name: 'Agenda', 
    href: '/settings/agenda', 
    icon: Calendar,
    description: 'Configurações de agenda',
    permission: 'agenda',
    requiresFullAccess: true // Apenas admin ou admin como membro
  },
  { 
    name: 'Financeiro', 
    href: '/settings/financeiro', 
    icon: DollarSign,
    description: 'Configurações financeiras',
    permission: 'financial',
    requiresFullAccess: true // Apenas admin ou admin como membro
  },
  { 
    name: 'Atividades', 
    href: '/settings/activities', 
    icon: Activity,
    description: 'Histórico de atividades',
    permission: 'activities',
    requiresFullAccess: true // Apenas admin ou admin como membro
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMounted, setIsMounted] = useState(false)
  
  // Inicializar com cache se disponível
  const getCachedPermissions = () => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem('user_permissions_cache')
      if (!cached) return null
      
      const { role, permissions, timestamp } = JSON.parse(cached)
      return { role, permissions, timestamp }
    } catch (error) {
      return null
    }
  }
  
  const cachedData = getCachedPermissions()
  
  const [userRole, setUserRole] = useState<string>(cachedData?.role || 'member')
  const [userPermissions, setUserPermissions] = useState<any>(cachedData?.permissions || null)
  const [isLoading, setIsLoading] = useState(!cachedData) // Só mostra loading se não tem cache
  const supabase = createClient()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const getUserPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, permissions, updated_at')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          // Verificar se o cache está desatualizado
          if (cachedData) {
            const cacheTime = cachedData.timestamp || 0
            const profileUpdateTime = new Date(profile.updated_at).getTime()
            
            // Se o perfil foi atualizado depois do cache, atualiza os dados
            if (profileUpdateTime > cacheTime) {
              console.log('🔄 Cache de configurações desatualizado, atualizando...')
              localStorage.removeItem('user_permissions_cache')
            }
          }
          
          setUserRole(profile.role)
          setUserPermissions(profile.permissions)
          
          // Atualizar cache
          const cacheData = JSON.parse(localStorage.getItem('user_permissions_cache') || '{}')
          cacheData.role = profile.role
          cacheData.permissions = profile.permissions
          cacheData.timestamp = Date.now()
          localStorage.setItem('user_permissions_cache', JSON.stringify(cacheData))
        }
      }
      setIsLoading(false)
    }
    getUserPermissions()
  }, [supabase])
  
  const pathname = usePathname()

  // Filtrar itens de navegação baseado em role e permissões
  const filteredNavigation = settingsNavigation.filter(item => {
    // Itens sem permissão requerida são sempre visíveis
    if (item.permission === null) return true
    
    // Itens que requerem admin
    if (item.permission === 'admin') {
      return userRole === 'admin' || userRole === 'superadmin'
    }
    
    // Admin e superadmin têm acesso total a tudo
    if (userRole === 'admin' || userRole === 'superadmin') return true
    
    // Para membros, verificar se tem a permissão básica
    if (userRole === 'member' && userPermissions) {
      const hasPermission = userPermissions[item.permission] === true
      
      // Se o item requer acesso total, verificar se é um "admin como membro"
      // (membro com todas as permissões habilitadas)
      if (item.requiresFullAccess) {
        // Verificar se tem TODAS as permissões habilitadas (admin como membro)
        const allPermissions = ['dashboard', 'products', 'menus', 'orders', 'financial', 'messages', 'support', 'customers', 'agenda', 'activities']
        const hasAllPermissions = allPermissions.every(perm => userPermissions[perm] === true)
        
        return hasPermission && hasAllPermissions
      }
      
      // Se não requer acesso total, basta ter a permissão específica
      return hasPermission
    }
    
    return false
  })

  // Evitar hidratação com conteúdo diferente
  if (!isMounted) {
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
          <aside className="lg:col-span-1">
            <nav className="space-y-0.5 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <div className="space-y-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-[10px]">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                  </div>
                ))}
              </div>
            </nav>
          </aside>
          <main className="lg:col-span-3">
            {children}
          </main>
        </div>
      </div>
    )
  }

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
              {isLoading ? (
                // Skeleton loading
                <div className="space-y-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-[10px]">
                      <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                filteredNavigation.map((item) => {
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
                })
              )}
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
