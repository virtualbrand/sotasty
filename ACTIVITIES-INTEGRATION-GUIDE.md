# Sistema de Registro de Atividades - Guia de Integração

## Visão Geral

Sistema completo para rastrear todas as ações CRUD (Create, Read, Update, Delete) realizadas pelos usuários em cada módulo do sistema.

## Arquitetura

### 1. Tabela de Atividades (`activities`)

**Campos:**
- `workspace_id` - Workspace do usuário
- `user_id` - Usuário que realizou a ação
- `action` - Tipo: create, update, delete, view, export, other
- `category` - Módulo: produto, cardapio, pedido, cliente, financeiro, agenda, configuracao, system
- `description` - Descrição legível da ação
- `metadata` - Dados adicionais em JSON
- `entity_type` - Tipo da entidade (order, product, customer, etc)
- `entity_id` - ID da entidade afetada
- `created_at` - Timestamp

### 2. Serviço de Log (`lib/activityLogger.ts`)

**Função Principal:**
```typescript
import { logActivity } from '@/lib/activityLogger'

logActivity({
  action: 'create',
  category: 'produto',
  description: 'Novo produto criado: Bolo de Chocolate',
  metadata: { price: 85.00 },
  entityType: 'product',
  entityId: 'uuid-do-produto'
})
```

**Helpers Prontos:**
- `ActivityProducts` - Produtos (ingredientes, bases, produtos finais)
- `ActivityMenus` - Cardápios
- `ActivityOrders` - Pedidos
- `ActivityCustomers` - Clientes
- `ActivityFinancial` - Transações financeiras
- `ActivityAgenda` - Tarefas da agenda
- `ActivitySettings` - Configurações

## Como Integrar em Cada Módulo

### 📦 Produtos

**Arquivo:** `app/api/products/route.ts`

```typescript
import { ActivityProducts } from '@/lib/activityLogger'

// CRIAR PRODUTO
export async function POST(request: Request) {
  // ... código de criação
  const newProduct = await supabase.from('products').insert(data).select().single()
  
  // Registrar atividade
  await ActivityProducts.created(data.name, newProduct.data.id)
  
  return NextResponse.json(newProduct.data)
}

// ATUALIZAR PRODUTO
export async function PUT(request: Request) {
  // ... código de atualização
  const { name, price, oldPrice } = data
  
  if (price !== oldPrice) {
    await ActivityProducts.priceChanged(name, oldPrice, price, productId)
  } else {
    await ActivityProducts.updated(name, { changes: data }, productId)
  }
  
  return NextResponse.json(updated.data)
}

// DELETAR PRODUTO
export async function DELETE(request: Request) {
  const { name, id } = await request.json()
  // ... código de deleção
  
  await ActivityProducts.deleted(name, id)
  
  return NextResponse.json({ success: true })
}
```

### 🍽️ Cardápios

**Arquivo:** `app/api/menus/route.ts`

```typescript
import { ActivityMenus } from '@/lib/activityLogger'

// CRIAR CARDÁPIO
await ActivityMenus.created(menuData.name, newMenu.id)

// ATUALIZAR CARDÁPIO
await ActivityMenus.updated(menuData.name, { changes }, menuId)

// PUBLICAR CARDÁPIO
await ActivityMenus.published(menuData.name, menuId)

// DELETAR CARDÁPIO
await ActivityMenus.deleted(menuData.name, menuId)
```

### 🛒 Pedidos

**Arquivo:** `app/api/orders/route.ts`

```typescript
import { ActivityOrders } from '@/lib/activityLogger'

// CRIAR PEDIDO
await ActivityOrders.created(
  orderData.title, 
  orderData.customer_name, 
  newOrder.id
)

// ATUALIZAR STATUS
await ActivityOrders.statusChanged(
  orderData.title,
  oldStatus,
  newStatus,
  orderId
)

// CONCLUIR PEDIDO
await ActivityOrders.completed(
  orderData.title,
  orderData.customer_name,
  orderId
)

// DELETAR PEDIDO
await ActivityOrders.deleted(orderData.title, orderId)
```

### 👥 Clientes

**Arquivo:** `app/api/customers/route.ts`

```typescript
import { ActivityCustomers } from '@/lib/activityLogger'

// CRIAR CLIENTE
await ActivityCustomers.created(customerData.name, newCustomer.id)

// ATUALIZAR CLIENTE
await ActivityCustomers.updated(customerData.name, { changes }, customerId)

// DELETAR CLIENTE
await ActivityCustomers.deleted(customerData.name, customerId)
```

