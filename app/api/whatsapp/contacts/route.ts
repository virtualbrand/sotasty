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

    console.log('Buscando contatos da instância:', instanceName);

    // Buscar contatos para obter informações completas
    const contactsResponse = await fetch(
      `${EVOLUTION_API_URL}/chat/findContacts/${instanceName}`,
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

    console.log('Evolution API contacts response status:', contactsResponse.status);

    // Buscar chats para obter conversas com metadados completos
    const chatsResponse = await fetch(
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

    console.log('Evolution API chats response status:', chatsResponse.status);

    if (!chatsResponse.ok) {
      const errorText = await chatsResponse.text();
      console.log('Evolution API chats error:', errorText);
      return NextResponse.json([])
    }

    const chatsData = await chatsResponse.json()
    const contactsData = contactsResponse.ok ? await contactsResponse.json() : null;
    
    // Verificar se a resposta é um erro da Evolution API
    if (chatsData.error || chatsData.status === 500) {
      console.log('Evolution API retornou erro:', chatsData);
      return NextResponse.json([])
    }
    
    // Criar um mapa de contatos por ID para acesso rápido
    const contactsMap = new Map<string, Record<string, unknown>>();
    if (contactsData && Array.isArray(contactsData)) {
      contactsData.forEach((contact: Record<string, unknown>) => {
        const id = contact.id as string;
        if (id) {
          contactsMap.set(id, contact);
        }
      });
    }
    
    console.log('Contatos encontrados:', contactsMap.size);
    
    // Extrair chats do formato paginado
    const chats = chatsData.chats?.records || chatsData || [];
    
    console.log('Chats retornados:', chats.length);
    
    if (!Array.isArray(chats) || chats.length === 0) {
      return NextResponse.json([])
    }

    // Formatar número no estilo WhatsApp brasileiro
    const formatPhone = (num: string) => {
      const cleaned = num.replace(/\D/g, '');
      
      // Formato brasileiro com código do país (55)
      if (cleaned.startsWith('55') && cleaned.length >= 12) {
        const countryCode = cleaned.slice(0, 2);
        const areaCode = cleaned.slice(2, 4);
        const firstPart = cleaned.slice(4, 9);
        const secondPart = cleaned.slice(9);
        return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
      }
      
      // Outros países com código
      if (cleaned.length > 11) {
        const countryCode = cleaned.slice(0, -11);
        const areaCode = cleaned.slice(-11, -9);
        const firstPart = cleaned.slice(-9, -4);
        const secondPart = cleaned.slice(-4);
        return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
      }
      
      // Número brasileiro sem código do país (11 dígitos)
      if (cleaned.length === 11) {
        const areaCode = cleaned.slice(0, 2);
        const firstPart = cleaned.slice(2, 7);
        const secondPart = cleaned.slice(7);
        return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
      }
      
      // Número brasileiro antigo sem código do país (10 dígitos)
      if (cleaned.length === 10) {
        const areaCode = cleaned.slice(0, 2);
        const firstPart = cleaned.slice(2, 6);
        const secondPart = cleaned.slice(6);
        return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
      }
      
      return num;
    };

    // Formatar contatos para o frontend
    const formattedContacts = chats
      .filter((contact: Record<string, unknown>) => {
        const id = contact.id as string;
        // Filtrar status broadcasts e chats sem ID
        return id && !id.includes('status@broadcast');
      })
      .map((chat: Record<string, unknown>) => {
        const remoteJid = (chat.remoteJid || chat.id) as string;
        
        // Verificar se é grupo de várias formas
        const isGroup = remoteJid?.endsWith('@g.us') || 
                       remoteJid?.includes('g.us') ||
                       (chat.isGroup as boolean) === true;
        
        // IDs que começam com "cmhz" geralmente são grupos/comunidades/newsletters
        // Números de telefone reais são numéricos ou terminam em @s.whatsapp.net
        const phone = remoteJid?.split('@')[0] || '';
        const isPhoneNumber = /^\d+$/.test(phone);
        const isCommunityOrNewsletter = phone.startsWith('cmhz') || phone.startsWith('status');
        
        // Buscar informações do contato no mapa
        const contactInfo = contactsMap.get(remoteJid);
        
        // Buscar última mensagem do chat
        const lastMsg = chat.lastMessage as Record<string, unknown> | undefined;
        let lastMessageText = '';
        let lastMessageTime = '';
        let lastMessageTimestamp = 0;
        
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
          if (timestamp) {
            lastMessageTimestamp = timestamp;
            // Converter para horário de Brasília (UTC-3)
            const date = new Date(timestamp * 1000);
            lastMessageTime = date.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo'
            });
          }
        }
        
        // Nome: para grupos usar o nome do chat, para contatos usar pushName
        let displayName = '';
        
        if (isGroup || isCommunityOrNewsletter) {
          // Para grupos/comunidades: usar pushName ou nome do grupo
          displayName = (chat.pushName || chat.name || chat.conversationName || '') as string;
        } else if (isPhoneNumber) {
          // Para contatos individuais com número de telefone: tentar várias fontes de nome
          // Priorizar informações do endpoint de contatos
          displayName = (
            contactInfo?.pushName ||
            contactInfo?.name ||
            chat.pushName || 
            chat.name || 
            chat.conversationName || 
            chat.notifyName ||
            (chat.contact as Record<string, unknown>)?.name ||
            (chat.contact as Record<string, unknown>)?.notify ||
            ''
          ) as string;
          
          // Limpar o nome se for só espaços ou vazio
          displayName = displayName.trim();
        } else {
          // Para outros tipos (IDs especiais que não são telefones)
          displayName = (chat.pushName || chat.name || chat.conversationName || '') as string;
          displayName = displayName.trim();
        }
        
        // Se não tem nome, usar o telefone formatado (apenas para números válidos)
        if (!displayName && isPhoneNumber) {
          displayName = formatPhone(phone);
        } else if (!displayName) {
          // Para IDs que não são telefones, usar "Contato"
          displayName = 'Contato';
        }
        
        return {
          id: remoteJid,
          name: displayName,
          phone: (isPhoneNumber && !isGroup) ? formatPhone(phone) : '',
          rawPhone: (isPhoneNumber && !isGroup) ? phone : '',
          avatar: (contactInfo?.profilePictureUrl || chat.profilePictureUrl as string) || null,
          lastMessage: lastMessageText,
          lastMessageTime: lastMessageTime,
          lastMessageTimestamp: lastMessageTimestamp,
          unreadCount: (chat.unreadCount as number) || 0,
          isOnline: false,
          isGroup: isGroup || isCommunityOrNewsletter
        };
      })
      .filter((contact: Record<string, unknown>) => contact.lastMessage) // Apenas contatos com mensagens
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        // Ordenar por timestamp numérico (mais recente primeiro)
        const timestampA = (a.lastMessageTimestamp || 0) as number;
        const timestampB = (b.lastMessageTimestamp || 0) as number;
        return timestampB - timestampA;
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
