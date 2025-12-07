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
 * Registra uma atividade no sistema (versão client-side via API)
 * @param params - Parâmetros da atividade
 * @returns Promise com resultado da operação
 */
export async function logActivity(params: LogActivityParams): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Erro ao registrar atividade:', error)
      return { success: false, error: error.message || 'Erro ao registrar atividade' }
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

// PRODUTOS (Genérico - mantido para compatibilidade)
export const ActivityProducts = {
  created: (productName: string, productId?: string) =>
    logActivity({
      action: 'create',
      category: 'produto',
      description: `<span class="badge-success">Produto final criado</span> ${productName}`,
      entityType: 'product',
      entityId: productId,
    }),

  updated: (productName: string, changes: Record<string, unknown>, productId?: string) =>
    logActivity({
      action: 'update',
      category: 'produto',
      description: `<span class="badge-secondary">Produto final atualizado</span> ${productName}`,
      metadata: { changes },
      entityType: 'product',
      entityId: productId,
    }),

  deleted: (productName: string, productId?: string) =>
    logActivity({
      action: 'delete',
      category: 'produto',
      description: `<span class="badge-danger">Produto final excluído</span> ${productName}`,
      entityType: 'product',
      entityId: productId,
    }),

  priceChanged: (productName: string, oldPrice: number, newPrice: number, productId?: string) =>
    logActivity({
      action: 'update',
      category: 'produto',
      description: `<span class="badge-secondary">Preço atualizado</span> ${productName} de R$ ${oldPrice.toFixed(2)} para R$ ${newPrice.toFixed(2)}`,
      metadata: { oldPrice, newPrice },
      entityType: 'product',
      entityId: productId,
    }),
}

// INSUMOS (Ingredientes e Materiais)
export const ActivityIngredients = {
  created: (ingredientName: string, type: 'ingredient' | 'material', ingredientId?: string) =>
    logActivity({
      action: 'create',
      category: 'produto',
      description: `<span class="badge-success">${type === 'ingredient' ? 'Ingrediente' : 'Material'} criado</span> ${ingredientName}`,
      entityType: 'ingredient',
      entityId: ingredientId,
    }),

  updated: (ingredientName: string, type: 'ingredient' | 'material', changes: Record<string, unknown>, ingredientId?: string) =>
    logActivity({
      action: 'update',
      category: 'produto',
      description: `<span class="badge-secondary">${type === 'ingredient' ? 'Ingrediente' : 'Material'} atualizado</span> ${ingredientName}`,
      metadata: { changes },
      entityType: 'ingredient',
      entityId: ingredientId,
    }),

  deleted: (ingredientName: string, type: 'ingredient' | 'material', ingredientId?: string) =>
    logActivity({
      action: 'delete',
      category: 'produto',
      description: `<span class="badge-danger">${type === 'ingredient' ? 'Ingrediente' : 'Material'} excluído</span> ${ingredientName}`,
      entityType: 'ingredient',
      entityId: ingredientId,
    }),
}

// BASES DE PREPARO
export const ActivityBases = {
  created: (baseName: string, baseId?: string) =>
    logActivity({
      action: 'create',
      category: 'produto',
      description: `<span class="badge-success">Base de preparo criada</span> ${baseName}`,
      entityType: 'base',
      entityId: baseId,
    }),

  updated: (baseName: string, changes: Record<string, unknown>, baseId?: string) =>
    logActivity({
      action: 'update',
      category: 'produto',
      description: `<span class="badge-secondary">Base de preparo atualizada</span> ${baseName}`,
      metadata: { changes },
      entityType: 'base',
      entityId: baseId,
    }),

  deleted: (baseName: string, baseId?: string) =>
    logActivity({
      action: 'delete',
      category: 'produto',
      description: `<span class="badge-danger">Base de preparo excluída</span> ${baseName}`,
      entityType: 'base',
      entityId: baseId,
    }),
}

