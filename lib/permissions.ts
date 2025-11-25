export interface UserPermissions {
  dashboard: boolean
  products: boolean
  menus: boolean
  orders: boolean
  financial: boolean
  messages: boolean
  support: boolean
  customers: boolean
  agenda: boolean
  activities: boolean
}

export const defaultPermissions: UserPermissions = {
  dashboard: false,
  products: false,
  menus: false,
  orders: false,
  financial: false,
  messages: false,
  support: false,
  customers: false,
  agenda: false,
  activities: false,
}

// Mapa de permissões para rotas
export const permissionRoutes: Record<keyof UserPermissions, string> = {
  dashboard: '/dashboard',
  products: '/products',
  menus: '/cardapios',
  orders: '/orders',
  financial: '/financeiro',
  messages: '/mensagens',
  support: '/atendimento',
  customers: '/customers',
  agenda: '/agenda',
  activities: '/activities',
}

// Ordem de prioridade das rotas
export const routePriority: Array<keyof UserPermissions> = [
  'dashboard',
  'products',
  'menus',
  'orders',
  'financial',
  'messages',
  'support',
  'customers',
  'agenda',
  'activities',
]

/**
 * Retorna a primeira rota que o usuário tem permissão de acessar
 */
export function getFirstAllowedRoute(
  permissions: UserPermissions | null,
  role: string
): string {
  // Admin e superadmin têm acesso a tudo, sempre começam no dashboard
  if (role === 'admin' || role === 'superadmin') {
    return '/dashboard'
  }

  // Se não tem permissões definidas, vai para dashboard por padrão
  if (!permissions) {
    return '/dashboard'
  }

  // Procura a primeira permissão ativa na ordem de prioridade
  for (const permission of routePriority) {
    if (permissions[permission]) {
      return permissionRoutes[permission]
    }
  }

  // Se não tem nenhuma permissão, vai para dashboard
  return '/dashboard'
}
