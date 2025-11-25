import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Listar todos os cardápios do usuário
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar workspace_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile?.workspace_id) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      )
    }

    // Buscar cardápios do workspace
    const { data: menus, error } = await supabase
      .from('menus')
      .select(`
        *,
        menu_items (
          id,
          name,
          price,
          available
        )
      `)
      .eq('workspace_id', profile.workspace_id)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar cardápios:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar cardápios' },
        { status: 500 }
      )
    }

    // Adicionar contagem de itens
    const menusWithCount = menus?.map(menu => ({
      ...menu,
      items: menu.menu_items || [],
      itemCount: menu.menu_items?.length || 0
    }))

    return NextResponse.json(menusWithCount)
  } catch (error) {
    console.error('Erro na API de cardápios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo cardápio
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar workspace_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile?.workspace_id) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nome do cardápio é obrigatório' },
        { status: 400 }
      )
    }

    // Gerar slug único usando a função do banco
    const { data: slugData, error: slugError } = await supabase
      .rpc('generate_unique_slug', {
        p_name: name,
        p_user_id: user.id
      })

    if (slugError) {
      console.error('Erro ao gerar slug:', slugError)
      return NextResponse.json(
        { error: 'Erro ao gerar URL do cardápio' },
        { status: 500 }
      )
    }

    // Criar cardápio
    const { data: menu, error } = await supabase
      .from('menus')
      .insert({
        user_id: user.id,
        workspace_id: profile.workspace_id,
        name: name.trim(),
        description: description?.trim() || null,
        url_slug: slugData,
        active: true,
        display_order: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar cardápio:', error)
      return NextResponse.json(
        { error: 'Erro ao criar cardápio' },
        { status: 500 }
      )
    }

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    console.error('Erro na API de cardápios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
