-- Criar tabela de preferências individuais por usuário
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Preferências de Interface
  menu_position TEXT DEFAULT 'sidebar' CHECK (menu_position IN ('sidebar', 'header', 'footer', 'right')),
  
  -- Preferências de Notificações
  notification_settings JSONB DEFAULT '{}'::jsonb,
  
  -- Preferências de Pedidos
  orders_default_view TEXT DEFAULT 'list' CHECK (orders_default_view IN ('list', 'day', 'week', 'month')),
  orders_date_format TEXT DEFAULT 'short' CHECK (orders_date_format IN ('short', 'numeric', 'long')),
  
  -- Preferências de Agenda
  agenda_default_view TEXT DEFAULT 'list' CHECK (agenda_default_view IN ('list', 'kanban', 'day', 'week', 'month')),
  agenda_date_format TEXT DEFAULT 'short' CHECK (agenda_date_format IN ('short', 'numeric', 'long')),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

-- Usuários podem ver apenas suas próprias preferências
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias preferências
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias preferências
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_preferences_timestamp ON user_preferences;

CREATE TRIGGER update_user_preferences_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Comentários
COMMENT ON TABLE user_preferences IS 'Preferências individuais de cada usuário para interface e visualizações';
COMMENT ON COLUMN user_preferences.menu_position IS 'Posição preferida do menu de navegação';
COMMENT ON COLUMN user_preferences.notification_settings IS 'Configurações de notificações (email, push, etc)';
COMMENT ON COLUMN user_preferences.orders_default_view IS 'Visualização padrão da página de pedidos';
COMMENT ON COLUMN user_preferences.orders_date_format IS 'Formato de data preferido para pedidos';
COMMENT ON COLUMN user_preferences.agenda_default_view IS 'Visualização padrão da página de agenda';
COMMENT ON COLUMN user_preferences.agenda_date_format IS 'Formato de data preferido para agenda';
