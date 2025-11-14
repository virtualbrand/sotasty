import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Esta rota salva contextos de texto que serão injetados nas conversas do assistente
export async function POST(request: NextRequest) {
  try {
    const { name, content } = await request.json()

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Nome e conteúdo são obrigatórios.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 }
      )
    }

    // Salva o contexto no Supabase
    const { data, error } = await supabase
      .from('assistant_contexts')
      .insert([
        {
          user_id: user.id,
          name: name,
          content: content,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar contexto:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar contexto no banco de dados.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      context: data,
      message: 'Contexto adicionado com sucesso.'
    })
  } catch (error) {
    console.error('Erro ao processar contexto:', error)
    return NextResponse.json(
      { error: 'Erro ao processar contexto.' },
      { status: 500 }
    )
  }
}

// GET - Lista todos os contextos do usuário
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 }
      )
    }

    // Busca contextos do usuário
    const { data: contexts, error } = await supabase
      .from('assistant_contexts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar contextos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar contextos.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ contexts: contexts || [] })
  } catch (error) {
    console.error('Erro ao listar contextos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar contextos.' },
      { status: 500 }
    )
  }
}
