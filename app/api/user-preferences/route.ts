import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar preferências do usuário
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar preferências:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar preferências' },
        { status: 500 }
      )
    }

    // Se não existir, retorna valores padrão
    if (!preferences) {
      return NextResponse.json({
        menu_position: 'sidebar',
        notification_settings: {},
        orders_default_view: 'list',
        orders_date_format: 'short',
        agenda_default_view: 'list',
        agenda_date_format: 'short',
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Erro ao buscar preferências:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar campos permitidos
    const allowedFields = [
      'menu_position',
      'notification_settings',
      'orders_default_view',
      'orders_date_format',
      'agenda_default_view',
      'agenda_date_format',
    ]
    
    const updates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = value
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualizar' },
        { status: 400 }
      )
    }

    // Verificar se já existe preferência para este usuário
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    if (existing) {
      // Atualizar
      result = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      // Criar
      result = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          ...updates
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Erro ao salvar preferências:', result.error)
      return NextResponse.json(
        { error: 'Erro ao salvar preferências' },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Erro ao salvar preferências:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
