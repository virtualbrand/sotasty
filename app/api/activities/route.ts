import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar workspace_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 })
    }

    // Parâmetros de filtro
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Query base
    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (category) {
      const categories = category.split(',')
      if (categories.length === 1) {
        query = query.eq('category', categories[0])
      } else {
        query = query.in('category', categories)
      }
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,action.ilike.%${search}%`)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Paginação
    query = query.range(offset, offset + limit - 1)

    const { data: activities, error, count } = await query

    console.log('🔍 Activities API - workspace_id:', profile.workspace_id)
    console.log('🔍 Activities API - count:', count)
    console.log('🔍 Activities API - activities:', activities?.length)
    console.log('🔍 Activities API - error:', error)

    if (error) {
      console.error('Erro ao buscar atividades:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Buscar nomes dos usuários
    if (activities && activities.length > 0) {
      const userIds = [...new Set(activities.map(a => a.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      // Mapear nomes aos activities
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])
      activities.forEach(activity => {
        activity.profiles = { full_name: profileMap.get(activity.user_id) || 'Usuário' }
      })
    }

    return NextResponse.json({
      activities: activities || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Erro ao buscar atividades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
