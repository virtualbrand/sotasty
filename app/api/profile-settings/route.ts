import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Buscar configurações do perfil
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

    // Buscar configurações de profile_settings
    const { data: settings, error } = await supabase
      .from('profile_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Buscar logo_url da tabela profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('logo_url')
      .eq('id', user.id)
      .single()


    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar configurações:', error)
      return NextResponse.json(
        { error: `Erro ao buscar configurações: ${error.message}`, details: error },
        { status: 500 }
      )
    }

    // Se não existir, criar configuração padrão
    if (!settings) {
      
      const { data: newSettings, error: createError } = await supabase
        .from('profile_settings')
        .insert({
          user_id: user.id
        })
        .select()
        .single()

      if (createError) {
        console.error('Erro ao criar configurações:', createError)
        return NextResponse.json(
          { error: `Erro ao criar configurações: ${createError.message}`, details: createError },
          { status: 500 }
        )
      }

      // Incluir logo_url do profile
      return NextResponse.json({
        ...newSettings,
        logo_url: profile?.logo_url || null
      })
    }

    // Incluir logo_url do profile
    return NextResponse.json({
      ...settings,
      logo_url: profile?.logo_url || settings.logo_url || null
    })
  } catch (error) {
    console.error('Erro na API de configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar configurações do perfil
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    
    const {
      business_name,
      custom_url_slug,
      custom_domain,
      logo_url,
      primary_color,
      secondary_color,
      description,
      whatsapp_number,
      instagram_handle,
      address
    } = body

    // Validar custom_url_slug se fornecido
    if (custom_url_slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(custom_url_slug)) {
        return NextResponse.json(
          { error: 'URL personalizada inválida. Use apenas letras minúsculas, números e hífens.' },
          { status: 400 }
        )
      }

      // Verificar se slug já existe
      const { data: existingSlug } = await supabase
        .from('profile_settings')
        .select('user_id')
        .eq('custom_url_slug', custom_url_slug)
        .neq('user_id', user.id)
        .single()

      if (existingSlug) {
        return NextResponse.json(
          { error: 'Esta URL já está em uso. Escolha outra.' },
          { status: 409 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}
    
    if (business_name !== undefined) updateData.business_name = business_name?.trim() || null
    if (custom_url_slug !== undefined) updateData.custom_url_slug = custom_url_slug?.trim() || null
    if (custom_domain !== undefined) {
      // Se custom_domain for definido, resetar verificação
      updateData.custom_domain = custom_domain?.trim() || null
      if (custom_domain) {
        updateData.custom_domain_verified = false
        updateData.custom_domain_verified_at = null
      }
    }
    if (logo_url !== undefined) updateData.logo_url = logo_url?.trim() || null
    if (primary_color !== undefined) updateData.primary_color = primary_color?.trim() || null
    if (secondary_color !== undefined) updateData.secondary_color = secondary_color?.trim() || null
    if (description !== undefined) updateData.description = description?.trim() || null
    if (whatsapp_number !== undefined) updateData.whatsapp_number = whatsapp_number?.trim() || null
    if (instagram_handle !== undefined) updateData.instagram_handle = instagram_handle?.trim() || null
    if (address !== undefined) updateData.address = address?.trim() || null


    // Atualizar ou criar configurações
    const { data: settings, error } = await supabase
      .from('profile_settings')
      .upsert({
        user_id: user.id,
        ...updateData
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()


    if (error) {
      console.error('Erro ao atualizar configurações:', error)
      return NextResponse.json(
        { error: `Erro ao atualizar configurações: ${error.message}`, details: error },
        { status: 500 }
      )
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erro na API de configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
