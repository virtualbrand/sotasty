-- SOLUÇÃO: Remover políticas restritivas e criar políticas abertas para todo workspace
-- Execute este script AGORA no Supabase SQL Editor

-- 1. Remover políticas antigas com verificação de permissões
DROP POLICY IF EXISTS "Users can view workspace transactions if they have financial permission" ON financial_transactions;
DROP POLICY IF EXISTS "Users can insert workspace transactions if they have financial permission" ON financial_transactions;
DROP POLICY IF EXISTS "Users can update workspace transactions if they have financial permission" ON financial_transactions;
DROP POLICY IF EXISTS "Users can delete workspace transactions if they have financial permission" ON financial_transactions;

DROP POLICY IF EXISTS "Users can view workspace accounts if they have financial permission" ON financial_accounts;
DROP POLICY IF EXISTS "Users can insert workspace accounts if they have financial permission" ON financial_accounts;
DROP POLICY IF EXISTS "Users can update workspace accounts if they have financial permission" ON financial_accounts;
DROP POLICY IF EXISTS "Users can delete workspace accounts if they have financial permission" ON financial_accounts;

DROP POLICY IF EXISTS "Users can view workspace categories if they have financial permission" ON financial_categories;
DROP POLICY IF EXISTS "Users can insert workspace categories if they have financial permission" ON financial_categories;
DROP POLICY IF EXISTS "Users can update workspace categories if they have financial permission" ON financial_categories;
DROP POLICY IF EXISTS "Users can delete workspace categories if they have financial permission" ON financial_categories;

-- 2. Criar novas políticas SEM verificação de permissões (todo member do workspace tem acesso)

-- financial_transactions
CREATE POLICY "Users can view workspace transactions"
  ON financial_transactions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workspace transactions"
  ON financial_transactions FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update workspace transactions"
  ON financial_transactions FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workspace transactions"
  ON financial_transactions FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

-- financial_accounts
CREATE POLICY "Users can view workspace accounts"
  ON financial_accounts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workspace accounts"
  ON financial_accounts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update workspace accounts"
  ON financial_accounts FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workspace accounts"
  ON financial_accounts FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

-- financial_categories
CREATE POLICY "Users can view workspace categories"
  ON financial_categories FOR SELECT
  USING (
    is_system = true OR
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workspace categories"
  ON financial_categories FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update workspace categories"
  ON financial_categories FOR UPDATE
  USING (
    is_system = false AND
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workspace categories"
  ON financial_categories FOR DELETE
  USING (
    is_system = false AND
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 3. Verificar se as novas políticas foram criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'financial_transactions'
ORDER BY policyname;
