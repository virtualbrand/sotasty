import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ActivityIngredients } from '@/lib/activityLogger'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar workspace_id do perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    // Buscar nome e tipo antes de deletar
    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('name, type')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .single()

    if (!ingredient) {
      return NextResponse.json({ error: 'Insumo não encontrado' }, { status: 404 })
    }

    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade com tipo correto
    const ingredientType: 'material' | 'ingredient' = ingredient.type === 'materiais' ? 'material' : 'ingredient'
    console.log('🔍 Tentando registrar atividade - insumo deletado:', ingredient.name, ingredientType, id)
    ActivityIngredients.deleted(ingredient.name, ingredientType, id)
      .then(result => console.log('✅ Atividade registrada:', result))
      .catch(err => console.error('❌ Erro ao registrar atividade:', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir insumo:', error)
    return NextResponse.json({ error: 'Erro ao excluir insumo' }, { status: 500 })
  }
}
