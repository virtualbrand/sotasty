import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ActivityProducts } from '@/lib/activityLogger'

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
      .from('final_products')
      .select(`
        *,
        final_product_items (
          id,
          quantity,
          item_type,
          ingredient_id,
          base_recipe_id,
          ingredients (
            id,
            name,
            unit,
            unit_cost
          ),
          base_recipes (
            id,
            name,
            total_cost
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
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
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
    const { name, category, loss_factor, selling_price, profit_margin, image_url, items } = body

    if (!name || !category || loss_factor === undefined) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Create final product
    const { data: product, error: productError } = await supabase
      .from('final_products')
      .insert([
        {
          user_id: user.id,
          workspace_id: profile.workspace_id,
          name,
          category,
          image_url,
          loss_factor: parseFloat(loss_factor),
          selling_price: selling_price ? parseFloat(selling_price) : null,
          profit_margin: profit_margin ? parseFloat(profit_margin) : null
        }
      ])
      .select()
      .single()

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    // Add items if provided
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        final_product_id: product.id,
        item_type: item.item_type, // 'ingredient' or 'base_recipe'
        ingredient_id: item.item_type === 'ingredient' ? item.item_id : null,
        base_recipe_id: item.item_type === 'base_recipe' ? item.item_id : null,
        quantity: parseFloat(item.quantity)
      }))

      const { error: itemsError } = await supabase
        .from('final_product_items')
        .insert(itemsToInsert)

      if (itemsError) {
        // Rollback: delete the product
        await supabase.from('final_products').delete().eq('id', product.id)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    // Fetch complete data
    const { data: completeData } = await supabase
      .from('final_products')
      .select(`
        *,
        final_product_items (
          id,
          quantity,
          item_type,
          ingredient_id,
          base_recipe_id,
          ingredients (
            id,
            name,
            unit,
            unit_cost
          ),
          base_recipes (
            id,
            name,
            total_cost
          )
        )
      `)
      .eq('id', product.id)
      .single()

    // Registrar atividade
    console.log('🔍 Tentando registrar atividade - produto criado:', product.name, product.id)
    ActivityProducts.created(product.name, product.id)
      .then(result => console.log('✅ Atividade registrada:', result))
      .catch(err => console.error('❌ Erro ao registrar atividade:', err))

    return NextResponse.json(completeData, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
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

    // Buscar nome do produto antes de deletar
    const { data: product } = await supabase
      .from('final_products')
      .select('name')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .single()

    // Delete items first
    await supabase
      .from('final_product_items')
      .delete()
      .eq('final_product_id', id)

    const { error } = await supabase
      .from('final_products')
      .delete()
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    if (product) {
      console.log('🔍 Tentando registrar atividade - produto deletado:', product.name, id)
      ActivityProducts.deleted(product.name, id)
        .then(result => console.log('✅ Atividade registrada:', result))
        .catch(err => console.error('❌ Erro ao registrar atividade:', err))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 })
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
    const { name, category, loss_factor, selling_price, profit_margin, image_url, items } = body

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    // Buscar produto antes da atualização para comparar preços
    const { data: oldProduct } = await supabase
      .from('final_products')
      .select('selling_price, name')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .single()

    // Update final product
    const { error: productError } = await supabase
      .from('final_products')
      .update({
        name,
        category,
        image_url,
        loss_factor: parseFloat(loss_factor),
        selling_price: selling_price ? parseFloat(selling_price) : null,
        profit_margin: profit_margin ? parseFloat(profit_margin) : null
      })
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    // Update items - delete all and re-insert
    await supabase
      .from('final_product_items')
      .delete()
      .eq('final_product_id', id)

    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        final_product_id: id,
        item_type: item.item_type,
        ingredient_id: item.item_type === 'ingredient' ? item.item_id : null,
        base_recipe_id: item.item_type === 'base_recipe' ? item.item_id : null,
        quantity: parseFloat(item.quantity)
      }))

      const { error: itemsError } = await supabase
        .from('final_product_items')
        .insert(itemsToInsert)

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    // Fetch complete updated data
    const { data: completeData } = await supabase
      .from('final_products')
      .select(`
        *,
        final_product_items (
          id,
          quantity,
          item_type,
          ingredient_id,
          base_recipe_id,
          ingredients (
            id,
            name,
            unit,
            unit_cost
          ),
          base_recipes (
            id,
            name,
            total_cost
          )
        )
      `)
      .eq('id', id)
      .single()

    // Registrar atividade
    const priceChanged = oldProduct && selling_price && 
                        oldProduct.selling_price !== parseFloat(selling_price)
    
    console.log('🔍 Tentando registrar atividade - produto atualizado:', completeData?.name)
    if (priceChanged && completeData) {
      ActivityProducts.priceChanged(
        completeData.name, 
        oldProduct.selling_price, 
        completeData.selling_price, 
        completeData.id
      ).then(result => console.log('✅ Atividade registrada:', result))
        .catch(err => console.error('❌ Erro ao registrar atividade:', err))
    } else if (completeData) {
      ActivityProducts.updated(
        completeData.name, 
        { changes: { name, category, loss_factor, selling_price, profit_margin } }, 
        completeData.id
      ).then(result => console.log('✅ Atividade registrada:', result))
        .catch(err => console.error('❌ Erro ao registrar atividade:', err))
    }

    return NextResponse.json(completeData)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}
