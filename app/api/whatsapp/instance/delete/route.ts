import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export async function DELETE(request: Request) {
  try {
    const { instanceName } = await request.json();

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Nome da instância é obrigatório' },
        { status: 400 }
      );
    }


    // Deletar instância completamente
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/delete/${instanceName}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY!,
        },
      }
    );


    if (!response.ok) {
      let errorMessage = 'Erro ao deletar instância';
      try {
        const data = await response.json();
        errorMessage = data.message || data.error || errorMessage;
      } catch {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Instância deletada com sucesso',
      data: responseData,
    });
  } catch (error) {
    console.error('Erro ao deletar instância:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar instância';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
