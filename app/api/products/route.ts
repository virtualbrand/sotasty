import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActivityProducts } from '@/lib/activityLogger'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
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

    const { data: products, error } = await supabase
      .from('final_products')
      .select('*')
      .eq('workspace_id', profile.workspace_id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar produtos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(products || [])
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
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

    const { data, error } = await supabase
      .from('final_products')
      .insert([
        {
          user_id: user.id,
          workspace_id: profile.workspace_id,
          name: body.name,
          description: body.description,
          category: body.category,
          selling_price: body.selling_price || body.price,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar produto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    console.log('🔍 Tentando registrar atividade para produto:', data.name, data.id)
    ActivityProducts.created(data.name, data.id)
      .then(result => console.log('✅ Atividade registrada:', result))
      .catch(err => console.error('❌ Erro ao registrar atividade:', err))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
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
    const { id, ...updateData } = body

    // Buscar produto antes da atualização para comparar preços
    const { data: oldProduct } = await supabase
      .from('final_products')
      .select('selling_price, name')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .single()

    const { data, error } = await supabase
      .from('final_products')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar produto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    const priceChanged = oldProduct && updateData.selling_price && 
                        oldProduct.selling_price !== updateData.selling_price
    
    if (priceChanged) {
      ActivityProducts.priceChanged(
        data.name, 
        oldProduct.selling_price, 
        data.selling_price, 
        data.id
      ).catch(err => console.error('Erro ao registrar atividade:', err))
    } else {
      ActivityProducts.updated(
        data.name, 
        { changes: updateData }, 
        data.id
      ).catch(err => console.error('Erro ao registrar atividade:', err))
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
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
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Buscar nome do produto antes de deletar
    const { data: product } = await supabase
      .from('final_products')
      .select('name')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .single()

    const { error } = await supabase
      .from('final_products')
      .delete()
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)

    if (error) {
      console.error('Erro ao deletar produto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    if (product) {
      ActivityProducts.deleted(product.name, id).catch(err =>
        console.error('Erro ao registrar atividade:', err)
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
