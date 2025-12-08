import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Usar service role key para acessar auth.users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Buscar todos os perfis com role = 'admin'
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        workspace_id,
        business_name,
        phone,
        trial_start_date,
        trial_end_date,
        is_trial_active,
        subscription_status,
        subscription_plan,
        last_login,
        created_at
      `)
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (profilesError) throw profilesError

    // Buscar contagem de produtos por workspace
    const productCounts = new Map()
    for (const profile of profiles || []) {
      const { count } = await supabase
        .from('final_products')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', profile.workspace_id)
      productCounts.set(profile.id, count || 0)
    }

    // Buscar contagem de pedidos por workspace
    const orderCounts = new Map()
    for (const profile of profiles || []) {
      const { count, data, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', profile.workspace_id)
      
      console.log(`📊 Orders for workspace ${profile.workspace_id}:`, { count, error })
      orderCounts.set(profile.id, count || 0)
    }

    // Buscar emails correspondentes
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) throw usersError

    // Criar mapa de emails e metadados
    const userMap = new Map(users.map(u => [u.id, { email: u.email || '', name: u.user_metadata?.full_name || u.email?.split('@')[0] || '' }]))

    // Mapear perfis para incluir email, contagens e usar nome do perfil como fallback
    const adminCustomers = profiles.map(profile => {
      const user = userMap.get(profile.id)
      return {
        ...profile,
        email: user?.email || '',
        business_name: profile.business_name || user?.name || 'Sem nome',
        products_count: productCounts.get(profile.id) || 0,
        orders_count: orderCounts.get(profile.id) || 0
      }
    })

    return NextResponse.json(adminCustomers)
  } catch (error) {
    console.error('Error fetching admin customers:', error)
    return NextResponse.json({ error: 'Failed to fetch admin customers' }, { status: 500 })
  }
}