// PRODUTOS FINAIS
export const ActivityFinalProducts = {
  created: (productName: string, productId?: string) =>
    logActivity({
      action: 'create',
      category: 'produto',
      description: `<span class="badge-success">Produto final criado</span> ${productName}`,
      entityType: 'final_product',
      entityId: productId,
    }),

  updated: (productName: string, changes: Record<string, unknown>, productId?: string) =>
    logActivity({
      action: 'update',
      category: 'produto',
      description: `<span class="badge-secondary">Produto final atualizado</span> ${productName}`,
      metadata: { changes },
      entityType: 'final_product',
      entityId: productId,
    }),

  deleted: (productName: string, productId?: string) =>
    logActivity({
      action: 'delete',
      category: 'produto',
      description: `<span class="badge-danger">Produto final excluído</span> ${productName}`,
      entityType: 'final_product',
      entityId: productId,
    }),

  priceChanged: (productName: string, oldPrice: number, newPrice: number, productId?: string) =>
    logActivity({
      action: 'update',
      category: 'produto',
      description: `<span class="badge-secondary">Preço atualizado</span> ${productName} de R$ ${oldPrice.toFixed(2)} para R$ ${newPrice.toFixed(2)}`,
      metadata: { oldPrice, newPrice },
      entityType: 'final_product',
      entityId: productId,
    }),
}

// CARDÁPIOS
export const ActivityMenus = {
  created: (menuName: string, menuId?: string) =>
    logActivity({
      action: 'create',
      category: 'cardapio',
      description: `<span class="badge-success">Cardápio criado</span> ${menuName}`,
      entityType: 'menu',
      entityId: menuId,
    }),

  updated: (menuName: string, changes: Record<string, unknown>, menuId?: string) =>
    logActivity({
      action: 'update',
      category: 'cardapio',
      description: `<span class="badge-secondary">Cardápio atualizado</span> ${menuName}`,
      metadata: { changes },
      entityType: 'menu',
      entityId: menuId,
    }),

  deleted: (menuName: string, menuId?: string) =>
    logActivity({
      action: 'delete',
      category: 'cardapio',
      description: `<span class="badge-danger">Cardápio excluído</span> ${menuName}`,
      entityType: 'menu',
      entityId: menuId,
    }),

  published: (menuName: string, menuId?: string) =>
    logActivity({
      action: 'update',
      category: 'cardapio',
      description: `<span class="badge-secondary">Cardápio publicado</span> ${menuName}`,
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
      description: `<span class="badge-success">Pedido criado</span> ${orderTitle} para ${customerName}`,
      entityType: 'order',
      entityId: orderId,
    }),

  updated: (orderTitle: string, changes: Record<string, unknown>, orderId?: string) =>
    logActivity({
      action: 'update',
      category: 'pedido',
      description: `<span class="badge-secondary">Pedido atualizado</span> ${orderTitle}`,
      metadata: { changes },
      entityType: 'order',
      entityId: orderId,
    }),

  statusChanged: (orderTitle: string, oldStatus: string, newStatus: string, orderId?: string) =>
    logActivity({
      action: 'update',
      category: 'pedido',
      description: `<span class="badge-secondary">Status atualizado</span> ${orderTitle} de "${oldStatus}" para "${newStatus}"`,
      metadata: { oldStatus, newStatus },
      entityType: 'order',
      entityId: orderId,
    }),

  completed: (orderTitle: string, customerName: string, orderId?: string) =>
    logActivity({
      action: 'update',
      category: 'pedido',
      description: `<span class="badge-secondary">Pedido concluído</span> ${orderTitle} - Entregue para ${customerName}`,
      entityType: 'order',
      entityId: orderId,
    }),

  deleted: (orderTitle: string, orderId?: string) =>
    logActivity({
      action: 'delete',
      category: 'pedido',
      description: `<span class="badge-danger">Pedido excluído</span> ${orderTitle}`,
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
      description: `<span class="badge-success">Cliente cadastrado</span> ${customerName}`,
      entityType: 'customer',
      entityId: customerId,
    }),

  updated: (customerName: string, changes: Record<string, unknown>, customerId?: string) =>
    logActivity({
      action: 'update',
      category: 'cliente',
      description: `<span class="badge-secondary">Cliente atualizado</span> ${customerName}`,
      metadata: { changes },
      entityType: 'customer',
      entityId: customerId,
    }),

  deleted: (customerName: string, customerId?: string) =>
    logActivity({
      action: 'delete',
      category: 'cliente',
      description: `<span class="badge-danger">Cliente excluído</span> ${customerName}`,
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
      description: `<span class="badge-success">${type === 'receita' ? 'Receita' : 'Despesa'} registrada</span> R$ ${amount.toFixed(2)} - ${description}`,
      metadata: { type, amount },
      entityType: 'transaction',
      entityId: transactionId,
    }),

  transactionUpdated: (type: 'receita' | 'despesa', amount: number, description: string, transactionId?: string) =>
    logActivity({
      action: 'update',
      category: 'financeiro',
      description: `<span class="badge-secondary">Transação atualizada</span> R$ ${amount.toFixed(2)} - ${description}`,
      metadata: { type, amount },
      entityType: 'transaction',
      entityId: transactionId,
    }),

  transactionDeleted: (type: 'receita' | 'despesa', amount: number, description: string, transactionId?: string) =>
    logActivity({
      action: 'delete',
      category: 'financeiro',
      description: `<span class="badge-danger">Transação excluída</span> R$ ${amount.toFixed(2)} - ${description}`,
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
      description: `<span class="badge-success">Tarefa criada</span> ${taskTitle}`,
      entityType: 'task',
      entityId: taskId,
    }),

  taskUpdated: (taskTitle: string, changes: Record<string, unknown>, taskId?: string) =>
    logActivity({
      action: 'update',
      category: 'agenda',
      description: `<span class="badge-secondary">Tarefa atualizada</span> ${taskTitle}`,
      metadata: { changes },
      entityType: 'task',
      entityId: taskId,
    }),

  taskCompleted: (taskTitle: string, taskId?: string) =>
    logActivity({
      action: 'update',
      category: 'agenda',
      description: `<span class="badge-secondary">Tarefa concluída</span> ${taskTitle}`,
      entityType: 'task',
      entityId: taskId,
    }),

  taskDeleted: (taskTitle: string, taskId?: string) =>
    logActivity({
      action: 'delete',
      category: 'agenda',
      description: `<span class="badge-danger">Tarefa excluída</span> ${taskTitle}`,
      entityType: 'task',
      entityId: taskId,
    }),
}

