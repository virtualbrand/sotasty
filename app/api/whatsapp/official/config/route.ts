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

    const { data: config, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar config:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar configuração' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      config: config || null,
    });
  } catch (error) {
    console.error('Erro ao buscar config:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
