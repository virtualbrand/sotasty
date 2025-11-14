import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ASSISTANT_ID = 'asst_qfjnWZdbBt4pXXZ2wo92sfrG'

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key não configurada.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido.' },
        { status: 400 }
      )
    }

    // Upload dos arquivos para o OpenAI
    const uploadedFiles = []
    for (const file of files) {
      const fileBuffer = await file.arrayBuffer()
      const fileBlob = new Blob([fileBuffer], { type: file.type })
      
      // Cria um File object compatível
      const openaiFile = new File([fileBlob], file.name, { type: file.type })
      
      const uploadedFile = await openai.files.create({
        file: openaiFile,
        purpose: 'assistants',
      })

      uploadedFiles.push({
        id: uploadedFile.id,
        name: uploadedFile.filename,
        size: uploadedFile.bytes,
      })
    }

    // Busca o assistente atual
    const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID)
    
    // Pega os vector_store_ids existentes do assistente
    const existingVectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || []

    // Atualiza o assistente para garantir que file_search está habilitado
    await openai.beta.assistants.update(ASSISTANT_ID, {
      tools: [{ type: 'file_search' }],
      tool_resources: {
        file_search: {
          vector_store_ids: existingVectorStoreIds,
        },
      },
    })

    return NextResponse.json({ 
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso.`
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload dos arquivos.' },
      { status: 500 }
    )
  }
}
