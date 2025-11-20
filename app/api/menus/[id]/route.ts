import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Buscar cardápio específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar cardápio com itens
    const { data: menu, error } = await supabase
      .from('menus')
      .select(`
        *,
        menu_items (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar cardápio:', error)
      return NextResponse.json(
        { error: 'Cardápio não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Erro na API de cardápio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar cardápio
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, active, url_slug } = body

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (active !== undefined) updateData.active = active
    if (url_slug !== undefined) updateData.url_slug = url_slug

    // Atualizar cardápio
    const { data: menu, error } = await supabase
      .from('menus')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar cardápio:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar cardápio' },
        { status: 500 }
      )
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Erro na API de cardápio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir cardápio
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Excluir cardápio
    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao excluir cardápio:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir cardápio' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de cardápio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
