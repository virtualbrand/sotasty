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

    // Salvar o nome da instância em um cookie ou variável de ambiente
    // Por enquanto, vamos apenas retornar sucesso
    // Em produção, você pode salvar isso no banco de dados

    return NextResponse.json({
      success: true,
      message: 'Instância salva com sucesso',
      instance: instanceName,
    });
  } catch (error) {
    console.error('Erro ao salvar instância:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar instância' },
      { status: 500 }
    );
  }
}