### 💰 Financeiro

**Arquivo:** `app/api/financial/route.ts`

```typescript
import { ActivityFinancial } from '@/lib/activityLogger'

// CRIAR TRANSAÇÃO
await ActivityFinancial.transactionCreated(
  transactionData.type, // 'receita' ou 'despesa'
  transactionData.amount,
  transactionData.description,
  newTransaction.id
)

// ATUALIZAR TRANSAÇÃO
await ActivityFinancial.transactionUpdated(
  transactionData.type,
  transactionData.amount,
  transactionData.description,
  transactionId
)

// DELETAR TRANSAÇÃO
await ActivityFinancial.transactionDeleted(
  transactionData.type,
  transactionData.amount,
  transactionData.description,
  transactionId
)
```

### 📅 Agenda

**Arquivo:** `app/api/agenda/route.ts`

```typescript
import { ActivityAgenda } from '@/lib/activityLogger'

// CRIAR TAREFA
await ActivityAgenda.taskCreated(taskData.title, newTask.id)

// ATUALIZAR TAREFA
await ActivityAgenda.taskUpdated(taskData.title, { changes }, taskId)

// CONCLUIR TAREFA
await ActivityAgenda.taskCompleted(taskData.title, taskId)

// DELETAR TAREFA
await ActivityAgenda.taskDeleted(taskData.title, taskId)
```

### ⚙️ Configurações

**Arquivo:** `app/(dashboard)/settings/*/page.tsx`

```typescript
import { ActivitySettings } from '@/lib/activityLogger'

// ALTERAR CONFIGURAÇÃO
await ActivitySettings.changed(
  'Formato de data',
  'short',
  'long'
)

// ATUALIZAR PREFERÊNCIAS
await ActivitySettings.preferencesUpdated('Posição do menu')
```

## Implementação Passo a Passo

### 1. Executar Migração

Execute o arquivo `migrations/enhance_activities_table.sql` no Supabase SQL Editor.

### 2. Integrar nas APIs

Para cada endpoint de API (POST, PUT, DELETE), adicione as chamadas apropriadas ao `ActivityLogger`.

### 3. Padrão de Implementação

```typescript
// 1. Importar o helper
import { Activity[Módulo] } from '@/lib/activityLogger'

// 2. Executar a operação no banco
const result = await supabase.from('table').insert(data)

// 3. Registrar a atividade (não bloqueante)
await Activity[Módulo].[ação](params)
// OU use .then() para não bloquear:
Activity[Módulo].[ação](params).catch(err => 
  console.error('Erro ao registrar atividade:', err)
)

// 4. Retornar resposta
return NextResponse.json(result)
```

## Benefícios

✅ **Rastreabilidade Completa**: Todas as ações são registradas
✅ **Auditoria**: Saber quem fez o quê e quando
✅ **Timeline de Mudanças**: Histórico completo por entidade
✅ **Workspace Isolado**: Cada workspace vê apenas suas atividades
✅ **Metadados Ricos**: JSON com detalhes adicionais
✅ **Pesquisável**: Índices otimizados para queries rápidas
✅ **Performance**: Registros assíncronos não bloqueiam operações

## Visualização

A página `/activities` exibe:
- Lista de todas as atividades do workspace
- Filtros por categoria, usuário, data
- Busca por descrição
- Ícones e badges por tipo de ação
- Timeline cronológica

## Próximos Passos

1. ✅ Criar migração
2. ✅ Criar serviço de log
3. ✅ Criar helpers por módulo
4. ⏳ Executar migração no Supabase
5. ⏳ Integrar em APIs de Produtos
6. ⏳ Integrar em APIs de Cardápios
7. ⏳ Integrar em APIs de Pedidos
8. ⏳ Integrar em APIs de Clientes
9. ⏳ Integrar em APIs de Financeiro
10. ⏳ Integrar em APIs de Agenda
11. ⏳ Atualizar página de Atividades para consumir dados reais

## Notas Importantes

- Os registros de atividade são **assíncronos** e não bloqueiam as operações principais
- Se falhar ao registrar, a operação principal ainda é bem-sucedida
- Use `await` ou `.catch()` para tratar erros silenciosamente
- Os metadados em JSON permitem flexibilidade para dados específicos de cada módulo
