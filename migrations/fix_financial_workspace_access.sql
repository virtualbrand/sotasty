-- Fix financial workspace access - Allow ALL workspace members to access data
-- Run this if you already ran add_workspace_to_financial_tables.sql

-- Drop the old restrictive policies
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

-- Create new open policies (all workspace members have access)

-- financial_transactions policies
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

-- financial_accounts policies
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

-- financial_categories policies
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
