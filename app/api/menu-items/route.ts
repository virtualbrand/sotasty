import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Criar item do cardápio
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { menu_id, product_id, name, description, price, image_url, category, display_order, available } = body

    if (!menu_id || !name || price === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: menu_id, name, price' },
        { status: 400 }
      )
    }

    // Verificar se o menu pertence ao usuário
    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .select('id')
      .eq('id', menu_id)
      .eq('user_id', user.id)
      .single()

    if (menuError || !menu) {
      return NextResponse.json(
        { error: 'Cardápio não encontrado ou você não tem permissão' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        menu_id,
        product_id,
        name,
        description,
        price,
        image_url,
        category,
        display_order: display_order ?? 0,
        available: available ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar item do cardápio:', error)
      return NextResponse.json(
        { error: 'Erro ao criar item do cardápio' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar item do cardápio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar itens de um cardápio
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const menuId = searchParams.get('menu_id')

    if (!menuId) {
      return NextResponse.json(
        { error: 'menu_id é obrigatório' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('menu_id', menuId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar itens do cardápio:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar itens do cardápio' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar itens do cardápio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
