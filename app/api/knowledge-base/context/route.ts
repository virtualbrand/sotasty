import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

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

    // Busca o assistant e vector store do cliente
    const { data: profile } = await supabase
      .from('profiles')
      .select('openai_assistant_id, openai_vector_store_id')
      .eq('id', user.id)
      .single()

    // Se o conteúdo for grande o suficiente, também adiciona ao Vector Store
    let fileId = null
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    
    if (OPENAI_API_KEY && profile?.openai_vector_store_id && content.length > 100) {
      try {
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
        const vectorStoreId = profile.openai_vector_store_id

        // Cria um arquivo temporário com o contexto
        const blob = new Blob([content], { type: 'text/plain' })
        const file = new File([blob], `${name}.txt`, { type: 'text/plain' })
        
        // Upload do arquivo
        const uploadedFile = await openai.files.create({
          file: file,
          purpose: 'assistants',
        })

        // Adiciona ao vector store
        await openai.vectorStores.files.create(vectorStoreId, {
          file_id: uploadedFile.id,
        })

        fileId = uploadedFile.id
      } catch (error) {
        console.error('Erro ao adicionar contexto ao Vector Store:', error)
        // Continua mesmo se falhar - o contexto ainda será salvo no Supabase
      }
    }

    // Salva o contexto no Supabase
    const { data, error } = await supabase
      .from('assistant_contexts')
      .insert([
        {
          user_id: user.id,
          name: name,
          content: content,
          file_id: fileId,
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
      message: 'Contexto adicionado com sucesso à base de conhecimento.'
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
