import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ''

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se está usando API Oficial
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Buscar workspace_id do perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('workspace_id')
        .eq('id', user.id)
        .single()

      if (profile?.workspace_id) {
        const { data: config } = await supabase
          .from('whatsapp_config')
          .select('*')
          .eq('workspace_id', profile.workspace_id)
          .single()

        // Se tiver configuração da API Oficial
        if (config && config.auth_method === 'official' && config.connected) {
          return await fetchMessagesOfficialAPI(profile.workspace_id, contactId, supabase)
        }
      }
    }

    // Fallback para Evolution API
    const instanceName = searchParams.get('instance') || EVOLUTION_INSTANCE

    if (!instanceName) {
      return NextResponse.json({ error: 'Instância não configurada' }, { status: 400 })
    }


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
    
    // A Evolution API retorna as mensagens paginadas em data.messages.records
    const messagesArray = data.messages?.records || data.records || data.messages || data || []
    
    
    if (!Array.isArray(messagesArray)) {
      console.error('Formato inesperado de resposta:', typeof messagesArray)
      return NextResponse.json([])
    }
    
    // Formatar mensagens para o frontend
    const messages = messagesArray.map((msg: Record<string, unknown>) => {
      // Extrair conteúdo da mensagem baseado no tipo
      let content = '';
      let mediaUrl = '';
      let mediaType = '';
      
      const message = msg.message as Record<string, unknown> | undefined;
      
      if (message?.conversation) {
        content = message.conversation as string;
      } else if (message?.extendedTextMessage) {
        const extText = message.extendedTextMessage as Record<string, unknown>;
        content = extText.text as string;
      } else if (message?.imageMessage) {
        const imgMsg = message.imageMessage as Record<string, unknown>;
        content = (imgMsg.caption as string) || '📷 Imagem';
        mediaUrl = (imgMsg.url as string) || '';
        mediaType = 'image';
      } else if (message?.audioMessage) {
        content = '🎵 Áudio';
        const audioMsg = message.audioMessage as Record<string, unknown>;
        mediaUrl = (audioMsg.url as string) || '';
        mediaType = 'audio';
      } else if (message?.documentMessage) {
        content = '📄 Documento';
        const docMsg = message.documentMessage as Record<string, unknown>;
        mediaUrl = (docMsg.url as string) || '';
        mediaType = 'document';
      } else if (message?.videoMessage) {
        content = '🎥 Vídeo';
        const videoMsg = message.videoMessage as Record<string, unknown>;
        mediaUrl = (videoMsg.url as string) || '';
        mediaType = 'video';
      } else if (msg.messageType === 'imageMessage') {
        content = '📷 Imagem';
        mediaType = 'image';
      } else if (msg.messageType === 'audioMessage') {
        content = '🎵 Áudio';
        mediaType = 'audio';
      }
      
      const key = msg.key as Record<string, unknown> | undefined;
      
      return {
        id: (key?.id || msg.id) as string,
        content: content,
        timestamp: new Date(((msg.messageTimestamp as number) || 0) * 1000).toISOString(),
        fromMe: (key?.fromMe || false) as boolean,
        status: (msg.status as number) === 3 ? 'read' : (msg.status as number) === 2 ? 'delivered' : 'sent',
        messageTimestamp: (msg.messageTimestamp as number) || 0,
        mediaUrl: mediaUrl,
        mediaType: mediaType
      };
    })
    .filter((msg: { content: string }) => msg.content) // Filtrar mensagens sem conteúdo
    .sort((a: { messageTimestamp: number }, b: { messageTimestamp: number }) => 
      a.messageTimestamp - b.messageTimestamp
    ); // Ordenar por timestamp (mais antigas primeiro)


    return NextResponse.json(messages)
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    )
  }
}

// Buscar mensagens via API Oficial (do banco de dados local)
async function fetchMessagesOfficialAPI(workspaceId: string, contactId: string, supabase: any) {
  try {
    // Buscar mensagens do Supabase
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('contact_id', contactId)
      .order('timestamp', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar mensagens' },
        { status: 500 }
      );
    }

    // Formatar mensagens
    const formattedMessages = (messages || []).map((msg: any) => ({
      id: msg.message_id,
      content: msg.content,
      timestamp: msg.timestamp,
      fromMe: msg.from_me,
      status: msg.status || 'sent',
      mediaUrl: msg.media_url,
      mediaType: msg.media_type,
      messageTimestamp: new Date(msg.timestamp).getTime() / 1000,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Erro ao buscar mensagens via API Oficial:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    );
  }
}
