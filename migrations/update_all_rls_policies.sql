-- ============================================================================
-- MIGRATION: Atualizar políticas RLS para acesso por workspace
-- Parte 2: Remover políticas antigas e criar novas baseadas em workspace
-- ============================================================================

-- ============================================================================
-- CARDÁPIOS (MENUS)
-- ============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own menus" ON menus;
DROP POLICY IF EXISTS "Users can insert their own menus" ON menus;
DROP POLICY IF EXISTS "Users can update their own menus" ON menus;
DROP POLICY IF EXISTS "Users can delete their own menus" ON menus;

-- Criar novas políticas baseadas em workspace
CREATE POLICY "Users can view workspace menus"
  ON menus FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()) OR active = true);

CREATE POLICY "Users can insert workspace menus"
  ON menus FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update workspace menus"
  ON menus FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete workspace menus"
  ON menus FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Menu Items
DROP POLICY IF EXISTS "Users can view items from their own menus" ON menu_items;
DROP POLICY IF EXISTS "Users can insert items to their own menus" ON menu_items;
DROP POLICY IF EXISTS "Users can update items from their own menus" ON menu_items;
DROP POLICY IF EXISTS "Users can delete items from their own menus" ON menu_items;
DROP POLICY IF EXISTS "Anyone can view items from public menus" ON menu_items;

CREATE POLICY "Users can view workspace menu items"
  ON menu_items FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM menus WHERE menus.id = menu_items.menu_id AND menus.active = true)
  );

CREATE POLICY "Users can insert workspace menu items"
  ON menu_items FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update workspace menu items"
  ON menu_items FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete workspace menu items"
  ON menu_items FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Menu Categories
DROP POLICY IF EXISTS "Users can manage categories from their own menus" ON menu_categories;

CREATE POLICY "Users can manage workspace menu categories"
  ON menu_categories FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- ============================================================================
-- PEDIDOS (ORDERS)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
    DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
    DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
    DROP POLICY IF EXISTS "Users can delete their own orders" ON orders;

    CREATE POLICY "Users can view workspace orders"
      ON orders FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can insert workspace orders"
      ON orders FOR INSERT
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can update workspace orders"
      ON orders FOR UPDATE
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can delete workspace orders"
      ON orders FOR DELETE
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- Order Items
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
    DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
    DROP POLICY IF EXISTS "Users can update their own order items" ON order_items;
    DROP POLICY IF EXISTS "Users can delete their own order items" ON order_items;

    CREATE POLICY "Users can view workspace order items"
      ON order_items FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can insert workspace order items"
      ON order_items FOR INSERT
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can update workspace order items"
      ON order_items FOR UPDATE
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can delete workspace order items"
      ON order_items FOR DELETE
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- Orders Settings
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_statuses') THEN
    DROP POLICY IF EXISTS "Users can view their own order statuses" ON orders_statuses;
    DROP POLICY IF EXISTS "Users can insert their own order statuses" ON orders_statuses;
    DROP POLICY IF EXISTS "Users can update their own order statuses" ON orders_statuses;
    DROP POLICY IF EXISTS "Users can delete their own order statuses" ON orders_statuses;

    CREATE POLICY "Users can manage workspace order statuses"
      ON orders_statuses FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_categories') THEN
    DROP POLICY IF EXISTS "Users can view their own order categories" ON orders_categories;
    DROP POLICY IF EXISTS "Users can insert their own order categories" ON orders_categories;
    DROP POLICY IF EXISTS "Users can update their own order categories" ON orders_categories;
    DROP POLICY IF EXISTS "Users can delete their own order categories" ON orders_categories;

    CREATE POLICY "Users can manage workspace order categories"
      ON orders_categories FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_tags') THEN
    DROP POLICY IF EXISTS "Users can view their own order tags" ON orders_tags;
    DROP POLICY IF EXISTS "Users can insert their own order tags" ON orders_tags;
    DROP POLICY IF EXISTS "Users can update their own order tags" ON orders_tags;
    DROP POLICY IF EXISTS "Users can delete their own order tags" ON orders_tags;

    CREATE POLICY "Users can manage workspace order tags"
      ON orders_tags FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- PRODUTOS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own products" ON final_products;
DROP POLICY IF EXISTS "Users can insert their own products" ON final_products;
DROP POLICY IF EXISTS "Users can update their own products" ON final_products;
DROP POLICY IF EXISTS "Users can delete their own products" ON final_products;

CREATE POLICY "Users can view workspace products"
  ON final_products FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert workspace products"
  ON final_products FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update workspace products"
  ON final_products FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete workspace products"
  ON final_products FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Base Recipes
DROP POLICY IF EXISTS "Users can view their own recipes" ON base_recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON base_recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON base_recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON base_recipes;

CREATE POLICY "Users can view workspace recipes"
  ON base_recipes FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert workspace recipes"
  ON base_recipes FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update workspace recipes"
  ON base_recipes FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete workspace recipes"
  ON base_recipes FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Ingredients
