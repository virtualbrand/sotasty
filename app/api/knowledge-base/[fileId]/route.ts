import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key não configurada.' },
        { status: 500 }
      )
    }

    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { error: 'ID do arquivo não fornecido.' },
        { status: 400 }
      )
    }

    // Deleta o arquivo do OpenAI
    await openai.files.delete(fileId)

    return NextResponse.json({ 
      success: true,
      message: 'Arquivo removido com sucesso.'
    })
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar arquivo.' },
      { status: 500 }
    )
  }
}
