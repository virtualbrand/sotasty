-- ============================================================================
-- MIGRATION COMPLETA: Workspace em TODAS as funcionalidades
-- Execute este script no Supabase SQL Editor
-- ============================================================================
-- Este script:
-- 1. Adiciona workspace_id em todas as tabelas
-- 2. Popula workspace_id com dados existentes
-- 3. Atualiza TODAS as políticas RLS para acesso por workspace
-- 4. Remove verificação de permissões granulares
-- ============================================================================

\echo '=== INICIANDO MIGRATION ==='
\echo '=== Parte 1: Adicionando workspace_id ==='

-- Executar migration add_workspace_to_all_tables.sql
\i add_workspace_to_all_tables.sql

\echo '=== Parte 2: Atualizando políticas RLS ==='

-- Executar migration update_all_rls_policies.sql
\i update_all_rls_policies.sql

\echo '=== MIGRATION CONCLUÍDA COM SUCESSO! ==='
\echo '=== Verificando resultado ==='

-- Verificar se as políticas foram criadas corretamente
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE policyname LIKE '%workspace%') as workspace_policies
FROM pg_policies 
WHERE tablename IN (
  'menus', 'orders', 'final_products', 'customers', 
  'agenda_tasks', 'activities', 'financial_transactions'
)
GROUP BY tablename
ORDER BY tablename;

\echo '=== Se todas as tabelas têm políticas workspace, está pronto! ==='
