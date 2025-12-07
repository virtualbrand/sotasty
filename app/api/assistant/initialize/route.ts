import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key não configurada' },
        { status: 500 }
      )
    }
    
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
    const supabase = await createClient()
    
    // Pega o usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    
    // Verifica se já tem um vector store criado
    const { data: profile } = await supabase
      .from('profiles')
      .select('openai_vector_store_id')
      .eq('id', user.id)
      .single()
    
    if (profile?.openai_vector_store_id) {
      return NextResponse.json({
        message: 'Vector Store já existe',
        vectorStoreId: profile.openai_vector_store_id
      })
    }
    
    // Cria o Vector Store para a base de conhecimento do cliente
    const vectorStore = await openai.vectorStores.create({
      name: `Base de Conhecimento - ${user.email}`,
    })
    
    // Salva o ID no perfil do cliente
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        openai_vector_store_id: vectorStore.id,
        vector_store_created_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Erro ao salvar vector store no perfil:', updateError)
      // Tenta deletar o vector store criado para não deixar órfão
      try {
        await openai.vectorStores.delete(vectorStore.id)
      } catch (e) {
        console.error('Erro ao deletar vector store:', e)
      }
      throw updateError
    }
    
    return NextResponse.json({
      message: 'Vector Store criado com sucesso',
      vectorStoreId: vectorStore.id
    })
    
  } catch (error: unknown) {
    console.error('Erro ao criar vector store:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar vector store' },
      { status: 500 }
    )
  }
}

// GET para verificar status do vector store
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('openai_vector_store_id, vector_store_created_at')
      .eq('id', user.id)
      .single()
    
    return NextResponse.json({
      hasVectorStore: !!profile?.openai_vector_store_id,
      vectorStoreId: profile?.openai_vector_store_id,
      createdAt: profile?.vector_store_created_at
    })
    
  } catch (error: unknown) {
    console.error('Erro ao verificar vector store:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao verificar vector store' },
      { status: 500 }
    )
  }
}
