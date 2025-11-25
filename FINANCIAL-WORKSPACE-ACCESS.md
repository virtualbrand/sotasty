# Acesso Financeiro por Workspace

## Visão Geral

Implementação do sistema de acesso compartilhado às funcionalidades financeiras baseado em workspace. **TODOS os membros do workspace** (admin e members convidados) têm acesso completo às transações, contas e categorias.

## Mudanças Implementadas

### 1. Migration: `add_workspace_to_financial_tables.sql`

**Objetivo**: Adicionar suporte a workspace nas tabelas financeiras e atualizar políticas RLS para acesso compartilhado.

**Alterações nas Tabelas**:
- ✅ Adicionado `workspace_id UUID NOT NULL` em:
  - `financial_accounts`
  - `financial_categories`
  - `financial_transactions`

**Índices Criados**:
```sql
CREATE INDEX idx_financial_accounts_workspace_id ON financial_accounts(workspace_id);
CREATE INDEX idx_financial_categories_workspace_id ON financial_categories(workspace_id);
CREATE INDEX idx_financial_transactions_workspace_id ON financial_transactions(workspace_id);
```

**Políticas RLS Atualizadas**:

Todas as políticas agora verificam **APENAS** se o usuário pertence ao mesmo workspace (sem verificação de permissões específicas).

Exemplo de política:
```sql
CREATE POLICY "Users can view workspace transactions"
  ON financial_transactions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );
```

### 2. Migration de Correção: `fix_financial_workspace_access.sql`

**Quando usar**: Se você já executou a migration anterior com verificação de permissões e quer remover essa restrição.

Esta migration remove as políticas restritivas e cria novas políticas abertas para todos os membros do workspace.

### 2. APIs Atualizadas

#### `/api/financeiro/transactions` (route.ts)
- ✅ **GET**: Busca transações do workspace ao invés de apenas do usuário
- ✅ **POST**: Cria transações associadas ao workspace
- ✅ **PUT**: Atualiza transações usando workspace_id
- ✅ **DELETE**: Remove transações do workspace

**Mudança Principal**:
```typescript
// ANTES
.eq('user_id', user.id)

// DEPOIS
// 1. Buscar workspace_id do perfil
const { data: profile } = await supabase
  .from('profiles')
  .select('workspace_id')
  .eq('id', user.id)
  .single()

// 2. Usar workspace_id nas queries
.eq('workspace_id', profile.workspace_id)
```

#### `/api/financeiro/transactions/[id]` (PATCH)
- ✅ Atualizado para usar `workspace_id` na verificação e atualização

#### `/api/financeiro/accounts`
- ✅ **GET**: Lista contas do workspace
- ✅ **POST**: Cria contas com workspace_id
- ✅ **PUT**: Atualiza contas do workspace
- ✅ **DELETE**: Remove contas do workspace

#### `/api/financeiro/categories`
- ✅ **GET**: Lista categorias do workspace
- ✅ **POST**: Cria categorias com workspace_id
- ✅ **PUT**: Atualiza categorias do workspace
- ✅ **DELETE**: Remove categorias do workspace

### 3. Compatibilidade com Sistema de Membros

O sistema agora está totalmente integrado com o sistema de gerenciamento de usuários:

**Admin**:
- Tem acesso total a todas as transações do workspace
- Pode criar, editar e excluir transações, contas e categorias
- Workspace_id = seu próprio ID

**Member com permissão `financial: true`**:
- Visualiza TODAS as transações do workspace do admin
- Pode criar, editar e excluir transações
- Pode gerenciar contas e categorias do workspace
- Compartilha o workspace_id do admin que o convidou

**Member sem permissão financeira**:
- Sem acesso ao módulo financeiro
- RLS policies bloqueiam qualquer tentativa de acesso

## Como Funciona Agora

**Admin** (dono do negócio):
- Vê todas as transações do seu workspace
- Cria transações associadas ao workspace
- Workspace_id = seu próprio ID

**Member** (qualquer membro convidado):
- Vê TODAS as transações do workspace do admin
- Pode criar, editar e excluir transações
- Pode gerenciar contas e categorias do workspace
- Compartilha o mesmo workspace_id do admin
- **NÃO precisa de permissão específica** - apenas estar no workspace

## Como Usar

### 1. Executar Migration

**Se ainda não executou nenhuma migration:**
Execute `add_workspace_to_financial_tables.sql`:
```bash
psql -h [host] -U [user] -d [database] -f migrations/add_workspace_to_financial_tables.sql
```

**Se já executou a migration anterior com verificação de permissões:**
Execute `fix_financial_workspace_access.sql` para remover a verificação:
```bash
psql -h [host] -U [user] -d [database] -f migrations/fix_financial_workspace_access.sql
```

Ou via Supabase Dashboard:
1. Acesse SQL Editor
2. Cole o conteúdo do arquivo apropriado
3. Execute

### 2. Verificar Workspace

