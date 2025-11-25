-- Add workspace_id to financial tables to support multi-user access within workspaces

-- Add workspace_id column to financial_accounts
ALTER TABLE financial_accounts
ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Add workspace_id column to financial_categories
ALTER TABLE financial_categories
ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Add workspace_id column to financial_transactions
ALTER TABLE financial_transactions
ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Populate workspace_id from user profiles for existing records
UPDATE financial_accounts fa
SET workspace_id = p.workspace_id
FROM profiles p
WHERE fa.user_id = p.id AND fa.workspace_id IS NULL;

UPDATE financial_categories fc
SET workspace_id = p.workspace_id
FROM profiles p
WHERE fc.user_id = p.id AND fc.workspace_id IS NULL;

UPDATE financial_transactions ft
SET workspace_id = p.workspace_id
FROM profiles p
WHERE ft.user_id = p.id AND ft.workspace_id IS NULL;

-- Make workspace_id NOT NULL after populating
ALTER TABLE financial_accounts
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE financial_categories
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE financial_transactions
ALTER COLUMN workspace_id SET NOT NULL;

-- Create indexes for workspace_id
CREATE INDEX IF NOT EXISTS idx_financial_accounts_workspace_id ON financial_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_financial_categories_workspace_id ON financial_categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_workspace_id ON financial_transactions(workspace_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON financial_transactions;

DROP POLICY IF EXISTS "Users can view their own accounts" ON financial_accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON financial_accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON financial_accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON financial_accounts;

DROP POLICY IF EXISTS "Users can view their own categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON financial_categories;

-- Create new RLS policies based on workspace_id (all workspace members have access)

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
