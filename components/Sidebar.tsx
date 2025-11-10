'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  CakeSlice,
  ShoppingCart, 
  Users, 
  TrendingUp,
  Calendar,
  UserCheck,
  Shield,
  HelpCircle,
  MessageSquare,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: CakeSlice, label: 'Produtos', href: '/products' },
  { icon: ShoppingCart, label: 'Pedidos', href: '/orders' },
  { icon: Users, label: 'Clientes', href: '/customers' },
  { icon: TrendingUp, label: 'Performance', href: '/performance' },
  { icon: UserCheck, label: 'Funcionários', href: '/employees' },
  { icon: Shield, label: 'Segurança', href: '/security' },
]

const bottomMenuItems = [
  { icon: HelpCircle, label: 'Ajuda', href: '/help' },
  { icon: MessageSquare, label: 'Feedback', href: '/feedback' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

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

  return (
    <>
      <aside className={`fixed left-0 top-0 h-screen bg-[var(--color-snow)] shadow-lg flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
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
          className={`absolute -right-3 top-8 w-6 h-6 bg-[var(--color-old-rose)] hover:bg-[var(--color-rosy-brown)] rounded-full flex items-center justify-center shadow-lg transition-all ${isCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        {/* User Profile */}
        <div className={`px-4 pb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="relative user-menu-container">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all w-full ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-old-rose)] flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.user_metadata?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
                    router.push('/profile')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[var(--color-lavender-blush)] flex items-center gap-3 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Meu Perfil
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    router.push('/settings')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[var(--color-lavender-blush)] flex items-center gap-3 transition-colors"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Configurações
                </button>

                <div className="border-t border-gray-100 my-2"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                    ${active 
                      ? 'bg-gradient-to-r from-[var(--color-old-rose)] to-[var(--color-melon)] text-white shadow-lg shadow-[var(--color-old-rose)]/30' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'}`} />
                  {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                  {active && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Menu */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {/* Notifications */}
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-[var(--color-lavender-blush)] relative group ${isCollapsed ? 'justify-center' : ''}`}
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
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
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
