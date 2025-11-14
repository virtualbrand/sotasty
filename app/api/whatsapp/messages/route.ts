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
    const messages = messagesArray.map((msg: Record<string, unknown>) => {
      // Extrair conteúdo da mensagem baseado no tipo
      let content = '';
      
      const message = msg.message as Record<string, unknown> | undefined;
      
      if (message?.conversation) {
        content = message.conversation as string;
      } else if (message?.extendedTextMessage) {
        const extText = message.extendedTextMessage as Record<string, unknown>;
        content = extText.text as string;
      } else if (message?.imageMessage) {
        const imgMsg = message.imageMessage as Record<string, unknown>;
        content = (imgMsg.caption as string) || '📷 Imagem';
      } else if (message?.audioMessage) {
        content = '🎵 Áudio';
      } else if (message?.documentMessage) {
        content = '📄 Documento';
      } else if (message?.videoMessage) {
        content = '🎥 Vídeo';
      } else if (msg.messageType === 'imageMessage') {
        content = '📷 Imagem';
      } else if (msg.messageType === 'audioMessage') {
        content = '🎵 Áudio';
      }
      
      const key = msg.key as Record<string, unknown> | undefined;
      
      return {
        id: (key?.id || msg.id) as string,
        content: content,
        timestamp: new Date(((msg.messageTimestamp as number) || 0) * 1000).toISOString(),
        fromMe: (key?.fromMe || false) as boolean,
        status: (msg.status as number) === 3 ? 'read' : (msg.status as number) === 2 ? 'delivered' : 'sent',
        messageTimestamp: (msg.messageTimestamp as number) || 0
      };
    })
    .filter((msg: { content: string }) => msg.content) // Filtrar mensagens sem conteúdo
    .sort((a: { messageTimestamp: number }, b: { messageTimestamp: number }) => 
      a.messageTimestamp - b.messageTimestamp
    ); // Ordenar por timestamp (mais antigas primeiro)

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
