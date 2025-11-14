import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, instance } = body

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Telefone e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Usar instance do body ou fallback para variável de ambiente
    const instanceName = instance || EVOLUTION_INSTANCE

    if (!instanceName) {
      return NextResponse.json({ error: 'Instância não configurada' }, { status: 400 })
    }

    // Formatar número para WhatsApp (adicionar @s.whatsapp.net se necessário)
    const formattedNumber = to.includes('@') ? to : `${to}@s.whatsapp.net`

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: formattedNumber,
          text: message,
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: 'Falha ao enviar mensagem', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      messageId: data.key?.id,
      data
    })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}
