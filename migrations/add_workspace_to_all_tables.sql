-- ============================================================================
-- MIGRATION: Adicionar workspace_id a TODAS as tabelas do sistema
-- Permitir que membros tenham acesso completo aos dados do workspace
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR workspace_id às tabelas
-- ============================================================================

-- Cardápios
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus') THEN
    ALTER TABLE menus ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
    ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories') THEN
    ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
END $$;

-- Pedidos
DO $$ 
BEGIN
  -- orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  -- order_items
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  -- orders_statuses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_statuses') THEN
    ALTER TABLE orders_statuses ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  -- orders_categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_categories') THEN
    ALTER TABLE orders_categories ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  -- orders_tags
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_tags') THEN
    ALTER TABLE orders_tags ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
END $$;

-- Produtos
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_products') THEN
    ALTER TABLE final_products ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'base_recipes') THEN
    ALTER TABLE base_recipes ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredients') THEN
    ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
END $$;

-- Clientes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
END $$;

-- Agenda
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tasks') THEN
    ALTER TABLE agenda_tasks ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_statuses') THEN
    ALTER TABLE agenda_statuses ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_categories') THEN
    ALTER TABLE agenda_categories ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tags') THEN
    ALTER TABLE agenda_tags ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
END $$;

-- Atividades
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
END $$;

-- Mensagens
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
    ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_config') THEN
    ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
END $$;

-- Configurações
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_settings') THEN
    ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS workspace_id UUID;
  END IF;
END $$;

-- ============================================================================
-- 2. POPULAR workspace_id com dados existentes
-- ============================================================================

-- Cardápios
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus') THEN
    UPDATE menus SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = menus.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
    UPDATE menu_items mi SET workspace_id = (SELECT workspace_id FROM menus WHERE id = mi.menu_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories') THEN
    UPDATE menu_categories mc SET workspace_id = (SELECT workspace_id FROM menus WHERE id = mc.menu_id) WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Pedidos
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    UPDATE orders SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = orders.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    UPDATE order_items oi SET workspace_id = (SELECT workspace_id FROM orders WHERE id = oi.order_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_statuses') THEN
    UPDATE orders_statuses SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = orders_statuses.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_categories') THEN
    UPDATE orders_categories SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = orders_categories.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_tags') THEN
    UPDATE orders_tags SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = orders_tags.user_id) WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Produtos
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_products') THEN
    UPDATE final_products SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = final_products.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'base_recipes') THEN
    UPDATE base_recipes SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = base_recipes.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredients') THEN
    UPDATE ingredients SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = ingredients.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    UPDATE product_categories SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = product_categories.user_id) WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Clientes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    UPDATE customers SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = customers.user_id) WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Agenda
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tasks') THEN
    UPDATE agenda_tasks SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = agenda_tasks.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_statuses') THEN
    UPDATE agenda_statuses SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = agenda_statuses.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_categories') THEN
    UPDATE agenda_categories SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = agenda_categories.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tags') THEN
    UPDATE agenda_tags SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = agenda_tags.user_id) WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Atividades
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    UPDATE activities SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = activities.user_id) WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Mensagens
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
    UPDATE whatsapp_messages SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = whatsapp_messages.user_id) WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_config') THEN
    UPDATE whatsapp_config SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = whatsapp_config.user_id) WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Configurações
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_settings') THEN
    UPDATE profile_settings SET workspace_id = (SELECT workspace_id FROM profiles WHERE id = profile_settings.user_id) WHERE workspace_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 3. LIMPAR REGISTROS ÓRFÃOS (sem workspace_id válido)
-- ============================================================================

