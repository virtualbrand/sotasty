-- Tabela para armazenar eventos de analytics customizados
-- Útil para dados que você quer guardar no seu próprio banco
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_properties JSONB,
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Tabela para rastrear tempo de sessão
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  pages_visited INTEGER DEFAULT 0,
  actions_performed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at DESC);

-- Tabela para rastrear uso de features
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_name)
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON feature_usage(feature_name);

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- SuperAdmin pode ver tudo
CREATE POLICY "SuperAdmin can view all analytics_events"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "SuperAdmin can view all user_sessions"
  ON user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "SuperAdmin can view all feature_usage"
  ON feature_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Usuários podem inserir seus próprios eventos
CREATE POLICY "Users can insert their own analytics_events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own user_sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature_usage"
  ON feature_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
