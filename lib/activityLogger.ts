import { createClient as createServerClient } from '@/lib/supabase/server'

export type ActivityAction = 'create' | 'update' | 'delete' | 'view' | 'export' | 'other'
export type ActivityCategory = 'produto' | 'cardapio' | 'pedido' | 'cliente' | 'financeiro' | 'agenda' | 'configuracao' | 'system'

interface LogActivityParams {
  action: ActivityAction
  category: ActivityCategory
  description: string
  metadata?: Record<string, unknown>
  entityType?: string
  entityId?: string
}

/**
 * Registra uma atividade no sistema
 * @param params - Parâmetros da atividade
 * @returns Promise com resultado da operação
 */
export async function logActivity(params: LogActivityParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient()
    
    // Buscar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Usuário não autenticado para registrar atividade')
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Buscar workspace_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.workspace_id) {
      console.error('Erro ao buscar workspace_id:', profileError)
      return { success: false, error: 'Workspace não encontrado' }
    }

    // Inserir atividade
    const { error: insertError } = await supabase
      .from('activities')
      .insert({
        workspace_id: profile.workspace_id,
        user_id: user.id,
        action: params.action,
        category: params.category,
        description: params.description,
        metadata: params.metadata || {},
        entity_type: params.entityType,
        entity_id: params.entityId,
      })

    if (insertError) {
      console.error('Erro ao inserir atividade:', insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao registrar atividade:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// ============================================
// HELPERS ESPECÍFICOS POR MÓDULO
// ============================================

// PRODUTOS
export const ActivityProducts = {
  created: (productName: string, productId?: string) =>
    logActivity({
      action: 'create',
      category: 'produto',
      description: `Novo produto criado: ${productName}`,
      entityType: 'product',
      entityId: productId,
    }),

  updated: (productName: string, changes: Record<string, unknown>, productId?: string) =>
    logActivity({
      action: 'update',
      category: 'produto',
      description: `Produto atualizado: ${productName}`,
      metadata: { changes },
      entityType: 'product',
      entityId: productId,
    }),

  deleted: (productName: string, productId?: string) =>
    logActivity({
      action: 'delete',
      category: 'produto',
      description: `Produto excluído: ${productName}`,
      entityType: 'product',
      entityId: productId,
    }),

  priceChanged: (productName: string, oldPrice: number, newPrice: number, productId?: string) =>
    logActivity({
      action: 'update',
      category: 'produto',
      description: `Preço do ${productName} alterado de R$ ${oldPrice.toFixed(2)} para R$ ${newPrice.toFixed(2)}`,
      metadata: { oldPrice, newPrice },
      entityType: 'product',
      entityId: productId,
    }),
}

// CARDÁPIOS
export const ActivityMenus = {
  created: (menuName: string, menuId?: string) =>
    logActivity({
      action: 'create',
      category: 'cardapio',
      description: `Novo cardápio criado: ${menuName}`,
      entityType: 'menu',
      entityId: menuId,
    }),

  updated: (menuName: string, changes: Record<string, unknown>, menuId?: string) =>
    logActivity({
      action: 'update',
      category: 'cardapio',
      description: `Cardápio atualizado: ${menuName}`,
      metadata: { changes },
      entityType: 'menu',
      entityId: menuId,
    }),

  deleted: (menuName: string, menuId?: string) =>
    logActivity({
      action: 'delete',
      category: 'cardapio',
      description: `Cardápio excluído: ${menuName}`,
      entityType: 'menu',
      entityId: menuId,
    }),

  published: (menuName: string, menuId?: string) =>
    logActivity({
      action: 'update',
      category: 'cardapio',
      description: `Cardápio publicado: ${menuName}`,
      entityType: 'menu',
      entityId: menuId,
    }),
}

// PEDIDOS
export const ActivityOrders = {
  created: (orderTitle: string, customerName: string, orderId?: string) =>
    logActivity({
      action: 'create',
      category: 'pedido',
      description: `Pedido criado: ${orderTitle} para ${customerName}`,
      entityType: 'order',
      entityId: orderId,
    }),

  updated: (orderTitle: string, changes: Record<string, unknown>, orderId?: string) =>
    logActivity({
      action: 'update',
      category: 'pedido',
      description: `Pedido atualizado: ${orderTitle}`,
      metadata: { changes },
      entityType: 'order',
      entityId: orderId,
    }),

  statusChanged: (orderTitle: string, oldStatus: string, newStatus: string, orderId?: string) =>
    logActivity({
      action: 'update',
      category: 'pedido',
      description: `Status do pedido ${orderTitle} alterado de "${oldStatus}" para "${newStatus}"`,
      metadata: { oldStatus, newStatus },
      entityType: 'order',
      entityId: orderId,
    }),

  completed: (orderTitle: string, customerName: string, orderId?: string) =>
    logActivity({
      action: 'update',
      category: 'pedido',
      description: `Pedido concluído: ${orderTitle} entregue para ${customerName}`,
      entityType: 'order',
      entityId: orderId,
    }),

  deleted: (orderTitle: string, orderId?: string) =>
    logActivity({
      action: 'delete',
      category: 'pedido',
      description: `Pedido excluído: ${orderTitle}`,
      entityType: 'order',
      entityId: orderId,
    }),
}

// CLIENTES
export const ActivityCustomers = {
  created: (customerName: string, customerId?: string) =>
    logActivity({
      action: 'create',
      category: 'cliente',
      description: `Cliente cadastrado: ${customerName}`,
      entityType: 'customer',
      entityId: customerId,
    }),

  updated: (customerName: string, changes: Record<string, unknown>, customerId?: string) =>
    logActivity({
      action: 'update',
      category: 'cliente',
      description: `Cliente atualizado: ${customerName}`,
      metadata: { changes },
      entityType: 'customer',
      entityId: customerId,
    }),

  deleted: (customerName: string, customerId?: string) =>
    logActivity({
      action: 'delete',
      category: 'cliente',
      description: `Cliente excluído: ${customerName}`,
      entityType: 'customer',
      entityId: customerId,
    }),
}

// FINANCEIRO
export const ActivityFinancial = {
  transactionCreated: (type: 'receita' | 'despesa', amount: number, description: string, transactionId?: string) =>
    logActivity({
      action: 'create',
      category: 'financeiro',
      description: `${type === 'receita' ? 'Receita' : 'Despesa'} registrada: R$ ${amount.toFixed(2)} - ${description}`,
      metadata: { type, amount },
      entityType: 'transaction',
      entityId: transactionId,
    }),

  transactionUpdated: (type: 'receita' | 'despesa', amount: number, description: string, transactionId?: string) =>
    logActivity({
      action: 'update',
      category: 'financeiro',
      description: `Transação atualizada: R$ ${amount.toFixed(2)} - ${description}`,
      metadata: { type, amount },
      entityType: 'transaction',
      entityId: transactionId,
    }),

  transactionDeleted: (type: 'receita' | 'despesa', amount: number, description: string, transactionId?: string) =>
    logActivity({
      action: 'delete',
      category: 'financeiro',
      description: `Transação excluída: R$ ${amount.toFixed(2)} - ${description}`,
      metadata: { type, amount },
      entityType: 'transaction',
      entityId: transactionId,
    }),
}

// AGENDA
export const ActivityAgenda = {
  taskCreated: (taskTitle: string, taskId?: string) =>
    logActivity({
      action: 'create',
      category: 'agenda',
      description: `Tarefa criada: ${taskTitle}`,
      entityType: 'task',
      entityId: taskId,
    }),

  taskUpdated: (taskTitle: string, changes: Record<string, unknown>, taskId?: string) =>
    logActivity({
      action: 'update',
      category: 'agenda',
      description: `Tarefa atualizada: ${taskTitle}`,
      metadata: { changes },
      entityType: 'task',
      entityId: taskId,
    }),

  taskCompleted: (taskTitle: string, taskId?: string) =>
    logActivity({
      action: 'update',
      category: 'agenda',
      description: `Tarefa concluída: ${taskTitle}`,
      entityType: 'task',
      entityId: taskId,
    }),

  taskDeleted: (taskTitle: string, taskId?: string) =>
    logActivity({
      action: 'delete',
      category: 'agenda',
      description: `Tarefa excluída: ${taskTitle}`,
      entityType: 'task',
      entityId: taskId,
    }),
}

// CONFIGURAÇÕES
export const ActivitySettings = {
  changed: (settingName: string, oldValue: unknown, newValue: unknown) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `Configuração alterada: ${settingName}`,
      metadata: { oldValue, newValue },
    }),

  preferencesUpdated: (preferenceName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `Preferências atualizadas: ${preferenceName}`,
    }),
}
