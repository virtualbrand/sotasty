import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

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

      // Se tiver configuração da API Oficial
      if (config && config.auth_method === 'official' && config.connected) {
        return NextResponse.json({
          connected: true,
          method: 'official',
          state: 'open',
        })
      }
    }

    // Fallback para Evolution API
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instance') || process.env.EVOLUTION_INSTANCE || '';

    if (!instanceName) {
      return NextResponse.json({
        connected: false,
        instance: '',
        state: 'no-instance',
      })
    }

    console.log('Verificando status da instância Evolution:', instanceName);

    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { connected: false, error: 'Falha ao verificar conexão' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log('Evolution API response:', data);
    
    // A Evolution API pode retornar { state: 'open' } ou { instance: { state: 'open' } }
    const state = data.state || (data.instance && data.instance.state) || 'unknown';
    
    return NextResponse.json({
      connected: state === 'open',
      method: 'evolution',
      instance: instanceName,
      state: state,
      instanceData: data.instance || data
    })
  } catch (error) {
    console.error('Erro ao verificar status do WhatsApp:', error)
    return NextResponse.json(
      { connected: false, error: 'Erro ao conectar com WhatsApp API' },
      { status: 500 }
    )
  }
}
