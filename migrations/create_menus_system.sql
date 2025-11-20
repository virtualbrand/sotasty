-- =====================================================
-- SISTEMA DE CARDÁPIOS COM URL PERSONALIZADA
-- =====================================================

-- Tabela de configurações do perfil (para URL personalizada)
CREATE TABLE IF NOT EXISTS profile_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  business_name TEXT,
  custom_url_slug TEXT UNIQUE, -- Ex: "conto-atelier"
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  description TEXT,
  whatsapp_number TEXT,
  instagram_handle TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT custom_url_slug_format CHECK (custom_url_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Tabela de Cardápios
CREATE TABLE IF NOT EXISTS menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url_slug TEXT NOT NULL, -- Ex: "cardapio-bolos"
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, url_slug),
  CONSTRAINT url_slug_format CHECK (url_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Tabela de Itens do Cardápio
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES final_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Categorias de Cardápio (opcional)
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(menu_id, name)
);

-- Tabela de Visualizações de Cardápio (analytics)
CREATE TABLE IF NOT EXISTS menu_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_menus_user_id ON menus(user_id);
CREATE INDEX IF NOT EXISTS idx_menus_url_slug ON menus(url_slug);
CREATE INDEX IF NOT EXISTS idx_menus_active ON menus(active);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_product_id ON menu_items(product_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_display_order ON menu_items(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON menu_categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_views_menu_id ON menu_views(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_views_viewed_at ON menu_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_settings_user_id ON profile_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_settings_custom_url_slug ON profile_settings(custom_url_slug);

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_profile_settings_updated_at ON profile_settings;
CREATE TRIGGER update_profile_settings_updated_at 
  BEFORE UPDATE ON profile_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;
CREATE TRIGGER update_menus_updated_at 
  BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at 
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_views ENABLE ROW LEVEL SECURITY;

-- Políticas para profile_settings
DROP POLICY IF EXISTS "Users can view their own profile settings" ON profile_settings;
CREATE POLICY "Users can view their own profile settings"
  ON profile_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile settings" ON profile_settings;
CREATE POLICY "Users can insert their own profile settings"
  ON profile_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile settings" ON profile_settings;
CREATE POLICY "Users can update their own profile settings"
  ON profile_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para menus
DROP POLICY IF EXISTS "Users can view their own menus" ON menus;
CREATE POLICY "Users can view their own menus"
  ON menus FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own menus" ON menus;
CREATE POLICY "Users can insert their own menus"
  ON menus FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own menus" ON menus;
CREATE POLICY "Users can update their own menus"
  ON menus FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own menus" ON menus;
CREATE POLICY "Users can delete their own menus"
  ON menus FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para menu_items
DROP POLICY IF EXISTS "Users can view items from their own menus" ON menu_items;
CREATE POLICY "Users can view items from their own menus"
  ON menu_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM menus
    WHERE menus.id = menu_items.menu_id
    AND menus.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert items to their own menus" ON menu_items;
CREATE POLICY "Users can insert items to their own menus"
  ON menu_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM menus
    WHERE menus.id = menu_items.menu_id
    AND menus.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update items from their own menus" ON menu_items;
CREATE POLICY "Users can update items from their own menus"
  ON menu_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM menus
    WHERE menus.id = menu_items.menu_id
    AND menus.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete items from their own menus" ON menu_items;
CREATE POLICY "Users can delete items from their own menus"
  ON menu_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM menus
    WHERE menus.id = menu_items.menu_id
    AND menus.user_id = auth.uid()
  ));

-- Políticas para menu_categories
DROP POLICY IF EXISTS "Users can manage categories from their own menus" ON menu_categories;
CREATE POLICY "Users can manage categories from their own menus"
  ON menu_categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM menus
    WHERE menus.id = menu_categories.menu_id
    AND menus.user_id = auth.uid()
  ));

-- Políticas para visualizações públicas (sem autenticação)
DROP POLICY IF EXISTS "Anyone can view public menus" ON menus;
CREATE POLICY "Anyone can view public menus"
  ON menus FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Anyone can view items from public menus" ON menu_items;
CREATE POLICY "Anyone can view items from public menus"
  ON menu_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM menus
    WHERE menus.id = menu_items.menu_id
    AND menus.active = true
  ));

DROP POLICY IF EXISTS "Anyone can insert menu views" ON menu_views;
CREATE POLICY "Anyone can insert menu views"
  ON menu_views FOR INSERT
  WITH CHECK (true);

-- Política para visualizar profile_settings públicos
DROP POLICY IF EXISTS "Anyone can view public profile settings by custom_url_slug" ON profile_settings;
CREATE POLICY "Anyone can view public profile settings by custom_url_slug"
  ON profile_settings FOR SELECT
  USING (custom_url_slug IS NOT NULL);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar slug único a partir do nome
CREATE OR REPLACE FUNCTION generate_unique_slug(
  p_name TEXT,
  p_user_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
  v_counter INTEGER := 0;
  v_temp_slug TEXT;
BEGIN
  -- Converte o nome para slug: minúsculas, remove acentos, substitui espaços por hífens
  v_slug := lower(trim(p_name));
  v_slug := regexp_replace(v_slug, '[^a-z0-9\s-]', '', 'g');
  v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_temp_slug := v_slug;
  
  -- Verifica se o slug já existe e adiciona número se necessário
  WHILE EXISTS (
    SELECT 1 FROM menus 
    WHERE url_slug = v_temp_slug 
    AND user_id = p_user_id
  ) LOOP
    v_counter := v_counter + 1;
    v_temp_slug := v_slug || '-' || v_counter;
  END LOOP;
  
  RETURN v_temp_slug;
END;
$$ LANGUAGE plpgsql;

-- Função para obter cardápio público por URL completa
CREATE OR REPLACE FUNCTION get_public_menu(
  p_custom_url_slug TEXT,
  p_menu_url_slug TEXT
) RETURNS TABLE (
  menu_id UUID,
  menu_name TEXT,
  menu_description TEXT,
  menu_active BOOLEAN,
  business_name TEXT,
  business_description TEXT,
  business_logo TEXT,
  business_whatsapp TEXT,
  business_instagram TEXT,
  primary_color TEXT,
  secondary_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.description,
    m.active,
    ps.business_name,
    ps.description,
    ps.logo_url,
    ps.whatsapp_number,
    ps.instagram_handle,
    ps.primary_color,
    ps.secondary_color
  FROM menus m
  INNER JOIN profile_settings ps ON ps.user_id = m.user_id
  WHERE ps.custom_url_slug = p_custom_url_slug
    AND m.url_slug = p_menu_url_slug
    AND m.active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários nas tabelas
COMMENT ON TABLE profile_settings IS 'Configurações do perfil do usuário incluindo URL personalizada para cardápios públicos';
COMMENT ON TABLE menus IS 'Cardápios criados pelos usuários com URLs personalizadas';
COMMENT ON TABLE menu_items IS 'Itens/produtos dentro de cada cardápio';
COMMENT ON TABLE menu_categories IS 'Categorias para organizar itens do cardápio';
COMMENT ON TABLE menu_views IS 'Analytics de visualizações dos cardápios públicos';
COMMENT ON COLUMN profile_settings.custom_url_slug IS 'URL personalizada do negócio (ex: conto-atelier)';
COMMENT ON COLUMN menus.url_slug IS 'URL do cardápio (ex: cardapio-bolos)';
