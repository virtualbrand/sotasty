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

    // Criar instância na Evolution API
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY!,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar instância');
    }

    return NextResponse.json({
      success: true,
      instance: data.instance,
      hash: data.hash,
    });
  } catch (error: any) {
    console.error('Erro ao criar instância:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar instância' },
      { status: 500 }
    );
  }
}
