-- Diagnóstico Detalhado - Execute estas queries uma por vez

-- Query 1: Ver todos os perfis (admin e members)
SELECT 
  id,
  full_name,
  role,
  workspace_id,
  invited_by,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Query 2: Ver se as transações TÊM workspace_id preenchido
SELECT 
  id,
  description,
  amount,
  type,
  user_id,
  workspace_id,
  created_at
FROM financial_transactions
ORDER BY created_at DESC
LIMIT 20;

-- Query 3: Verificar se alguma transação está SEM workspace_id
SELECT 
  COUNT(*) as total,
  COUNT(workspace_id) as com_workspace,
  COUNT(*) - COUNT(workspace_id) as sem_workspace
FROM financial_transactions;

-- Query 4: Ver qual é o workspace_id do Jaisson (admin)
SELECT 
  id as user_id,
  full_name,
  role,
  workspace_id,
  CASE 
    WHEN workspace_id = id THEN '✅ É SEU PRÓPRIO WORKSPACE'
    ELSE '⚠️ Workspace diferente do ID'
  END as status
FROM profiles
WHERE full_name LIKE '%Jaisson%' OR role = 'admin';

-- Query 5: Ver se existe algum member convidado
SELECT 
  p2.id as member_id,
  p2.full_name as member_nome,
  p2.workspace_id as member_workspace,
  p1.full_name as convidado_por,
  p1.workspace_id as workspace_do_admin,
  CASE 
    WHEN p2.workspace_id = p1.workspace_id THEN '✅ MESMO WORKSPACE'
    ELSE '❌ WORKSPACES DIFERENTES'
  END as status
FROM profiles p2
LEFT JOIN profiles p1 ON p2.invited_by = p1.id
WHERE p2.role = 'member';

-- Query 6: Verificar políticas RLS ativas (IMPORTANTE!)
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'financial_transactions'
ORDER BY policyname;

-- Query 7: Testar se um member conseguiria ver as transações (simular)
-- Substitua 'MEMBER_UUID' pelo ID do member
/*
SELECT 
  ft.id,
  ft.description,
  ft.workspace_id as transacao_workspace,
  p.workspace_id as member_workspace,
  CASE 
    WHEN ft.workspace_id = p.workspace_id THEN '✅ MEMBER DEVERIA VER'
    ELSE '❌ MEMBER NÃO VERIA'
  END as acesso
FROM financial_transactions ft
CROSS JOIN profiles p
WHERE p.id = 'MEMBER_UUID'  -- SUBSTITUA AQUI
LIMIT 10;
*/

-- Query 8: Ver a estrutura completa da tabela financial_transactions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'financial_transactions'
ORDER BY ordinal_position;
