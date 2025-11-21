import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Atualizar status para desconectado
    const { error } = await supabase
      .from('whatsapp_config')
      .update({ 
        connected: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('auth_method', 'official');

    if (error) {
      console.error('Erro ao desconectar:', error);
      return NextResponse.json(
        { error: 'Erro ao desconectar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Desconectado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao desconectar API Oficial:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
