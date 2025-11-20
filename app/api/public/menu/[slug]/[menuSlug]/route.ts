import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    slug: string
    menuSlug: string
  }>
}

// GET - Buscar cardápio público por URL
// URL Format: /[slug]/[menuSlug]
// Example: /conto-atelier/cardapio-bolos
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { slug, menuSlug } = await params

    // Buscar cardápio usando a função do banco
    const { data, error } = await supabase
      .rpc('get_public_menu', {
        p_custom_url_slug: slug,
        p_menu_url_slug: menuSlug
      })
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Cardápio não encontrado' },
        { status: 404 }
      )
    }

    // Buscar itens do cardápio
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('menu_id', data.menu_id)
      .eq('available', true)
      .order('display_order', { ascending: true })

    if (itemsError) {
      console.error('Erro ao buscar itens:', itemsError)
      return NextResponse.json(
        { error: 'Erro ao buscar itens do cardápio' },
        { status: 500 }
      )
    }

    // Buscar categorias (opcional)
    const { data: categories } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('menu_id', data.menu_id)
      .order('display_order', { ascending: true })

    // Registrar visualização (analytics)
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    await supabase
      .from('menu_views')
      .insert({
        menu_id: data.menu_id,
        ip_address: clientIp,
        user_agent: userAgent,
        referrer: referrer
      })

    // Montar resposta
    const response = {
      menu: {
        id: data.menu_id,
        name: data.menu_name,
        description: data.menu_description,
        active: data.menu_active
      },
      business: {
        name: data.business_name,
        description: data.business_description,
        logo_url: data.business_logo,
        whatsapp_number: data.business_whatsapp,
        instagram_handle: data.business_instagram,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color
      },
      items: items || [],
      categories: categories || []
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar cardápio público:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
