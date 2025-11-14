import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ''

export async function GET(request: NextRequest) {
  try {
    // Pegar o nome da instância da query string ou da variável de ambiente
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instance') || EVOLUTION_INSTANCE;

    if (!instanceName) {
      return NextResponse.json({ error: 'Instância não configurada' }, { status: 400 })
    }

    console.log('Buscando chats da instância:', instanceName);

    // Buscar chats para obter conversas com metadados completos
    const response = await fetch(
      `${EVOLUTION_API_URL}/chat/findChats/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          where: {},
          limit: 100
        }),
      }
    )

    console.log('Evolution API chats response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Evolution API chats error:', errorText);
      return NextResponse.json([])
    }

    const data = await response.json()
    
    // Verificar se a resposta é um erro da Evolution API
    if (data.error || data.status === 500) {
      console.log('Evolution API retornou erro:', data);
      return NextResponse.json([])
    }
    
    // Extrair chats do formato paginado
    const chats = data.chats?.records || data || [];
    
    console.log('Chats retornados:', chats.length);
    
    if (!Array.isArray(chats) || chats.length === 0) {
      return NextResponse.json([])
    }

    // Formatar número no estilo WhatsApp brasileiro
    const formatPhone = (num: string) => {
      const cleaned = num.replace(/\D/g, '');
      
      if (cleaned.startsWith('55') && cleaned.length >= 12) {
        const countryCode = cleaned.slice(0, 2);
        const areaCode = cleaned.slice(2, 4);
        const firstPart = cleaned.slice(4, 9);
        const secondPart = cleaned.slice(9);
        return `+${countryCode} ${areaCode} ${firstPart}-${secondPart}`;
      }
      
      if (cleaned.length > 10) {
        return `+${cleaned}`;
      }
      
      if (cleaned.length === 11) {
        const areaCode = cleaned.slice(0, 2);
        const firstPart = cleaned.slice(2, 7);
        const secondPart = cleaned.slice(7);
        return `(${areaCode}) ${firstPart}-${secondPart}`;
      }
      
      return num;
    };

    // Formatar contatos para o frontend
    const formattedContacts = chats
      .filter((contact: Record<string, unknown>) => {
        // Filtrar status broadcasts
        return !contact.id?.toString().includes('status@broadcast');
      })
      .map((chat: Record<string, unknown>) => {
        const remoteJid = chat.id as string;
        const isGroup = remoteJid?.endsWith('@g.us');
        const phone = remoteJid?.split('@')[0] || '';
        
        // Buscar última mensagem do chat
        const lastMsg = chat.lastMessage as Record<string, unknown> | undefined;
        let lastMessageText = '';
        let lastMessageTime = '';
        
        if (lastMsg) {
          const msg = lastMsg.message as Record<string, unknown> | undefined;
          if (msg?.conversation) {
            lastMessageText = msg.conversation as string;
          } else if (msg && (msg.extendedTextMessage as Record<string, unknown>)?.text) {
            lastMessageText = (msg.extendedTextMessage as Record<string, unknown>).text as string;
          } else if (msg?.imageMessage) {
            lastMessageText = '📷 Imagem';
          } else if (msg?.audioMessage) {
            lastMessageText = '🎵 Áudio';
          } else if (msg?.documentMessage) {
            lastMessageText = '📄 Documento';
          } else if (msg?.videoMessage) {
            lastMessageText = '🎥 Vídeo';
          }
          
          const timestamp = lastMsg.messageTimestamp as number | undefined;
          lastMessageTime = timestamp
            ? new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : '';
        }
        
        // Nome: para grupos usar o nome do chat, para contatos usar pushName
        let displayName = '';
        
        if (isGroup) {
          // Para grupos: usar o campo 'name' que contém o nome do grupo
          displayName = (chat.name || chat.conversationName || '') as string;
        } else {
          // Para contatos individuais: usar pushName
          displayName = (chat.pushName || chat.name || chat.conversationName || '') as string;
        }
        
        if (!displayName) {
          displayName = formatPhone(phone);
        }
        
        return {
          id: remoteJid,
          name: displayName,
          phone: isGroup ? '' : formatPhone(phone),
          rawPhone: isGroup ? '' : phone,
          avatar: (chat.profilePictureUrl as string) || null,
          lastMessage: lastMessageText,
          lastMessageTime: lastMessageTime,
          unreadCount: (chat.unreadCount as number) || 0,
          isOnline: false,
          isGroup: isGroup
        };
      })
      .filter((contact: Record<string, unknown>) => contact.lastMessage) // Apenas contatos com mensagens
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        // Ordenar por horário da última mensagem (mais recente primeiro)
        const timeA = (a.lastMessageTime || '') as string;
        const timeB = (b.lastMessageTime || '') as string;
        return timeB.localeCompare(timeA);
      });

    console.log('Contatos formatados:', formattedContacts.length);

    return NextResponse.json(formattedContacts)
  } catch (error) {
    console.error('Erro ao buscar contatos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contatos' },
      { status: 500 }
    )
  }
}
