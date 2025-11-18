'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  CakeSlice,
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
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: CakeSlice, label: 'Produtos', href: '/products' },
  { icon: ShoppingCart, label: 'Pedidos', href: '/orders' },
  { icon: Users, label: 'Clientes', href: '/customers' },
  { icon: MessageSquare, label: 'Mensagens', href: '/mensagens' },
  { icon: MessageCircle, label: 'Atendimento', href: '/atendimento' },
  { icon: Calendar, label: 'Agenda', href: '/agenda' },
  { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
]

const superAdminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Clientes', href: '/customers' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
]

const bottomMenuItems = [
  { icon: HelpCircle, label: 'Ajuda', href: '/help' },
  { icon: MessageSquare, label: 'Feedback', href: '/feedback' },
]

interface SidebarProps {
  position?: 'sidebar' | 'header' | 'footer' | 'right'
}

export default function Sidebar({ position = 'sidebar' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('admin')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showActivities, setShowActivities] = useState(true)
  const [menuPosition, setMenuPosition] = useState<'sidebar' | 'header' | 'footer' | 'right'>('sidebar')
  const supabase = createClient()

  // Sincroniza menuPosition com o prop position
  useEffect(() => {
    setMenuPosition(position)
  }, [position])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Carrega o avatar e role do perfil
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, role')
          .eq('id', user.id)
          .single()
        
        if (profile?.avatar_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(profile.avatar_url)
          setAvatarUrl(publicUrl)
        }
        
        if (profile?.role) {
          setUserRole(profile.role)
        }
      }
    }
    getUser()

    // Listener para atualizar o avatar quando houver mudança
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      setAvatarUrl(customEvent.detail.avatarUrl)
    }

    // Listener para atualizar o nome quando houver mudança
    const handleNameUpdate = async () => {
      // Recarrega o usuário para pegar o user_metadata.name atualizado
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      if (updatedUser) {
        setUser(updatedUser)
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
      window.removeEventListener('avatar-updated', handleAvatarUpdate)
      window.removeEventListener('profile-name-updated', handleNameUpdate)
      window.removeEventListener('toggle-activities-sidebar', handleActivitiesToggle)
      window.removeEventListener('menu-position-changed', handleMenuPositionChange)
    }
  }, [supabase])

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
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
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
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  // Filtrar menu items baseado no role do usuário
  const filteredMenuItems = userRole === 'superadmin'
    ? superAdminMenuItems
    : menuItems

  // Layout Horizontal (Header/Footer)
  if (menuPosition === 'header' || menuPosition === 'footer') {
    return (
      <nav className="w-full bg-[var(--color-snow)] shadow-lg flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="CakeCloud" className="w-10 h-10" />
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
                    ? 'bg-gradient-to-r from-[var(--color-old-rose)] to-[var(--color-melon)] text-white shadow-lg shadow-[var(--color-old-rose)]/30' 
                    : 'text-gray-600 hover:bg-[var(--color-lavender-blush)]'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-[var(--color-old-rose)]'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}

          {showActivities && userRole !== 'superadmin' && (
            <Link
              href="/activities"
              className={`
                flex items-center gap-2 px-4 py-2 rounded-[10px] transition-all group
                ${isActive('/activities')
                  ? 'bg-gradient-to-r from-[var(--color-old-rose)] to-[var(--color-melon)] text-white shadow-lg shadow-[var(--color-old-rose)]/30' 
                  : 'text-gray-600 hover:bg-[var(--color-lavender-blush)]'
                }
              `}
            >
              <Activity className={`w-5 h-5 flex-shrink-0 ${isActive('/activities') ? 'text-white' : 'text-gray-500 group-hover:text-[var(--color-old-rose)]'}`} />
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
                <Icon className="w-5 h-5 text-gray-500 hover:text-[var(--color-old-rose)]" />
              </Link>
            )
          })}

          {/* User Menu */}
          <div className="relative user-menu-container">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-[var(--color-lavender-blush)] rounded-lg transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-old-rose)] flex items-center justify-center shadow-md overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-semibold">{getUserInitials()}</span>
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--color-snow)] rounded-xl shadow-xl border border-gray-100 py-2 z-[100]">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.user_metadata?.name || 'Usuário'}
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
                    router.push('/settings/preferences')
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
      </nav>
    )
  }

  // Layout Sidebar (Esquerda ou Direita)
  const sidePosition = (menuPosition === 'sidebar' || menuPosition === 'right') 
    ? (menuPosition === 'right' ? 'right' : 'left')
    : 'left'

  return (
    <>
      <aside className={`fixed ${sidePosition}-0 top-0 h-screen bg-[var(--color-snow)] shadow-lg flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo & Toggle */}
        <div className="p-6 flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="CakeCloud" className="w-25 h-25" />
            </Link>
          )}
          {isCollapsed && (
            <img src="/logo.svg" alt="CakeCloud" className="w-10 h-10 mx-auto" />
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className={`absolute ${sidePosition === 'left' ? '-right-3' : '-left-3'} top-8 w-6 h-6 bg-[var(--color-old-rose)] hover:bg-[var(--color-rosy-brown)] rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${isCollapsed ? (sidePosition === 'left' ? 'rotate-180' : '') : (sidePosition === 'right' ? 'rotate-180' : '')}`}
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        {/* User Profile */}
        <div className={`px-4 pb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="relative user-menu-container">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-3 p-3 hover:bg-[var(--color-lavender-blush)] rounded-xl transition-all w-full cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-old-rose)] flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <p className="text-xs text-gray-600">
                    Olá,
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.user_metadata?.name || 'Usuário'}
                  </p>
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className={`absolute ${isCollapsed ? 'left-full ml-2' : 'left-0'} top-0 w-64 bg-[var(--color-snow)] rounded-xl shadow-xl border border-gray-100 py-2 z-[100]`}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.user_metadata?.name || 'Usuário'}
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
                    router.push('/settings/preferences')
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

        {/* Main Menu */}
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
                      ? 'bg-gradient-to-r from-[var(--color-old-rose)] to-[var(--color-melon)] text-white shadow-lg shadow-[var(--color-old-rose)]/30' 
                      : 'text-gray-600 hover:bg-[var(--color-lavender-blush)]'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-[var(--color-old-rose)]'}`} />
                  {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                </Link>
              )
            })}

            {/* Item Atividades (condicional) */}
            {showActivities && userRole !== 'superadmin' && (
              <Link
                href="/activities"
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all group
                  ${isActive('/activities')
                    ? 'bg-gradient-to-r from-[var(--color-old-rose)] to-[var(--color-melon)] text-white shadow-lg shadow-[var(--color-old-rose)]/30' 
                    : 'text-gray-600 hover:bg-[var(--color-lavender-blush)]'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? 'Atividades' : ''}
              >
                <Activity className={`w-5 h-5 flex-shrink-0 ${isActive('/activities') ? 'text-white' : 'text-gray-500 group-hover:text-[var(--color-old-rose)]'}`} />
                {!isCollapsed && <span className="font-medium text-sm">Atividades</span>}
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {/* Notifications */}
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-gray-600 hover:bg-[var(--color-lavender-blush)] relative group ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Notificações' : ''}
          >
            <Bell className="w-5 h-5 flex-shrink-0 text-gray-500 group-hover:text-[var(--color-old-rose)]" />
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
                    ? 'bg-[var(--color-lavender-blush)] text-[var(--color-old-rose)]' 
                    : 'text-gray-600 hover:bg-[var(--color-lavender-blush)]'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[var(--color-old-rose)]' : 'text-gray-500 group-hover:text-[var(--color-old-rose)]'}`} />
                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