// CONFIGURAÇÕES
export const ActivitySettings = {
  // === PERFIL / ESTABELECIMENTO ===
  profileUpdated: (fieldName: string, oldValue: string, newValue: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Perfil atualizado</span> ${fieldName}`,
      metadata: { oldValue, newValue },
    }),

  logoUpdated: () =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Logo atualizado</span> Nova logo do estabelecimento`,
    }),

  logoRemoved: () =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Logo removido</span>`,
    }),

  // === HORÁRIOS DE FUNCIONAMENTO ===
  businessHoursUpdated: (dayName: string, oldHours?: string, newHours?: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Horário atualizado</span> ${dayName}: ${newHours || 'Fechado'}`,
      metadata: { oldHours, newHours },
    }),

  alwaysOpenToggled: (isAlwaysOpen: boolean) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">${isAlwaysOpen ? 'Aberto 24h ativado' : 'Aberto 24h desativado'}</span>`,
    }),

  // === PREFERÊNCIAS (URL/DOMÍNIO) ===
  customUrlUpdated: (oldUrl: string, newUrl: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">URL personalizada atualizada</span> de "${oldUrl}" para "${newUrl}"`,
      metadata: { oldUrl, newUrl },
    }),

  customDomainUpdated: (oldDomain: string, newDomain: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Domínio personalizado atualizado</span> de "${oldDomain}" para "${newDomain}"`,
      metadata: { oldDomain, newDomain },
    }),

  // === PRODUTOS ===
  productCategoryAdded: (categoryName: string) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Categoria de produto criada</span> ${categoryName}`,
    }),

  productCategoryRemoved: (categoryName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Categoria de produto removida</span> ${categoryName}`,
    }),

  productPhotoToggled: (type: 'ingrediente' | 'base' | 'produto', enabled: boolean) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Campo de foto ${enabled ? 'ativado' : 'desativado'}</span> em ${type}s`,
    }),

  lossFactorToggled: (type: 'ingrediente' | 'base' | 'produto', enabled: boolean) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Fator de perda ${enabled ? 'ativado' : 'desativado'}</span> em ${type}s`,
    }),

  measurementUnitChanged: (oldUnit: string, newUnit: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Unidade de medida alterada</span> de ${oldUnit} para ${newUnit}`,
      metadata: { oldUnit, newUnit },
    }),

  // === PEDIDOS ===
  orderAlternativeTitleToggled: (enabled: boolean) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Título alternativo de pedido ${enabled ? 'ativado' : 'desativado'}</span>`,
    }),

  orderStatusAdded: (statusName: string, color: string) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Status de pedido criado</span> ${statusName}`,
      metadata: { color },
    }),

  orderStatusUpdated: (oldName: string, newName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Status de pedido atualizado</span> de "${oldName}" para "${newName}"`,
    }),

  orderStatusRemoved: (statusName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Status de pedido removido</span> ${statusName}`,
    }),

  orderCategoryAdded: (categoryName: string) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Categoria de pedido criada</span> ${categoryName}`,
    }),

  orderCategoryUpdated: (oldName: string, newName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Categoria de pedido atualizada</span> de "${oldName}" para "${newName}"`,
    }),

  orderCategoryRemoved: (categoryName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Categoria de pedido removida</span> ${categoryName}`,
    }),

  orderTagAdded: (tagName: string) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Tag de pedido criada</span> ${tagName}`,
    }),

  orderTagUpdated: (oldName: string, newName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Tag de pedido atualizada</span> de "${oldName}" para "${newName}"`,
    }),

  orderTagRemoved: (tagName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Tag de pedido removida</span> ${tagName}`,
    }),

  // === CLIENTES ===
  customerCpfCnpjToggled: (enabled: boolean) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Campo CPF/CNPJ ${enabled ? 'ativado' : 'desativado'}</span> em clientes`,
    }),

  customerPhotoToggled: (enabled: boolean) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Campo de foto ${enabled ? 'ativado' : 'desativado'}</span> em clientes`,
    }),

  // === AGENDA ===
  agendaStatusAdded: (statusName: string) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Status de agenda criado</span> ${statusName}`,
    }),

  agendaStatusUpdated: (oldName: string, newName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Status de agenda atualizado</span> de "${oldName}" para "${newName}"`,
    }),

  agendaStatusRemoved: (statusName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Status de agenda removido</span> ${statusName}`,
    }),

  agendaCategoryAdded: (categoryName: string) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Categoria de agenda criada</span> ${categoryName}`,
    }),

  agendaCategoryUpdated: (oldName: string, newName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Categoria de agenda atualizada</span> de "${oldName}" para "${newName}"`,
    }),

  agendaCategoryRemoved: (categoryName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Categoria de agenda removida</span> ${categoryName}`,
    }),

  agendaTagAdded: (tagName: string) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Tag de agenda criada</span> ${tagName}`,
    }),

  agendaTagUpdated: (oldName: string, newName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Tag de agenda atualizada</span> de "${oldName}" para "${newName}"`,
    }),

  agendaTagRemoved: (tagName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Tag de agenda removida</span> ${tagName}`,
    }),

  // === FINANCEIRO ===
  financialCategoryAdded: (type: 'receita' | 'despesa', categoryName: string) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Categoria de ${type} criada</span> ${categoryName}`,
    }),

  financialCategoryUpdated: (type: 'receita' | 'despesa', oldName: string, newName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Categoria de ${type} atualizada</span> de "${oldName}" para "${newName}"`,
    }),

  financialCategoryRemoved: (type: 'receita' | 'despesa', categoryName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Categoria de ${type} removida</span> ${categoryName}`,
    }),

  financialCategoryReordered: (type: 'receita' | 'despesa', categoryName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Categoria de ${type} reordenada</span> ${categoryName}`,
    }),

  financialSubcategoryMoved: (subcategoryName: string, newParentName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Subcategoria movida</span> "${subcategoryName}" para "${newParentName}"`,
    }),

  // === ATENDIMENTO (BASE DE CONHECIMENTO) ===
  knowledgeFileUploaded: (fileName: string, fileSize: number) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Arquivo adicionado à base de conhecimento</span> ${fileName} (${(fileSize / 1024).toFixed(1)}KB)`,
      metadata: { fileSize },
    }),

  knowledgeFileRemoved: (fileName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Arquivo removido da base de conhecimento</span> ${fileName}`,
    }),

  knowledgeContextAdded: (contextName: string, contextLength: number) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Contexto adicionado à base de conhecimento</span> ${contextName} (${contextLength} caracteres)`,
      metadata: { contextLength },
    }),

  knowledgeContextRemoved: (contextName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Contexto removido da base de conhecimento</span> ${contextName}`,
    }),

  // === MENSAGENS (Quando implementado) ===
  messageTemplateAdded: (templateName: string) =>
    logActivity({
      action: 'create',
      category: 'configuracao',
      description: `<span class="badge-success">Template de mensagem criado</span> ${templateName}`,
    }),

  messageTemplateRemoved: (templateName: string) =>
    logActivity({
      action: 'delete',
      category: 'configuracao',
      description: `<span class="badge-danger">Template de mensagem removido</span> ${templateName}`,
    }),

  // === GENÉRICAS ===
  changed: (settingName: string, oldValue: unknown, newValue: unknown) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Configuração alterada</span> ${settingName}`,
      metadata: { oldValue, newValue },
    }),

  preferencesUpdated: (preferenceName: string) =>
    logActivity({
      action: 'update',
      category: 'configuracao',
      description: `<span class="badge-secondary">Preferências atualizadas</span> ${preferenceName}`,
    }),
}
