import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase para uso em webhook (sem auth context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Webhook verification token (configurar no Meta App Dashboard)
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'sotasty_webhook_token';

// GET: Verificação do webhook pelo Facebook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  );
}

// POST: Receber mensagens do WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    

    // Verificar se é uma notificação de mensagem
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Processar mensagens recebidas
            if (value.messages) {
              for (const message of value.messages) {
                await processIncomingMessage(message, value);
              }
            }

            // Processar status de mensagens (entregue, lido, etc)
            if (value.statuses) {
              for (const status of value.statuses) {
                await processMessageStatus(status);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processIncomingMessage(message: Record<string, unknown>, value: Record<string, unknown>) {
  try {
    const contactPhone = message.from as string;
    const messageId = message.id as string;
    const timestamp = new Date(parseInt(message.timestamp as string) * 1000).toISOString();
    
    // Extrair conteúdo da mensagem
    let content = '';
    let mediaUrl = '';
    let mediaType = '';
    
    if (message.type === 'text') {
      content = (message.text as Record<string, unknown>)?.body as string || '';
    } else if (message.type === 'image') {
      content = '📷 Imagem';
      mediaUrl = (message.image as Record<string, unknown>)?.id as string || '';
      mediaType = 'image';
    } else if (message.type === 'audio') {
      content = '🎵 Áudio';
      mediaUrl = (message.audio as Record<string, unknown>)?.id as string || '';
      mediaType = 'audio';
    } else if (message.type === 'video') {
      content = '🎥 Vídeo';
      mediaUrl = (message.video as Record<string, unknown>)?.id as string || '';
      mediaType = 'video';
    } else if (message.type === 'document') {
      content = '📄 Documento';
      mediaUrl = (message.document as Record<string, unknown>)?.id as string || '';
      mediaType = 'document';
    }

    // Obter informações do contato
    const contacts = value.contacts as Array<Record<string, unknown>> | undefined;
    const contactName = (contacts?.[0]?.profile as Record<string, unknown>)?.name as string || contactPhone;

    // Buscar configuração do WhatsApp para saber de qual usuário é
    const { data: configs } = await supabase
      .from('whatsapp_config')
      .select('user_id, phone_number_id')
      .eq('auth_method', 'official')
      .eq('connected', true);

    if (!configs || configs.length === 0) {
      return;
    }

    // Encontrar o usuário dono deste número
    const metadata = value.metadata as Record<string, unknown> | undefined;
    const phoneNumberId = metadata?.phone_number_id as string;
    const userConfig = configs.find((c) => c.phone_number_id === phoneNumberId);
    
    if (!userConfig) {
      return;
    }

    // Salvar mensagem no banco
    const { error } = await supabase.from('whatsapp_messages').insert({
      user_id: userConfig.user_id,
      message_id: messageId,
      contact_id: contactPhone,
      contact_name: contactName,
      contact_phone: contactPhone,
      content: content,
      media_url: mediaUrl,
      media_type: mediaType,
      from_me: false,
      status: 'received',
      read: false,
      timestamp: timestamp,
    });

    if (error) {
      console.error('Erro ao salvar mensagem:', error);
    } else {
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
}

async function processMessageStatus(status: Record<string, unknown>) {
  try {
    const messageId = status.id as string;
    const statusValue = status.status as string; // 'sent', 'delivered', 'read', 'failed'

    // Atualizar status da mensagem no banco
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ status: statusValue })
      .eq('message_id', messageId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
    } else {
    }
  } catch (error) {
    console.error('Erro ao processar status:', error);
  }
}
