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
      .select(`
        *,
        profiles!activities_user_id_fkey (
          full_name
        )
      `, { count: 'exact' })
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (category) {
      query = query.eq('category', category)
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

    if (error) {
      console.error('Erro ao buscar atividades:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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
