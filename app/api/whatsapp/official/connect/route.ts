import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumberId, accessToken, businessAccountId } = await request.json();

    if (!phoneNumberId || !accessToken || !businessAccountId) {
      return NextResponse.json(
        { error: 'Phone Number ID, Access Token e Business Account ID são obrigatórios' },
        { status: 400 }
      );
    }

    // Testar credenciais fazendo uma chamada à API do WhatsApp
    const testResponse = await fetch(
      `https://graph.facebook.com/v24.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!testResponse.ok) {
      const errorData = await testResponse.json();
      console.error('Erro ao validar credenciais:', errorData);
      
      return NextResponse.json(
        { 
          error: 'Credenciais inválidas. Verifique o Phone Number ID e o Access Token.',
          details: errorData.error?.message || 'Token ou ID inválido'
        },
        { status: 401 }
      );
    }

    const phoneData = await testResponse.json();
    console.log('Credenciais validadas com sucesso:', phoneData);

    // Salvar credenciais no Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar ou criar configuração do WhatsApp
    const { data: existingConfig } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const configData = {
      user_id: user.id,
      auth_method: 'official',
      phone_number_id: phoneNumberId,
      access_token: accessToken,
      business_account_id: businessAccountId,
      connected: true,
      updated_at: new Date().toISOString(),
    };

    if (existingConfig) {
      // Atualizar
      const { error: updateError } = await supabase
        .from('whatsapp_config')
        .update(configData)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar config:', updateError);
        return NextResponse.json(
          { error: 'Erro ao salvar configuração' },
          { status: 500 }
        );
      }
    } else {
      // Criar
      const { error: insertError } = await supabase
        .from('whatsapp_config')
        .insert({
          ...configData,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Erro ao criar config:', insertError);
        return NextResponse.json(
          { error: 'Erro ao salvar configuração' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Conectado com sucesso à API Oficial do WhatsApp',
      phoneData,
    });
  } catch (error) {
    console.error('Erro ao conectar API Oficial:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
