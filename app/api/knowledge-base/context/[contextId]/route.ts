import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contextId: string }> }
) {
  try {
    const { contextId } = await params

    if (!contextId) {
      return NextResponse.json(
        { error: 'ID do contexto não fornecido.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 }
      )
    }

    // Deleta o contexto (RLS garante que só pode deletar o próprio)
    const { error } = await supabase
      .from('assistant_contexts')
      .delete()
      .eq('id', contextId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao deletar contexto:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar contexto.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contexto removido com sucesso.'
    })
  } catch (error) {
    console.error('Erro ao deletar contexto:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar contexto.' },
      { status: 500 }
    )
  }
}