DO $$ 
BEGIN
  -- Deletar registros sem workspace_id válido
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus') THEN
    DELETE FROM menus WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
    DELETE FROM menu_items WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories') THEN
    DELETE FROM menu_categories WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    DELETE FROM orders WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    DELETE FROM order_items WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_statuses') THEN
    DELETE FROM orders_statuses WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_categories') THEN
    DELETE FROM orders_categories WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_tags') THEN
    DELETE FROM orders_tags WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_products') THEN
    DELETE FROM final_products WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'base_recipes') THEN
    DELETE FROM base_recipes WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredients') THEN
    DELETE FROM ingredients WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    DELETE FROM product_categories WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    DELETE FROM customers WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tasks') THEN
    DELETE FROM agenda_tasks WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_statuses') THEN
    DELETE FROM agenda_statuses WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_categories') THEN
    DELETE FROM agenda_categories WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tags') THEN
    DELETE FROM agenda_tags WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    DELETE FROM activities WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
    DELETE FROM whatsapp_messages WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_config') THEN
    DELETE FROM whatsapp_config WHERE workspace_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_settings') THEN
    DELETE FROM profile_settings WHERE workspace_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 4. TORNAR workspace_id NOT NULL
-- ============================================================================

-- Tornar NOT NULL apenas nas tabelas que existem e que têm dados
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus') THEN
    ALTER TABLE menus ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
    ALTER TABLE menu_items ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories') THEN
    ALTER TABLE menu_categories ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    ALTER TABLE orders ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    ALTER TABLE order_items ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_statuses') THEN
    ALTER TABLE orders_statuses ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_categories') THEN
    ALTER TABLE orders_categories ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_tags') THEN
    ALTER TABLE orders_tags ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_products') THEN
    ALTER TABLE final_products ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'base_recipes') THEN
    ALTER TABLE base_recipes ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredients') THEN
    ALTER TABLE ingredients ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    ALTER TABLE product_categories ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    ALTER TABLE customers ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tasks') THEN
    ALTER TABLE agenda_tasks ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_statuses') THEN
    ALTER TABLE agenda_statuses ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_categories') THEN
    ALTER TABLE agenda_categories ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tags') THEN
    ALTER TABLE agenda_tags ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    ALTER TABLE activities ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
    ALTER TABLE whatsapp_messages ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_config') THEN
    ALTER TABLE whatsapp_config ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_settings') THEN
    ALTER TABLE profile_settings ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 5. CRIAR ÍNDICES
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus') THEN
    CREATE INDEX IF NOT EXISTS idx_menus_workspace_id ON menus(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
    CREATE INDEX IF NOT EXISTS idx_menu_items_workspace_id ON menu_items(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories') THEN
    CREATE INDEX IF NOT EXISTS idx_menu_categories_workspace_id ON menu_categories(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_workspace_id ON orders(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_workspace_id ON order_items(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_statuses') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_statuses_workspace_id ON orders_statuses(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_categories') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_categories_workspace_id ON orders_categories(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_tags') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_tags_workspace_id ON orders_tags(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_products') THEN
    CREATE INDEX IF NOT EXISTS idx_final_products_workspace_id ON final_products(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'base_recipes') THEN
    CREATE INDEX IF NOT EXISTS idx_base_recipes_workspace_id ON base_recipes(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredients') THEN
    CREATE INDEX IF NOT EXISTS idx_ingredients_workspace_id ON ingredients(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    CREATE INDEX IF NOT EXISTS idx_product_categories_workspace_id ON product_categories(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_workspace_id ON customers(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tasks') THEN
    CREATE INDEX IF NOT EXISTS idx_agenda_tasks_workspace_id ON agenda_tasks(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_statuses') THEN
    CREATE INDEX IF NOT EXISTS idx_agenda_statuses_workspace_id ON agenda_statuses(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_categories') THEN
    CREATE INDEX IF NOT EXISTS idx_agenda_categories_workspace_id ON agenda_categories(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tags') THEN
    CREATE INDEX IF NOT EXISTS idx_agenda_tags_workspace_id ON agenda_tags(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    CREATE INDEX IF NOT EXISTS idx_activities_workspace_id ON activities(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
    CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_workspace_id ON whatsapp_messages(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_config') THEN
    CREATE INDEX IF NOT EXISTS idx_whatsapp_config_workspace_id ON whatsapp_config(workspace_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_settings') THEN
    CREATE INDEX IF NOT EXISTS idx_profile_settings_workspace_id ON profile_settings(workspace_id);
  END IF;
END $$;
