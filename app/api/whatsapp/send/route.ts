import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Verificar qual método de autenticação está sendo usado
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Se tiver configuração da API Oficial
    if (config && config.auth_method === 'official' && config.connected) {
      return await sendViaOfficialAPI(to, message, config)
    }

    // Fallback para Evolution API
    return await sendViaEvolutionAPI(to, message, instance)
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}

// Enviar via API Oficial do WhatsApp
async function sendViaOfficialAPI(to: string, message: string, config: any) {
  try {
    // Formatar número (remover caracteres especiais, manter apenas números)
    const phoneNumber = to.replace(/\D/g, '')
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Erro API Oficial:', errorData)
      return NextResponse.json(
        { error: 'Falha ao enviar mensagem via API Oficial', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Salvar mensagem no banco de dados
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase.from('whatsapp_messages').insert({
        user_id: user.id,
        message_id: data.messages?.[0]?.id || `msg_${Date.now()}`,
        contact_id: phoneNumber,
        contact_phone: phoneNumber,
        content: message,
        from_me: true,
        status: 'sent',
        timestamp: new Date().toISOString(),
      })
    }
    
    return NextResponse.json({
      success: true,
      messageId: data.messages?.[0]?.id,
      method: 'official',
      data,
    })
  } catch (error) {
    console.error('Erro ao enviar via API Oficial:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem via API Oficial' },
      { status: 500 }
    )
  }
}

// Enviar via Evolution API
async function sendViaEvolutionAPI(to: string, message: string, instance?: string) {
  try {
    const instanceName = instance || EVOLUTION_INSTANCE

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Instância não configurada' },
        { status: 400 }
      )
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
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: 'Falha ao enviar mensagem via Evolution', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      messageId: data.key?.id,
      method: 'evolution',
      data,
    })
  } catch (error) {
    console.error('Erro ao enviar via Evolution:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem via Evolution' },
      { status: 500 }
    )
  }
}
