import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// GET - Buscar um contexto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: context, error } = await supabase
      .from('assistant_contexts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar contexto:', error)
      return NextResponse.json({ error: 'Contexto não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ context })
  } catch (error) {
    console.error('Erro ao buscar contexto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar um contexto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { name, content } = await request.json()

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Nome e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar o perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('openai_vector_store_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Atualizar o contexto no banco
    const { error: updateError } = await supabase
      .from('assistant_contexts')
      .update({ 
        name,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar contexto:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar contexto' }, { status: 500 })
    }

    // Se o contexto for grande (>100 caracteres), adicionar ao Vector Store
    if (content.length > 100 && profile.openai_vector_store_id) {
      try {
        const openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        })

        // Criar arquivo temporário com o conteúdo atualizado
        const file = new File([content], `${name}.txt`, { type: 'text/plain' })
        
        const uploadedFile = await openaiClient.files.create({
          file: file,
          purpose: 'assistants',
        })

        // Adicionar ao Vector Store
        await openaiClient.vectorStores.files.create(
          profile.openai_vector_store_id,
          {
            file_id: uploadedFile.id,
          }
        )

        console.log(`Contexto atualizado adicionado ao Vector Store: ${uploadedFile.id}`)
      } catch (openaiError) {
        console.error('Erro ao atualizar no Vector Store:', openaiError)
        // Não falha a operação se o Vector Store falhar
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contexto atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar contexto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Remover um contexto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Excluir o contexto
    const { error: deleteError } = await supabase
      .from('assistant_contexts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Erro ao excluir contexto:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir contexto' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contexto removido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir contexto:', error)
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 })
  }
}
