import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

// GET - Lista todos os arquivos da base de conhecimento
export async function GET() {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key não configurada.' },
        { status: 500 }
      )
    }

    // Busca todos os arquivos do assistente
    const files = await openai.files.list({
      purpose: 'assistants'
    })

    const formattedFiles = files.data.map((file) => ({
      id: file.id,
      name: file.filename,
      size: file.bytes,
      uploadedAt: new Date(file.created_at * 1000),
      status: 'completed' as const
    }))

    return NextResponse.json({ files: formattedFiles })
  } catch (error) {
    console.error('Erro ao listar arquivos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar arquivos da base de conhecimento.' },
      { status: 500 }
    )
  }
}
