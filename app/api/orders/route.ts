import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ActivityOrders } from '@/lib/activityLogger'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar workspace_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 })
    }

    // Busca pedidos do workspace
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('workspace_id', profile.workspace_id)
      .order('delivery_date', { ascending: true })

    if (error) {
      console.error('Erro ao buscar pedidos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Erro no GET /api/orders:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar workspace_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { type, customer, customer_id, product, product_id, delivery_date, status, title, phone, value, notes, task_name, images, categories, tags } = body

    // Validações
    if (!customer || !product || !delivery_date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: customer, product, delivery_date' },
        { status: 400 }
      )
    }

    // Parse do valor (formato brasileiro: R$ 1.000,00)
    let parsedValue = null
    if (value) {
      try {
        const cleanValue = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
        parsedValue = parseFloat(cleanValue)
      } catch (e) {
        console.error('Erro ao fazer parse do valor:', e)
      }
    }

    // Insere o pedido
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        workspace_id: profile.workspace_id,
        type: type || 'order', // Default para 'order' se não especificado
        customer,
        customer_id,
        product,
        product_id,
        delivery_date,
        status: status || 'pending',
        title,
        phone,
        value: parsedValue,
        notes,
        task_name,
        images,
        categories,
        tags
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar pedido:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    const orderTitle = data.title || data.product
    ActivityOrders.created(orderTitle, data.customer, data.id)
      .catch(err => console.error('❌ Erro ao registrar atividade:', err))

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Erro no POST /api/orders:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 })
    }

    const body = await request.json()
    const { type, customer, customer_id, product, product_id, delivery_date, status, title, phone, value, notes, task_name, images, categories, tags } = body

    // Parse do valor (formato brasileiro: R$ 1.000,00)
    let parsedValue = null
    if (value) {
      try {
        const cleanValue = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
        parsedValue = parseFloat(cleanValue)
      } catch (e) {
        console.error('Erro ao fazer parse do valor:', e)
      }
    }

    // Atualiza o pedido
    const updateData: any = {
      customer,
      customer_id,
      product,
      product_id,
      delivery_date,
      status,
      title,
      phone,
      value: parsedValue,
      notes,
      task_name,
      images,
      categories,
      tags,
      updated_at: new Date().toISOString()
    }
    
    // Apenas inclui type se for fornecido (para não sobrescrever)
    if (type !== undefined) {
      updateData.type = type
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', (await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()).data?.workspace_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar pedido:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Registrar atividade
    const orderTitle = data.title || data.product
    ActivityOrders.updated(orderTitle, updateData, data.id)
      .catch(err => console.error('❌ Erro ao registrar atividade:', err))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro no PATCH /api/orders:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 })
    }

    // Buscar dados do pedido antes de deletar para registrar atividade
    const { data: order } = await supabase
      .from('orders')
      .select('title, product')
      .eq('id', id)
      .eq('workspace_id', (await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()).data?.workspace_id)
      .single()

    // Deleta o pedido
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('workspace_id', (await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()).data?.workspace_id)

    if (error) {
      console.error('Erro ao deletar pedido:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    if (order) {
      const orderTitle = order.title || order.product
      ActivityOrders.deleted(orderTitle, id)
        .catch(err => console.error('❌ Erro ao registrar atividade:', err))
    }

    return NextResponse.json({ message: 'Pedido deletado com sucesso' })
  } catch (error) {
    console.error('Erro no DELETE /api/orders:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
