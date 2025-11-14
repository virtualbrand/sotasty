import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export async function POST(request: Request) {
  try {
    const { instanceName } = await request.json();

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Nome da instância é obrigatório' },
        { status: 400 }
      );
    }

    // Desconectar instância
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/logout/${instanceName}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY!,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao desconectar');
    }

    return NextResponse.json({
      success: true,
      message: 'Instância desconectada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao desconectar instância:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao desconectar instância' },
      { status: 500 }
    );
  }
}
