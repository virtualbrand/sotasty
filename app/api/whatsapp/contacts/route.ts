import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ''

export async function GET(request: NextRequest) {
  try {
    // Verificar se está usando API Oficial
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Se tiver configuração da API Oficial, usar endpoint específico
      if (config && config.auth_method === 'official' && config.connected) {
        return await fetchContactsOfficialAPI(user.id, supabase)
      }
    }

    // Fallback para Evolution API
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
    const contactsWithPromises = chats
      .filter((contact: Record<string, unknown>) => {
        const id = contact.id as string;
        // Filtrar status broadcasts e chats sem ID
        return id && !id.includes('status@broadcast');
      })
      .map(async (chat: Record<string, unknown>) => {
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
        
        // Para avatares, vamos usar um placeholder que será gerenciado pelo frontend
        // A Evolution API não tem um endpoint consistente para fotos de perfil
        // As fotos virão diretamente dos dados de contato se disponíveis
        const avatarUrl = contactInfo?.profilePictureUrl || 
                         (chat.profilePictureUrl as string) || 
                         null;
        
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
          avatar: avatarUrl,
          lastMessage: lastMessageText,
          lastMessageTime: lastMessageTime,
          lastMessageTimestamp: lastMessageTimestamp,
          unreadCount: (chat.unreadCount as number) || 0,
          isOnline: false,
          isGroup: isGroup || isCommunityOrNewsletter
        };
      });

    // Aguardar todas as promises
    const allContacts = await Promise.all(contactsWithPromises);
    
    // Filtrar e ordenar
    const formattedContacts = allContacts
      .filter((contact) => contact.lastMessage) // Apenas contatos com mensagens
      .sort((a, b) => {
        // Ordenar por timestamp numérico (mais recente primeiro)
        return b.lastMessageTimestamp - a.lastMessageTimestamp;
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

// Buscar contatos via API Oficial
async function fetchContactsOfficialAPI(userId: string, supabase: any) {
  try {
    // Buscar contatos únicos do histórico de mensagens
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('contact_id, contact_name, contact_phone, timestamp, content, media_type, from_me')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Erro ao buscar contatos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar contatos' },
        { status: 500 }
      );
    }

    // Agrupar por contact_id
    const contactsMap = new Map();
    
    (messages || []).forEach((msg: any) => {
      if (!contactsMap.has(msg.contact_id)) {
        const timestamp = new Date(msg.timestamp);
        
        // Formatar telefone
        const formatPhone = (num: string) => {
          const cleaned = num.replace(/\D/g, '');
          if (cleaned.startsWith('55') && cleaned.length >= 12) {
            const countryCode = cleaned.slice(0, 2);
            const areaCode = cleaned.slice(2, 4);
            const firstPart = cleaned.slice(4, 9);
            const secondPart = cleaned.slice(9);
            return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
          }
          return num;
        };

        contactsMap.set(msg.contact_id, {
          id: msg.contact_id,
          name: msg.contact_name || formatPhone(msg.contact_phone),
          phone: formatPhone(msg.contact_phone),
          rawPhone: msg.contact_phone,
          lastMessage: '',
          lastMessageTime: timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          lastMessageTimestamp: timestamp.getTime(),
          unreadCount: 0,
          isOnline: false,
        });
      }
    });

    // Buscar última mensagem e não lidas para cada contato
    const formattedContacts = await Promise.all(
      Array.from(contactsMap.values()).map(async (contact: any) => {
        // Última mensagem
        const { data: lastMsg } = await supabase
          .from('whatsapp_messages')
          .select('content, media_type')
          .eq('user_id', userId)
          .eq('contact_id', contact.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        // Contagem de não lidas
        const { count: unreadCount } = await supabase
          .from('whatsapp_messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('contact_id', contact.id)
          .eq('from_me', false)
          .eq('read', false);

        let lastMessage = '';
        if (lastMsg) {
          if (lastMsg.media_type === 'image') {
            lastMessage = '📷 Imagem';
          } else if (lastMsg.media_type === 'audio') {
            lastMessage = '🎵 Áudio';
          } else if (lastMsg.media_type === 'video') {
            lastMessage = '🎥 Vídeo';
          } else if (lastMsg.media_type === 'document') {
            lastMessage = '📄 Documento';
          } else {
            lastMessage = lastMsg.content || '';
          }
        }

        return {
          ...contact,
          lastMessage,
          unreadCount: unreadCount || 0,
        };
      })
    );

    // Ordenar por timestamp
    formattedContacts.sort((a: any, b: any) => b.lastMessageTimestamp - a.lastMessageTimestamp);

    return NextResponse.json(formattedContacts);
  } catch (error) {
    console.error('Erro ao buscar contatos via API Oficial:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contatos' },
      { status: 500 }
    );
  }
}
