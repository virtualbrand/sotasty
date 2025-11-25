-- Add permissions column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB;

-- Add comment to explain the structure
COMMENT ON COLUMN profiles.permissions IS 'Permissões granulares do usuário: { dashboard, products, menus, orders, financial, messages, support, customers, agenda, activities }';
