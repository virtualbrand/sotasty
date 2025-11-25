# 🚀 GUIA DE MIGRAÇÃO COMPLETA - Workspace em Todas as Funcionalidades

## ✅ O que esta migração faz

Permite que **TODOS os membros do workspace** tenham acesso completo aos dados em:
- ✅ Cardápios (menus)
- ✅ Pedidos (orders)
- ✅ Produtos (final_products, base_recipes, ingredients)
- ✅ Clientes (customers)
- ✅ Agenda (agenda_tasks)
- ✅ Atividades (activities)
- ✅ Financeiro (já aplicado)
- ✅ Mensagens (whatsapp)

## 📋 Passo a Passo

### 1️⃣ Execute em ordem no Supabase SQL Editor:

```sql
-- PRIMEIRO: Adicionar workspace_id em todas as tabelas
-- Cole e execute: migrations/add_workspace_to_all_tables.sql
```

```sql
-- SEGUNDO: Atualizar políticas RLS
-- Cole e execute: migrations/update_all_rls_policies.sql
```

### 2️⃣ Verificar se funcionou:

```sql
-- Ver quantas políticas workspace foram criadas
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE policyname LIKE '%workspace%'
  AND tablename IN (
    'menus', 'orders', 'final_products', 'customers', 
    'agenda_tasks', 'activities'
  )
GROUP BY tablename
ORDER BY tablename;
```

**Resultado esperado**: Cada tabela deve ter 4 políticas (SELECT, INSERT, UPDATE, DELETE)

### 3️⃣ Testar com o member:

1. Faça login como **dash@teste.com** (member)
2. Acesse as funcionalidades:
   - `/cardapios` - Deve ver os cardápios do Jaisson
   - `/orders` - Deve ver os pedidos do Jaisson
   - `/products` - Deve ver os produtos do Jaisson
   - `/customers` - Deve ver os clientes do Jaisson
   - `/agenda` - Deve ver a agenda do Jaisson
   - `/activities` - Deve ver as atividades do Jaisson

## 🔍 Se algo não funcionar

Execute o diagnóstico:

```sql
-- Ver se workspace_id está preenchido
SELECT 
  'menus' as tabela,
  COUNT(*) as total,
  COUNT(workspace_id) as com_workspace
FROM menus
UNION ALL
SELECT 
  'orders',
  COUNT(*),
  COUNT(workspace_id)
FROM orders
UNION ALL
SELECT 
  'final_products',
  COUNT(*),
  COUNT(workspace_id)
FROM final_products;
```

## ⚠️ Importante

- Esta migração **remove** a verificação de permissões granulares
- Agora basta estar no workspace para ter acesso total
- O campo `user_id` permanece para auditoria (saber quem criou)
- Admin pode remover membros a qualquer momento

## 🎯 Benefícios

✅ **Simplicidade**: Sem gerenciar permissões por módulo  
✅ **Colaboração**: Time trabalha junto nos mesmos dados  
✅ **Segurança**: Workspaces completamente isolados  
✅ **Auditoria**: Sabe quem criou cada registro