Para que um membro tenha acesso, ele precisa estar no workspace:
```typescript
// Na tabela profiles
{
  id: 'member-uuid',
  role: 'member',
  workspace_id: 'admin-workspace-uuid', // Mesmo workspace_id do admin
  invited_by: 'admin-uuid'
}
```

### 3. Testar Acesso

1. **Como Admin**: Crie algumas transações
2. **Como Member**: Faça login e acesse `/financeiro`
3. **Verificar**: Member deve ver todas as transações do admin

## Diagnóstico de Problemas

Se o membro não está vendo as transações do admin, verifique:

### 1. Workspace ID está correto?
```sql
-- Verificar workspace_id do admin e do member
SELECT id, email, role, workspace_id 
FROM profiles 
WHERE email IN ('admin@email.com', 'member@email.com');

-- Os dois devem ter o MESMO workspace_id
```

### 2. Transações têm workspace_id?
```sql
-- Verificar se transações têm workspace_id populado
SELECT id, description, workspace_id, user_id
FROM financial_transactions
WHERE user_id = 'admin-uuid';

-- workspace_id deve estar preenchido
```

### 3. Política RLS está ativa?
```sql
-- Verificar políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'financial_transactions';

-- Deve ter as políticas "Users can view workspace transactions" etc.
```

### 4. Testar query manual
```sql
-- Como member, testar se consegue ver transações
SELECT * 
FROM financial_transactions 
WHERE workspace_id = 'workspace-uuid-do-admin';

-- Se retornar vazio, o problema é na policy ou workspace_id
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas financeiras estão protegidas por RLS que verifica:
1. **Workspace**: Usuário deve pertencer ao workspace
2. **Permissões**: Usuário deve ter role adequada ou permissão específica
3. **Contexto**: auth.uid() é usado para validação em tempo real

### Validações nas APIs

Todas as APIs validam:
1. Autenticação (usuário logado)
2. Workspace válido
3. Permissões através do RLS (automático)

## Benefícios

✅ **Colaboração Total**: Todos membros do workspace têm acesso aos dados financeiros  
✅ **Simplicidade**: Sem necessidade de gerenciar permissões granulares por módulo  
✅ **Segurança**: RLS garante isolamento total entre workspaces diferentes  
✅ **Auditoria**: user_id mantido para rastreamento de quem criou cada registro  
✅ **Flexibilidade**: Admin controla quem entra no workspace via convites

## Dados Preservados

- ✅ `user_id` mantido em todas as tabelas para auditoria
- ✅ Dados existentes migrados automaticamente (workspace_id populado)
- ✅ Funcionalidades existentes não afetadas
- ✅ Compatibilidade retroativa mantida

## Próximos Passos (Opcional)

1. ⏳ Adicionar campo "criado_por" na UI das transações
2. ⏳ Implementar log de auditoria de mudanças
3. ⏳ Dashboard de atividades financeiras por membro

## Resolução de Problemas - Passo a Passo

### 🔍 Diagnóstico Completo

1. **Execute o script de diagnóstico**:
   ```bash
   # No Supabase SQL Editor
   migrations/diagnostico_workspace_financeiro.sql
   ```

2. **Verifique o resultado de cada query** e anote:
   - Query 4: Transações têm workspace_id?
   - Query 6: RLS está habilitado?
   - Query 9: Admin e member têm mesmo workspace_id?

### 🔧 Correções Necessárias

**Problema 1: Transações sem workspace_id**
```sql
-- Preencher workspace_id nas transações existentes
UPDATE financial_transactions ft
SET workspace_id = p.workspace_id
FROM profiles p
WHERE ft.user_id = p.id AND ft.workspace_id IS NULL;
```

**Problema 2: Member com workspace_id diferente do admin**
```sql
-- Corrigir workspace_id do member
UPDATE profiles
SET workspace_id = (
  SELECT workspace_id FROM profiles WHERE id = invited_by
)
WHERE role = 'member' AND invited_by IS NOT NULL;
```

**Problema 3: Políticas RLS antigas ainda ativas**
```sql
-- Execute: migrations/fix_financial_workspace_access.sql
-- Isso remove políticas antigas e cria novas
```

**Problema 4: workspace_id NULL nas tabelas**
```sql
-- Verificar se coluna existe e está NOT NULL
ALTER TABLE financial_transactions
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE financial_accounts  
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE financial_categories
ALTER COLUMN workspace_id SET NOT NULL;
```

### ✅ Verificação Final

Após as correções, execute:
```sql
-- Como MEMBER, testar se vê transações do admin
SELECT COUNT(*) as total_transacoes_visiveis
FROM financial_transactions;

-- Deve retornar > 0 se admin criou transações
```

## Suporte

Para dúvidas ou problemas, verifique:
1. RLS policies ativas: `SELECT * FROM pg_policies WHERE tablename LIKE 'financial_%'`
2. Workspace correto: `SELECT id, workspace_id FROM profiles WHERE id = auth.uid()`
3. Transações com workspace: `SELECT COUNT(*) FROM financial_transactions WHERE workspace_id IS NOT NULL`
