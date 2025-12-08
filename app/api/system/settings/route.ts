import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Obter configuração do sistema
export async function GET(request: NextRequest) {
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

    // Buscar perfil para verificar se é superadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmins podem acessar configurações do sistema.' },
        { status: 403 }
      )
    }

    // Obter parâmetros de busca
    const searchParams = request.nextUrl.searchParams
    const settingKey = searchParams.get('key')

    if (settingKey) {
      // Buscar configuração específica
      const { data: setting, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', settingKey)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Configuração não encontrada' },
            { status: 404 }
          )
        }
        console.error('Erro ao buscar configuração:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ setting })
    }

    // Buscar todas as configurações
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('setting_key')

    if (error) {
      console.error('Erro ao buscar configurações:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Erro em GET /api/system/settings:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova configuração
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

    // Buscar perfil para verificar se é superadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmins podem criar configurações do sistema.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { setting_key, setting_value, description } = body

    // Validações
    if (!setting_key || !setting_value) {
      return NextResponse.json(
        { error: 'setting_key e setting_value são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar configuração
    const { data: setting, error } = await supabase
      .from('system_settings')
      .insert({
        setting_key,
        setting_value,
        description
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar configuração:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ setting }, { status: 201 })
  } catch (error) {
    console.error('Erro em POST /api/system/settings:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configuração existente
export async function PUT(request: NextRequest) {
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

    // Buscar perfil para verificar se é superadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmins podem atualizar configurações do sistema.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { setting_key, setting_value, description } = body

    // Validações
    if (!setting_key || !setting_value) {
      return NextResponse.json(
        { error: 'setting_key e setting_value são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar configuração
    const updateData: {
      setting_value: unknown
      description?: string
    } = {
      setting_value
    }
    
    if (description !== undefined) {
      updateData.description = description
    }

    const { data: setting, error } = await supabase
      .from('system_settings')
      .update(updateData)
      .eq('setting_key', setting_key)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar configuração:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Erro em PUT /api/system/settings:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar configuração
export async function DELETE(request: NextRequest) {
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

    // Buscar perfil para verificar se é superadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmins podem deletar configurações do sistema.' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const settingKey = searchParams.get('key')

    if (!settingKey) {
      return NextResponse.json(
        { error: 'Parâmetro key é obrigatório' },
        { status: 400 }
      )
    }

    // Proteger configurações críticas
    const protectedKeys = ['default_trial_days', 'trial_alert_thresholds']
    if (protectedKeys.includes(settingKey)) {
      return NextResponse.json(
        { error: 'Esta configuração não pode ser deletada' },
        { status: 403 }
      )
    }

    // Deletar configuração
    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('setting_key', settingKey)

    if (error) {
      console.error('Erro ao deletar configuração:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro em DELETE /api/system/settings:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
