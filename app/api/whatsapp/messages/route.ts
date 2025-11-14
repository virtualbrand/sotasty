import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ''

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const instanceName = searchParams.get('instance') || EVOLUTION_INSTANCE

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID é obrigatório' },
        { status: 400 }
      )
    }

    if (!instanceName) {
      return NextResponse.json({ error: 'Instância não configurada' }, { status: 400 })
    }

    console.log('Buscando mensagens para:', { contactId, instanceName })

    const response = await fetch(
      `${EVOLUTION_API_URL}/chat/findMessages/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          where: {
            key: {
              remoteJid: contactId
            }
          },
          limit: 100
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro ao buscar mensagens:', errorText)
      return NextResponse.json(
        { error: 'Falha ao buscar mensagens' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Resposta Evolution API:', Object.keys(data))
    
    // A Evolution API retorna as mensagens paginadas em data.messages.records
    const messagesArray = data.messages?.records || data.records || data.messages || data || []
    
    console.log('Mensagens encontradas:', messagesArray.length)
    
    if (!Array.isArray(messagesArray)) {
      console.error('Formato inesperado de resposta:', typeof messagesArray)
      return NextResponse.json([])
    }
    
    // Formatar mensagens para o frontend
    const messages = messagesArray.map((msg: any) => {
      // Extrair conteúdo da mensagem baseado no tipo
      let content = '';
      
      if (msg.message?.conversation) {
        content = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        content = msg.message.extendedTextMessage.text;
      } else if (msg.message?.imageMessage) {
        content = msg.message.imageMessage.caption || '📷 Imagem';
      } else if (msg.message?.audioMessage) {
        content = '🎵 Áudio';
      } else if (msg.message?.documentMessage) {
        content = '📄 Documento';
      } else if (msg.message?.videoMessage) {
        content = '🎥 Vídeo';
      } else if (msg.messageType === 'imageMessage') {
        content = '📷 Imagem';
      } else if (msg.messageType === 'audioMessage') {
        content = '🎵 Áudio';
      }
      
      return {
        id: msg.key?.id || msg.id,
        content: content,
        timestamp: new Date((msg.messageTimestamp || 0) * 1000).toISOString(),
        fromMe: msg.key?.fromMe || false,
        status: msg.status === 3 ? 'read' : msg.status === 2 ? 'delivered' : 'sent'
      };
    }).filter((msg: any) => msg.content); // Filtrar mensagens sem conteúdo

    console.log('Mensagens formatadas:', messages.length);

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    )
  }
}
