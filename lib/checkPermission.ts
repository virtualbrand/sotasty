import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserPermissions } from './permissions'

export interface PermissionCheck {
  hasPermission: boolean
  user: any
  profile: {
    role: string
    permissions: UserPermissions | null
  } | null
}

/**
 * Verifica se o usuário tem permissão para acessar uma página
 * Redireciona para login se não estiver autenticado
 * Redireciona para a primeira rota permitida se não tiver permissão
 */
export async function checkPagePermission(
  requiredPermission: keyof UserPermissions | null
): Promise<PermissionCheck> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  // Se não estiver logado, redireciona para login
  if (!user) {
    redirect('/auth/login')
  }

  // Buscar perfil do usuário com cache revalidado
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, permissions, updated_at')
    .eq('id', user.id)
    .single()

  // Verificar se as permissões foram atualizadas recentemente (últimos 5 segundos)
  // Se sim, força revalidação da sessão
  if (profile?.updated_at) {
    const updatedAt = new Date(profile.updated_at).getTime()
    const now = Date.now()
    const fiveSecondsAgo = now - 5000
    
    if (updatedAt > fiveSecondsAgo) {
      // Permissões foram atualizadas recentemente, força refresh da sessão
      await supabase.auth.refreshSession()
    }
  }

  // Admin e superadmin têm acesso a tudo
  if (profile?.role === 'admin' || profile?.role === 'superadmin') {
    return {
      hasPermission: true,
      user,
      profile: profile || null
    }
  }

  // Se não precisa de permissão específica (rota pública), permite acesso
  if (!requiredPermission) {
    return {
      hasPermission: true,
      user,
      profile: profile || null
    }
  }

  // Verificar se o usuário tem a permissão necessária
  const hasPermission = profile?.permissions?.[requiredPermission] === true

  return {
    hasPermission,
    user,
    profile: profile || null
  }
}
