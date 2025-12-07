import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Iniciando upload ===')
    
    // Inicializa o cliente OpenAI dentro da função para garantir que process.env seja lido
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não encontrada')
      return NextResponse.json(
        { error: 'OpenAI API key não configurada' },
        { status: 500 }
      )
    }
    
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    })
    
    const supabase = await createClient()
    
    // Pega o usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Usuário não autenticado:', userError)
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    
    console.log('Usuário autenticado:', user.email)
    
    // Busca o vector store ID do cliente
    const { data: profile } = await supabase
      .from('profiles')
      .select('openai_vector_store_id')
      .eq('id', user.id)
      .single()
    
    // Se não tem Vector Store, cria um novo
    let vectorStoreId = profile?.openai_vector_store_id
    
    if (!vectorStoreId) {
      console.log('Vector Store não encontrado, criando novo...')
      
      // Cria o Vector Store
      const vectorStore = await openai.vectorStores.create({
        name: `Base de Conhecimento - ${user.email}`,
      })
      
      vectorStoreId = vectorStore.id
      console.log('Vector Store criado:', vectorStoreId)
      
      // Salva no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          openai_vector_store_id: vectorStoreId,
          vector_store_created_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Erro ao salvar vector store:', updateError)
      } else {
        console.log('Vector Store salvo no perfil')
      }
    } else {
      console.log('Vector Store existente:', vectorStoreId)
    }

    console.log('Lendo FormData...')
    const formData = await request.formData()
    console.log('FormData lido, extraindo arquivos...')
    
    const files = formData.getAll('files') as File[]
    console.log('Arquivos recebidos:', files.length)

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido.' },
        { status: 400 }
      )
    }

    // Upload dos arquivos para o OpenAI e adiciona ao vector store
    const uploadedFiles = []
    for (const file of files) {
      console.log(`Processando arquivo: ${file.name}`)
      
      const fileBuffer = await file.arrayBuffer()
      const fileBlob = new Blob([fileBuffer], { type: file.type })
      
      // Cria um File object compatível
      const openaiFile = new File([fileBlob], file.name, { type: file.type })
      
      console.log(`Fazendo upload para OpenAI: ${file.name}`)
      // Upload do arquivo
      const uploadedFile = await openai.files.create({
        file: openaiFile,
        purpose: 'assistants',
      })
      
      console.log(`Arquivo enviado, ID: ${uploadedFile.id}`)

      // Adiciona o arquivo ao vector store
      console.log(`Adicionando ao Vector Store: ${vectorStoreId}`)
      await openai.vectorStores.files.create(vectorStoreId, {
        file_id: uploadedFile.id,
      })
      
      console.log(`Arquivo adicionado ao Vector Store`)

      uploadedFiles.push({
        id: uploadedFile.id,
        name: uploadedFile.filename,
        size: uploadedFile.bytes,
      })
    }

    console.log(`Upload completo: ${uploadedFiles.length} arquivo(s)`)
    return NextResponse.json({ 
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso e adicionado(s) à base de conhecimento.`
    })
  } catch (error: unknown) {
    console.error('Erro detalhado no upload:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro ao fazer upload dos arquivos: ${errorMessage}` },
      { status: 500 }
    )
  }
}
