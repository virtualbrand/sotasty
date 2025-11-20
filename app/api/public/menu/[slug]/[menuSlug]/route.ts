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

    // Cast data to expected type
    const menuData = data as {
      menu_id: string
      menu_name: string
      menu_description: string | null
      menu_active: boolean
      business_name: string | null
      business_description: string | null
      business_logo: string | null
      business_whatsapp: string | null
      business_instagram: string | null
      primary_color: string | null
      secondary_color: string | null
    }

    // Buscar itens do cardápio
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('menu_id', menuData.menu_id)
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
      .eq('menu_id', menuData.menu_id)
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
        menu_id: menuData.menu_id,
        ip_address: clientIp,
        user_agent: userAgent,
        referrer: referrer
      })

    // Montar resposta
    const response = {
      menu: {
        id: menuData.menu_id,
        name: menuData.menu_name,
        description: menuData.menu_description,
        active: menuData.menu_active
      },
      business: {
        name: menuData.business_name,
        description: menuData.business_description,
        logo_url: menuData.business_logo,
        whatsapp_number: menuData.business_whatsapp,
        instagram_handle: menuData.business_instagram,
        primary_color: menuData.primary_color,
        secondary_color: menuData.secondary_color
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
