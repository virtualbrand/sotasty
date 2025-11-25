'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Tags,
  BookText,
  ShoppingCart, 
  Users, 
  MessageCircle,
  Calendar,
  DollarSign,
  Activity,
  HelpCircle,
  MessageSquare,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  User,
  ChevronLeft,
  BarChart3,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', permission: 'dashboard' },
  { icon: Tags, label: 'Produtos', href: '/products', permission: 'products' },
  { icon: BookText, label: 'Cardápios', href: '/cardapios', permission: 'menus' },
  { icon: ShoppingCart, label: 'Pedidos', href: '/orders', permission: 'orders' },
  { icon: DollarSign, label: 'Financeiro', href: '/financeiro', permission: 'financial' },
  { icon: MessageSquare, label: 'Mensagens', href: '/mensagens', permission: 'messages' },
  { icon: MessageCircle, label: 'Atendimento', href: '/atendimento', permission: 'support' },
  { icon: Users, label: 'Clientes', href: '/customers', permission: 'customers' },
  { icon: Calendar, label: 'Agenda', href: '/agenda', permission: 'agenda' },
]

const superAdminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Clientes', href: '/customers' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
]

const bottomMenuItems = [
  { icon: HelpCircle, label: 'Ajuda', href: '/help' },
  { icon: MessageSquare, label: 'Feedback', href: '/feedback' },
]

interface SidebarProps {
  position?: 'sidebar' | 'header' | 'footer' | 'right'
  initialUser?: any
  initialProfile?: {
    role: string
    permissions: any
    avatar_url: string | null
    full_name: string | null
  } | null
}

