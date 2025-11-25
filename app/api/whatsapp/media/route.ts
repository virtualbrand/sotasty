import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ''

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    const instance = searchParams.get('instance') || EVOLUTION_INSTANCE

    if (!messageId || !instance) {
      return NextResponse.json({ error: 'messageId e instance são obrigatórios' }, { status: 400 })
    }


    // Usar o endpoint correto da Evolution API para buscar mídias
    const response = await fetch(
      `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instance}`,
      {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            key: {
              id: messageId
            }
          },
          convertToMp4: false
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro ao buscar mídia:', errorText)
      return NextResponse.json({ error: 'Falha ao buscar mídia' }, { status: response.status })
    }

    const data = await response.json()

    if (!data.base64) {
      return NextResponse.json({ error: 'Mídia não disponível' }, { status: 404 })
    }

    // A Evolution API já retorna em base64
    return NextResponse.json({ 
      base64: data.base64,
      mimetype: data.mimetype || 'image/jpeg'
    })
  } catch (error) {
    console.error('Erro ao buscar mídia:', error)
    return NextResponse.json({ error: 'Erro ao buscar mídia' }, { status: 500 })
  }
}
