import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ActivityIngredients } from '@/lib/activityLogger'

export async function GET() {
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

    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar insumos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, volume, unit, average_cost, loss_factor, type, image_url } = body

    if (!name || !volume || !unit || average_cost === undefined || loss_factor === undefined) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ingredients')
      .insert([
        {
          user_id: user.id,
          workspace_id: profile.workspace_id,
          name,
          quantity: parseFloat(volume), // Banco usa 'quantity'
          unit,
          average_cost: parseFloat(average_cost),
          loss_factor: parseFloat(loss_factor),
          type: type || 'ingredientes',
          image_url: image_url || null
        }
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    const ingredientType: 'material' | 'ingredient' = data.type === 'materiais' ? 'material' : 'ingredient'
    console.log('🔍 Tentando registrar atividade - insumo criado:', data.name, data.type, '->', ingredientType, data.id)
    ActivityIngredients.created(data.name, ingredientType, data.id)
      .then(result => console.log('✅ Atividade registrada:', result))
      .catch(err => console.error('❌ Erro ao registrar atividade:', err))

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar insumo' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    const { name, volume, unit, average_cost, loss_factor, type, image_url } = body

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    // Buscar dados antigos para comparar preços
    const { data: oldIngredient } = await supabase
      .from('ingredients')
      .select('average_cost, name')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .single()

    const { data, error } = await supabase
      .from('ingredients')
      .update({
        name,
        quantity: parseFloat(volume), // Banco usa 'quantity'
        unit,
        average_cost: parseFloat(average_cost),
        loss_factor: parseFloat(loss_factor),
        type: type || 'ingredientes',
        image_url: image_url || null
      })
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    const priceChanged = oldIngredient && average_cost && 
                        oldIngredient.average_cost !== parseFloat(average_cost)
    
    const ingredientType: 'material' | 'ingredient' = data.type === 'materiais' ? 'material' : 'ingredient'
    console.log('🔍 Tentando registrar atividade - insumo atualizado:', data.name, ingredientType)
    ActivityIngredients.updated(
      data.name, 
      ingredientType,
      { changes: { name, volume, unit, average_cost, loss_factor } }, 
      data.id
    ).then(result => console.log('✅ Atividade registrada:', result))
      .catch(err => console.error('❌ Erro ao registrar atividade:', err))

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar insumo' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

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

    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    if (ingredient) {
      const ingredientType: 'material' | 'ingredient' = ingredient.type === 'materiais' ? 'material' : 'ingredient'
      console.log('🔍 Tentando registrar atividade - insumo deletado:', ingredient.name, ingredientType, id)
      ActivityIngredients.deleted(ingredient.name, ingredientType, id)
        .then(result => console.log('✅ Atividade registrada:', result))
        .catch(err => console.error('❌ Erro ao registrar atividade:', err))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir insumo' }, { status: 500 })
  }
}
