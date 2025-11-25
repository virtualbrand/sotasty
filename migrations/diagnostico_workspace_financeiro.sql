-- Script de diagnóstico para verificar acesso ao workspace financeiro
-- Execute este script para identificar problemas de acesso

-- 1. Verificar estrutura das tabelas financeiras
SELECT 
  'financial_transactions' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'financial_transactions' 
  AND column_name IN ('id', 'user_id', 'workspace_id', 'description', 'amount');

-- 2. Verificar perfis dos usuários
SELECT 
  id,
  full_name,
  role,
  workspace_id,
  invited_by,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar transações existentes
SELECT 
  ft.id,
  ft.description,
  ft.amount,
  ft.type,
  ft.user_id,
  ft.workspace_id,
  p.full_name as criado_por,
  p.role as role_criador
FROM financial_transactions ft
LEFT JOIN profiles p ON ft.user_id = p.id
ORDER BY ft.created_at DESC
LIMIT 10;

-- 4. Verificar se workspace_id está preenchido nas transações
SELECT 
  COUNT(*) as total_transacoes,
  COUNT(workspace_id) as com_workspace_id,
  COUNT(*) - COUNT(workspace_id) as sem_workspace_id
FROM financial_transactions;

-- 5. Verificar políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as comando,
  qual as condicao
FROM pg_policies 
WHERE tablename IN ('financial_transactions', 'financial_accounts', 'financial_categories')
ORDER BY tablename, cmd;

-- 6. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename IN ('financial_transactions', 'financial_accounts', 'financial_categories');

-- 7. Verificar índices criados
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('financial_transactions', 'financial_accounts', 'financial_categories')
  AND indexname LIKE '%workspace%';

-- 8. Testar acesso de um usuário específico (substitua o UUID)
-- IMPORTANTE: Execute esta query logado como o member que não está vendo os dados
/*
SELECT 
  ft.*,
  p.full_name as criado_por
FROM financial_transactions ft
LEFT JOIN profiles p ON ft.user_id = p.id
WHERE ft.workspace_id IN (
  SELECT workspace_id FROM profiles WHERE id = auth.uid()
)
ORDER BY ft.created_at DESC;
*/

-- 9. Verificar relacionamento workspace entre admin e member
SELECT 
  p1.full_name as admin_nome,
  p1.workspace_id as admin_workspace,
  p2.full_name as member_nome,
  p2.workspace_id as member_workspace,
  CASE 
    WHEN p1.workspace_id = p2.workspace_id THEN '✅ MESMO WORKSPACE'
    ELSE '❌ WORKSPACES DIFERENTES'
  END as status
FROM profiles p1
JOIN profiles p2 ON p2.invited_by = p1.id
WHERE p1.role = 'admin' AND p2.role = 'member';

-- 10. Contar transações por workspace
SELECT 
  ft.workspace_id,
  p.full_name as dono_workspace,
  COUNT(ft.id) as total_transacoes
FROM financial_transactions ft
LEFT JOIN profiles p ON ft.workspace_id = p.id
GROUP BY ft.workspace_id, p.full_name
ORDER BY total_transacoes DESC;
