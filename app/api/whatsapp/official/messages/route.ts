import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID é obrigatório' },
        { status: 400 }
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

    // Buscar mensagens do Supabase (armazenamento local)
    // A API Oficial do WhatsApp não fornece histórico de mensagens antigas
    // Precisamos armazená-las localmente via webhooks
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('user_id', user.id)
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

    // Formatar mensagens para o frontend
    const formattedMessages = (messages || []).map((msg) => ({
      id: msg.message_id,
      content: msg.content,
      timestamp: msg.timestamp,
      fromMe: msg.from_me,
      status: msg.status || 'sent',
      mediaUrl: msg.media_url,
      mediaType: msg.media_type,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
