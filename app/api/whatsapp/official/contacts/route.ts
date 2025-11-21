import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar configuração da API Oficial
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!config || config.auth_method !== 'official' || !config.connected) {
      return NextResponse.json(
        { error: 'API Oficial não configurada' },
        { status: 400 }
      );
    }

    // Buscar contatos únicos do histórico de mensagens
    // A API Oficial não fornece lista de contatos, então usamos nosso banco
    const { data: contacts, error } = await supabase
      .from('whatsapp_messages')
      .select('contact_id, contact_name, contact_phone, timestamp')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Erro ao buscar contatos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar contatos' },
        { status: 500 }
      );
    }

    // Agrupar por contact_id e pegar a mensagem mais recente de cada
    const contactsMap = new Map();
    
    (contacts || []).forEach((msg) => {
      if (!contactsMap.has(msg.contact_id)) {
        contactsMap.set(msg.contact_id, {
          id: msg.contact_id,
          name: msg.contact_name || msg.contact_phone,
          phone: msg.contact_phone,
          rawPhone: msg.contact_phone,
          lastMessageTime: new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          lastMessageTimestamp: new Date(msg.timestamp).getTime(),
        });
      }
    });

    // Buscar última mensagem e contagem de não lidas para cada contato
    const formattedContacts = await Promise.all(
      Array.from(contactsMap.values()).map(async (contact) => {
        // Última mensagem
        const { data: lastMsg } = await supabase
          .from('whatsapp_messages')
          .select('content, media_type')
          .eq('user_id', user.id)
          .eq('contact_id', contact.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        // Contagem de não lidas
        const { count: unreadCount } = await supabase
          .from('whatsapp_messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
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
            lastMessage = lastMsg.content;
          }
        }

        return {
          ...contact,
          lastMessage,
          unreadCount: unreadCount || 0,
          isOnline: false,
        };
      })
    );

    // Ordenar por timestamp da última mensagem
    formattedContacts.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

    return NextResponse.json(formattedContacts);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