DROP POLICY IF EXISTS "Users can view their own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can insert their own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can update their own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can delete their own ingredients" ON ingredients;

CREATE POLICY "Users can view workspace ingredients"
  ON ingredients FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert workspace ingredients"
  ON ingredients FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update workspace ingredients"
  ON ingredients FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete workspace ingredients"
  ON ingredients FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Product Categories
DROP POLICY IF EXISTS "Users can view their own categories" ON product_categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON product_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON product_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON product_categories;

CREATE POLICY "Users can manage workspace product categories"
  ON product_categories FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- ============================================================================
-- CLIENTES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

CREATE POLICY "Users can view workspace customers"
  ON customers FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert workspace customers"
  ON customers FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update workspace customers"
  ON customers FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete workspace customers"
  ON customers FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- ============================================================================
-- AGENDA
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tasks') THEN
    DROP POLICY IF EXISTS "Users can view their own tasks" ON agenda_tasks;
    DROP POLICY IF EXISTS "Users can insert their own tasks" ON agenda_tasks;
    DROP POLICY IF EXISTS "Users can update their own tasks" ON agenda_tasks;
    DROP POLICY IF EXISTS "Users can delete their own tasks" ON agenda_tasks;

    CREATE POLICY "Users can view workspace tasks"
      ON agenda_tasks FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can insert workspace tasks"
      ON agenda_tasks FOR INSERT
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can update workspace tasks"
      ON agenda_tasks FOR UPDATE
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can delete workspace tasks"
      ON agenda_tasks FOR DELETE
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- Agenda Settings
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_statuses') THEN
    DROP POLICY IF EXISTS "Users can view their own agenda statuses" ON agenda_statuses;
    DROP POLICY IF EXISTS "Users can insert their own agenda statuses" ON agenda_statuses;
    DROP POLICY IF EXISTS "Users can update their own agenda statuses" ON agenda_statuses;
    DROP POLICY IF EXISTS "Users can delete their own agenda statuses" ON agenda_statuses;

    CREATE POLICY "Users can manage workspace agenda statuses"
      ON agenda_statuses FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_categories') THEN
    DROP POLICY IF EXISTS "Users can view their own agenda categories" ON agenda_categories;
    DROP POLICY IF EXISTS "Users can insert their own agenda categories" ON agenda_categories;
    DROP POLICY IF EXISTS "Users can update their own agenda categories" ON agenda_categories;
    DROP POLICY IF EXISTS "Users can delete their own agenda categories" ON agenda_categories;

    CREATE POLICY "Users can manage workspace agenda categories"
      ON agenda_categories FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_tags') THEN
    DROP POLICY IF EXISTS "Users can view their own agenda tags" ON agenda_tags;
    DROP POLICY IF EXISTS "Users can insert their own agenda tags" ON agenda_tags;
    DROP POLICY IF EXISTS "Users can update their own agenda tags" ON agenda_tags;
    DROP POLICY IF EXISTS "Users can delete their own agenda tags" ON agenda_tags;

    CREATE POLICY "Users can manage workspace agenda tags"
      ON agenda_tags FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- ATIVIDADES
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
    DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;

    CREATE POLICY "Users can view workspace activities"
      ON activities FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can insert workspace activities"
      ON activities FOR INSERT
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- MENSAGENS & CONFIGURAÇÕES
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
    DROP POLICY IF EXISTS "Users can view their own messages" ON whatsapp_messages;
    DROP POLICY IF EXISTS "Users can insert their own messages" ON whatsapp_messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON whatsapp_messages;

    CREATE POLICY "Users can view workspace messages"
      ON whatsapp_messages FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can insert workspace messages"
      ON whatsapp_messages FOR INSERT
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

    CREATE POLICY "Users can update workspace messages"
      ON whatsapp_messages FOR UPDATE
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- WhatsApp Config
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_config') THEN
    DROP POLICY IF EXISTS "Users can view their own config" ON whatsapp_config;
    DROP POLICY IF EXISTS "Users can insert their own config" ON whatsapp_config;
    DROP POLICY IF EXISTS "Users can update their own config" ON whatsapp_config;

    CREATE POLICY "Users can manage workspace whatsapp config"
      ON whatsapp_config FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- Profile Settings
DROP POLICY IF EXISTS "Users can view their own profile settings" ON profile_settings;
DROP POLICY IF EXISTS "Users can insert their own profile settings" ON profile_settings;
DROP POLICY IF EXISTS "Users can update their own profile settings" ON profile_settings;

CREATE POLICY "Users can view workspace profile settings"
  ON profile_settings FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()) OR custom_url_slug IS NOT NULL);

CREATE POLICY "Users can insert workspace profile settings"
  ON profile_settings FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update workspace profile settings"
  ON profile_settings FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
