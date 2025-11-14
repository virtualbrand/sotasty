import { NextRequest, NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const instanceName = searchParams.get('instance');

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Nome da instância é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar QR Code da instância
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY!,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar QR Code');
    }

    return NextResponse.json({
      success: true,
      qrcode: data.base64 || data.qrcode?.base64,
      pairingCode: data.code || data.pairingCode,
    });
  } catch (error: any) {
    console.error('Erro ao buscar QR Code:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar QR Code' },
      { status: 500 }
    );
  }
}
