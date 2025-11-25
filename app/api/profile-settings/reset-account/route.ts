import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Deletar todas as transações e dados do usuário
    // A ordem importa devido às foreign keys

    // 1. Deletar mensagens WhatsApp
    await supabase
      .from('whatsapp_messages')
      .delete()
      .eq('user_id', user.id)

    // 2. Deletar itens de pedidos
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
    
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id)
      await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds)
    }

    // 3. Deletar pedidos
    await supabase
      .from('orders')
      .delete()
      .eq('user_id', user.id)

    // 4. Deletar tarefas da agenda
    await supabase
      .from('agenda_tasks')
      .delete()
      .eq('user_id', user.id)

    // 5. Deletar atividades
    await supabase
      .from('activities')
      .delete()
      .eq('user_id', user.id)

    // 6. Deletar transações financeiras
    await supabase
      .from('financial_transactions')
      .delete()
      .eq('user_id', user.id)

    // 7. Deletar itens de produtos finais
    const { data: finalProducts } = await supabase
      .from('final_products')
      .select('id')
      .eq('user_id', user.id)
    
    if (finalProducts && finalProducts.length > 0) {
      const productIds = finalProducts.map(p => p.id)
      await supabase
        .from('final_product_items')
        .delete()
        .in('final_product_id', productIds)
    }

    // 8. Deletar produtos finais
    await supabase
      .from('final_products')
      .delete()
      .eq('user_id', user.id)

    // 9. Deletar itens de menus
    const { data: menus } = await supabase
      .from('menus')
      .select('id')
      .eq('user_id', user.id)
    
    if (menus && menus.length > 0) {
      const menuIds = menus.map(m => m.id)
      await supabase
        .from('menu_items')
        .delete()
        .in('menu_id', menuIds)
    }

    // 10. Deletar menus/cardápios
    await supabase
      .from('menus')
      .delete()
      .eq('user_id', user.id)

    // 11. Deletar itens de bases de preparo
    const { data: baseRecipes } = await supabase
      .from('base_recipes')
      .select('id')
      .eq('user_id', user.id)
    
    if (baseRecipes && baseRecipes.length > 0) {
      const baseIds = baseRecipes.map(b => b.id)
      await supabase
        .from('base_recipe_items')
        .delete()
        .in('base_recipe_id', baseIds)
    }

    // 12. Deletar bases de preparo
    await supabase
      .from('base_recipes')
      .delete()
      .eq('user_id', user.id)

    // 13. Deletar ingredientes/insumos
    await supabase
      .from('ingredients')
      .delete()
      .eq('user_id', user.id)

    // 14. Deletar clientes
    await supabase
      .from('customers')
      .delete()
      .eq('user_id', user.id)

    // 15. Deletar categorias de produtos
    await supabase
      .from('product_categories')
      .delete()
      .eq('user_id', user.id)

    // 16. Deletar categorias financeiras personalizadas
    await supabase
      .from('financial_category_settings')
      .delete()
      .eq('user_id', user.id)

    // 17. Deletar analytics
    await supabase
      .from('analytics')
      .delete()
      .eq('user_id', user.id)

    return NextResponse.json({ 
      success: true,
      message: 'Todos os dados foram excluídos com sucesso'
    })
  } catch (error) {
    console.error('Erro ao resetar conta:', error)
    return NextResponse.json({ 
      error: 'Erro ao excluir dados da conta' 
    }, { status: 500 })
  }
}
