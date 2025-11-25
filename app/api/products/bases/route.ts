import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
      .from('base_recipes')
      .select(`
        *,
        base_recipe_items (
          id,
          quantity,
          ingredients (
            id,
            name,
            unit,
            unit_cost
          )
        )
      `)
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar bases' }, { status: 500 })
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
    const { name, description, loss_factor, unit, yield: yieldValue, items, image_url } = body

    if (!name || loss_factor === undefined) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Create base recipe
    const { data: baseRecipe, error: baseError } = await supabase
      .from('base_recipes')
      .insert([
        {
          user_id: user.id,
          workspace_id: profile.workspace_id,
          name,
          description,
          loss_factor: parseFloat(loss_factor),
          unit: unit || 'gramas',
          yield: yieldValue ? parseFloat(yieldValue) : null,
          image_url: image_url || null
        }
      ])
      .select()
      .single()

    if (baseError) {
      return NextResponse.json({ error: baseError.message }, { status: 500 })
    }

    // Add items if provided
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        base_recipe_id: baseRecipe.id,
        ingredient_id: item.ingredient_id,
        quantity: parseFloat(item.quantity)
      }))

      const { error: itemsError } = await supabase
        .from('base_recipe_items')
        .insert(itemsToInsert)

      if (itemsError) {
        // Rollback: delete the base recipe
        await supabase.from('base_recipes').delete().eq('id', baseRecipe.id)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    // Fetch complete data
    const { data: completeData } = await supabase
      .from('base_recipes')
      .select(`
        *,
        base_recipe_items (
          id,
          quantity,
          ingredients (
            id,
            name,
            unit,
            unit_cost
          )
        )
      `)
      .eq('id', baseRecipe.id)
      .single()

    return NextResponse.json(completeData, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar base' }, { status: 500 })
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

    // Delete items first (cascade should handle this, but being explicit)
    await supabase
      .from('base_recipe_items')
      .delete()
      .eq('base_recipe_id', id)

    const { error } = await supabase
      .from('base_recipes')
      .delete()
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir base' }, { status: 500 })
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
    const { name, description, loss_factor, unit, yield: yieldValue, items, image_url } = body

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    // Update base recipe
    const { error: baseError } = await supabase
      .from('base_recipes')
      .update({
        name,
        description,
        loss_factor: parseFloat(loss_factor),
        unit: unit || 'gramas',
        yield: yieldValue ? parseFloat(yieldValue) : null,
        image_url: image_url || null
      })
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)

    if (baseError) {
      return NextResponse.json({ error: baseError.message }, { status: 500 })
    }

    // Update items - delete all and re-insert
    await supabase
      .from('base_recipe_items')
      .delete()
      .eq('base_recipe_id', id)

    if (items && items.length > 0) {
      const itemsToInsert = items
        .filter((item: any) => item.ingredient_id || item.ingredients?.id)
        .map((item: any) => ({
          base_recipe_id: id,
          ingredient_id: item.ingredient_id || item.ingredients?.id,
          quantity: parseFloat(item.quantity)
        }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('base_recipe_items')
          .insert(itemsToInsert)

        if (itemsError) {
          return NextResponse.json({ error: itemsError.message }, { status: 500 })
        }
      }
    }

    // Fetch complete updated data
    const { data: completeData } = await supabase
      .from('base_recipes')
      .select(`
        *,
        base_recipe_items (
          id,
          quantity,
          ingredient_id,
          ingredients (
            id,
            name,
            unit,
            unit_cost
          )
        )
      `)
      .eq('id', id)
      .single()

    return NextResponse.json(completeData)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar base' }, { status: 500 })
  }
}
