import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

export async function GET(request: NextRequest) {
  try {
    // Pegar o nome da instância da query string ou da variável de ambiente
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instance') || process.env.EVOLUTION_INSTANCE || '';

    if (!instanceName) {
      return NextResponse.json({
        connected: false,
        instance: '',
        state: 'no-instance',
      })
    }

    console.log('Verificando status da instância:', instanceName);

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
      instance: instanceName,
      state: state,
      instanceData: data.instance || data
    })
  } catch (error) {
    console.error('Erro ao verificar status do WhatsApp:', error)
    return NextResponse.json(
      { connected: false, error: 'Erro ao conectar com Evolution API' },
      { status: 500 }
    )
  }
}