export default function Sidebar({ position = 'sidebar', initialUser, initialProfile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const supabase = createClient()
  
  // Carregar permissões do localStorage se disponível E se for do mesmo usuário
  const getCachedPermissions = () => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem('user_permissions_cache')
      
      if (!cached) return null
      
      const { userId, permissions, role, userName, userEmail, avatarUrl, timestamp } = JSON.parse(cached)
      
      // Retorna o cache - a validação do userId será feita no useEffect
      return { userId, permissions, role, userName, userEmail, avatarUrl, timestamp }
    } catch (error) {
      return null
    }
  }
  
  const cachedData = getCachedPermissions()
  
  const [user, setUser] = useState<any>(initialUser || null)
  const [userRole, setUserRole] = useState<string>(initialProfile?.role || cachedData?.role || 'member')
  const [userPermissions, setUserPermissions] = useState<any>(initialProfile?.permissions || cachedData?.permissions || null)
  const [userName, setUserName] = useState<string>(cachedData?.userName || '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(cachedData?.avatarUrl || null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showActivities, setShowActivities] = useState(true)
  const [menuPosition, setMenuPosition] = useState<'sidebar' | 'header' | 'footer' | 'right'>('sidebar')
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(!initialProfile && !cachedData) // Só mostra loading se não tem dados
  const [hasLoadedCache, setHasLoadedCache] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Sincroniza menuPosition com o prop position
  useEffect(() => {
    setMenuPosition(position)
  }, [position])
  
  // Marca como montado no cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Limpar cache antigo na montagem do componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_permissions')
    }
  }, [])

  useEffect(() => {
    // Se já temos dados iniciais, não precisa buscar novamente
    if (initialUser && initialProfile) {
      setIsLoadingPermissions(false)
      return
    }

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Atualizar nome do usuário
      if (user?.user_metadata?.name || user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.name || user.user_metadata.full_name)
      }
      
      // Verificar se o cache é do usuário atual (só uma vez)
      if (user && !hasLoadedCache) {
        const cachedData = getCachedPermissions()
        
        if (cachedData && cachedData.userId === user.id) {
          // Cache válido, usar os dados do cache
          setUserRole(cachedData.role)
          setUserPermissions(cachedData.permissions)
          
          // Atualizar nome do cache se disponível
          if (cachedData.userName) {
            setUserName(cachedData.userName)
          }
          
          // Atualizar avatar do cache se disponível
          if (cachedData.avatarUrl) {
            setAvatarUrl(cachedData.avatarUrl)
          }
          
          setIsLoadingPermissions(false)
          setHasLoadedCache(true)
          return
        } else if (cachedData) {
          // Cache de outro usuário, limpar
          localStorage.removeItem('user_permissions_cache')
        }
      }
      
      // Se já carregou do cache, não busca do servidor novamente
      if (hasLoadedCache) {
        return
      }
      
      // Carrega o avatar e role do perfil do servidor
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, role, permissions, full_name, updated_at')
          .eq('id', user.id)
          .single()
        
        // Verificar se o cache está desatualizado
        if (cachedData && profile) {
          const cacheTime = cachedData.timestamp || 0
          const profileUpdateTime = new Date(profile.updated_at).getTime()
          
          // Se o perfil foi atualizado depois do cache, limpa o cache e força reload
          if (profileUpdateTime > cacheTime) {
            console.log('🔄 Cache desatualizado detectado, recarregando permissões...')
            localStorage.removeItem('user_permissions_cache')
            
            // Força logout para garantir que as permissões sejam atualizadas
            await supabase.auth.signOut()
            router.push('/auth/login?message=Suas permissões foram atualizadas. Por favor, faça login novamente.')
            return
          }
        }
        
        if (profile?.avatar_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(profile.avatar_url)
          setAvatarUrl(publicUrl)
        }
        
        if (profile?.role) {
          setUserRole(profile.role)
        }
        
        if (profile?.permissions) {
          setUserPermissions(profile.permissions)
        }
        
        // Salvar no cache junto com o user_id, nome do usuário, avatar e timestamp
        if (profile) {
          const cacheData = {
            userId: user.id,
            role: profile.role,
            permissions: profile.permissions,
            userName: user.user_metadata?.name || user.user_metadata?.full_name || profile.full_name || user.email,
            userEmail: user.email,
            avatarUrl: profile.avatar_url ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl : null,
            timestamp: Date.now() // Adiciona timestamp do cache
          }
          localStorage.setItem('user_permissions_cache', JSON.stringify(cacheData))
        }
        
        setIsLoadingPermissions(false)
        setHasLoadedCache(true)
      }
    }
    
    getUser()

    // Recarregar permissões quando a página receber foco
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        getUser()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Listener para atualizar o avatar quando houver mudança
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      const newAvatarUrl = customEvent.detail.avatarUrl
      setAvatarUrl(newAvatarUrl)
      
      // Atualizar o cache com a nova foto
      const cached = localStorage.getItem('user_permissions_cache')
      if (cached) {
        try {
          const cacheData = JSON.parse(cached)
          cacheData.avatarUrl = newAvatarUrl
          localStorage.setItem('user_permissions_cache', JSON.stringify(cacheData))
        } catch (error) {
          console.error('Erro ao atualizar cache do avatar:', error)
        }
      }
    }

    // Listener para atualizar o nome quando houver mudança
    const handleNameUpdate = async (event?: Event) => {
      // Se o evento tiver o nome, usa direto
      let newUserName: string | undefined
      if (event) {
        const customEvent = event as CustomEvent
        newUserName = customEvent.detail.name
      }
      
      // Recarrega o usuário para pegar o user_metadata.name atualizado
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      if (updatedUser) {
        setUser(updatedUser)
        
        // Usar o nome do evento ou do user_metadata
        const finalUserName = newUserName || updatedUser.user_metadata?.name || updatedUser.user_metadata?.full_name || updatedUser.email
        setUserName(finalUserName)
        
        // Atualizar o cache com o novo nome
        const cached = localStorage.getItem('user_permissions_cache')
        if (cached) {
          try {
            const cacheData = JSON.parse(cached)
            cacheData.userName = finalUserName
            localStorage.setItem('user_permissions_cache', JSON.stringify(cacheData))
          } catch (error) {
            console.error('Erro ao atualizar cache do nome:', error)
          }
        }
      }
    }

    // Listener para toggle de atividades na sidebar
    const handleActivitiesToggle = (event: Event) => {
      const customEvent = event as CustomEvent
      setShowActivities(customEvent.detail.show)
    }

    // Listener para mudança de posição do menu
    const handleMenuPositionChange = (event: Event) => {
      const customEvent = event as CustomEvent
      setMenuPosition(customEvent.detail.position)
    }

    window.addEventListener('avatar-updated', handleAvatarUpdate)
    window.addEventListener('profile-name-updated', handleNameUpdate)
    window.addEventListener('toggle-activities-sidebar', handleActivitiesToggle)
    window.addEventListener('menu-position-changed', handleMenuPositionChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('avatar-updated', handleAvatarUpdate)
      window.removeEventListener('profile-name-updated', handleNameUpdate)
      window.removeEventListener('toggle-activities-sidebar', handleActivitiesToggle)
      window.removeEventListener('menu-position-changed', handleMenuPositionChange)
    }
  }, [supabase, initialUser, initialProfile, hasLoadedCache])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showUserMenu) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showUserMenu])

  const handleLogout = async () => {
    try {
      // Limpar cache de permissões
      localStorage.removeItem('user_permissions_cache')
      
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      // Redirecionar mesmo se houver erro
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Limpar cache mesmo com erro
      localStorage.removeItem('user_permissions_cache')
      // Redirecionar mesmo com erro
      router.push('/auth/login')
      router.refresh()
    }
  }

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    
    // Dispatch custom event to notify layout
    const event = new CustomEvent('sidebar-collapse', { 
      detail: { isCollapsed: newState } 
    });
    window.dispatchEvent(event);
  }

  const getUserInitials = () => {
    if (!userName) {
      return ''
    }
    
    return userName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  // Filtrar menu items baseado no role e permissões do usuário
  const filteredMenuItems = !isMounted
    ? [] // Durante SSR, não renderiza nenhum item
    : userRole === 'superadmin'
    ? superAdminMenuItems
    : userRole === 'admin'
    ? menuItems
    : userRole === 'member' && userPermissions
    ? menuItems.filter(item => userPermissions[item.permission] === true)
    : [] // Não renderiza menu até ter permissões carregadas

  // Layout Horizontal (Header/Footer)
  if (menuPosition === 'header' || menuPosition === 'footer') {
    return (
      <nav className="w-full bg-[var(--color-milk-100)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="SoTasty" className="w-10 h-10" />
        </Link>

        {/* Main Menu - Horizontal */}
        <div className="flex items-center gap-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-[10px] transition-all group
                  ${active 
                    ? 'bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-clay-300)] text-white shadow-lg shadow-[var(--color-clay-500)]/30' 
                    : 'text-gray-600 hover:bg-[var(--color-clay-50)]'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-[var(--color-clay-500)]'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}

          {isMounted && showActivities && userRole !== 'superadmin' && (
            <Link
              href="/activities"
              className={`
                flex items-center gap-2 px-4 py-2 rounded-[10px] transition-all group
                ${isActive('/activities')
                  ? 'bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-clay-300)] text-white shadow-lg shadow-[var(--color-clay-500)]/30' 
                  : 'text-gray-600 hover:bg-[var(--color-clay-50)]'
                }
              `}
            >
              <Activity className={`w-5 h-5 flex-shrink-0 ${isActive('/activities') ? 'text-white' : 'text-gray-500 group-hover:text-[var(--color-clay-500)]'}`} />
              <span className="font-medium text-sm">Atividades</span>
            </Link>
          )}
        </div>

        {/* Right Section - User & Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-all">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {bottomMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="p-2 hover:bg-gray-50 rounded-lg transition-all"
              >
                <Icon className="w-5 h-5 text-gray-500 hover:text-[var(--color-clay-500)]" />
              </Link>
            )
          })}

          {/* User Menu */}
          {isMounted && userName && (
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-semibold">{getUserInitials()}</span>
                    </div>
                  )}
                </div>
              </button>

            {showUserMenu && (
              <div className={`absolute right-0 ${menuPosition === 'footer' ? 'bottom-full mb-2' : 'top-full mt-2'} w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[100]`}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    router.push('/settings/profile')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[var(--color-lavender-blush)] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Meu Perfil
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    router.push('/settings/profile?tab=preferences')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[var(--color-lavender-blush)] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Configurações
                </button>

                <div className="border-t border-gray-100 my-2"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
            </div>
          )}
        </div>
      </nav>
    )
  }

  // Layout Sidebar (Esquerda ou Direita)
  const sidePosition = (menuPosition === 'sidebar' || menuPosition === 'right') 
    ? (menuPosition === 'right' ? 'right' : 'left')
    : 'left'

  return (
    <>
      <aside className={`fixed ${sidePosition}-0 top-0 h-screen bg-[var(--color-milk-100)] shadow-[0_0_20px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo & Toggle */}
        <div className="p-6 flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-3 outline-none focus:outline-none">
              <img src="/logo.svg" alt="SoTasty" className="w-25 h-25" />
            </Link>
          )}
          {isCollapsed && (
            <img src="/logo.svg" alt="SoTasty" className="w-10 h-10 mx-auto" />
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className={`absolute ${sidePosition === 'left' ? '-right-3' : '-left-3'} top-8 w-6 h-6 bg-[var(--color-clay-500)] hover:bg-[var(--color-clay-600)] rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${isCollapsed ? (sidePosition === 'left' ? 'rotate-180' : '') : (sidePosition === 'right' ? 'rotate-180' : '')}`}
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        {/* User Profile */}
        {isMounted && userName && (
          <div className={`px-4 pb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-semibold">{getUserInitials()}</span>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-xs text-gray-600">
                      Olá,
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {userName}
                    </p>
                  </div>
                )}
              </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className={`absolute ${isCollapsed ? 'left-full ml-2' : 'left-0'} top-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[100]`}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    router.push('/settings/profile')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[var(--color-lavender-blush)] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Meu Perfil
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    router.push('/settings/profile?tab=preferences')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[var(--color-lavender-blush)] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Configurações
                </button>

                <div className="border-t border-gray-100 my-2"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all group
                    ${active 
                      ? 'bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-clay-300)] text-white shadow-lg shadow-[var(--color-clay-500)]/30' 
                      : 'text-gray-600 hover:bg-[var(--color-clay-50)]'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-[var(--color-clay-500)]'}`} />
                  {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                </Link>
              )
            })}

            {/* Item Atividades (condicional com permissão) */}
            {isMounted && showActivities && userRole !== 'superadmin' && (userRole === 'admin' || (userRole === 'member' && userPermissions?.activities)) && (
              <Link
                href="/activities"
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all group
                  ${isActive('/activities')
                    ? 'bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-clay-300)] text-white shadow-lg shadow-[var(--color-clay-500)]/30' 
                    : 'text-gray-600 hover:bg-[var(--color-clay-50)]'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? 'Atividades' : ''}
              >
                <Activity className={`w-5 h-5 flex-shrink-0 ${isActive('/activities') ? 'text-white' : 'text-gray-500 group-hover:text-[var(--color-clay-500)]'}`} />
                {!isCollapsed && <span className="font-medium text-sm">Atividades</span>}
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {/* Notifications */}
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-gray-600 hover:bg-[var(--color-clay-50)] relative group ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Notificações' : ''}
          >
            <Bell className="w-5 h-5 flex-shrink-0 text-gray-500 group-hover:text-[var(--color-clay-500)]" />
            {!isCollapsed && <span className="font-medium text-sm">Notificações</span>}
            <span className="absolute top-2 left-7 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {bottomMenuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all group
                  ${active 
                    ? 'bg-[var(--color-lavender-blush)] text-[var(--color-clay-500)]' 
                    : 'text-gray-600 hover:bg-[var(--color-clay-50)]'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[var(--color-clay-500)]' : 'text-gray-500 group-hover:text-[var(--color-clay-500)]'}`} />
                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
