import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFirstAllowedRoute } from '@/lib/permissions'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  // Se não estiver logado, redireciona para login
  if (!user) {
    redirect('/auth/login')
  }

  // Buscar permissões e role do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('permissions, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'member'
  const permissions = profile?.permissions || null

  // Admin e superadmin sempre têm acesso ao dashboard
  if (role === 'admin' || role === 'superadmin') {
    redirect('/dashboard')
  }

  // Se o usuário tem permissão de dashboard, permite acesso
  if (permissions?.dashboard === true) {
    redirect('/dashboard')
  }

  // Se não tem permissão de dashboard, redireciona para a primeira rota permitida
  const firstRoute = getFirstAllowedRoute(permissions, role)
  
  redirect(firstRoute)
}
