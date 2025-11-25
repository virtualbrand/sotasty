-- Script de diagnóstico para verificar permissões
-- Execute este script substituindo o email do usuário "Teste"

-- 1. Verificar permissões atuais do usuário no banco
SELECT 
  id,
  email,
  role,
  permissions,
  updated_at,
  workspace_id
FROM profiles 
WHERE email = 'dash@teste.com'; -- Substitua pelo email do usuário Teste

-- 2. Verificar se o Realtime está habilitado
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'profiles';

-- 3. Verificar última atualização
SELECT 
  email,
  updated_at,
  NOW() as hora_atual,
  NOW() - updated_at as tempo_desde_update
FROM profiles 
WHERE email = 'dash@teste.com';
