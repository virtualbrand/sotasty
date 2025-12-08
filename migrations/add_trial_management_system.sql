-- =====================================================
-- SISTEMA DE GERENCIAMENTO DE TRIAL CONFIGURÁVEL
-- =====================================================
-- Este arquivo cria a estrutura para gerenciar períodos de trial
-- e alertas customizados para usuários em período de teste.

-- 1. Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão de dias de trial (7 dias)
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('default_trial_days', '{"days": 7}', 'Número padrão de dias de trial para novos usuários'),
  ('trial_alert_thresholds', '{"warning_days": [4, 3, 1], "critical_days": [1]}', 'Dias antes do fim do trial para mostrar alertas')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Adicionar campos de trial à tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT false;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON profiles(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_is_trial_active ON profiles(is_trial_active);

-- 3. Criar tabela de alertas/banners customizados
CREATE TABLE IF NOT EXISTS trial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('trial_ending', 'trial_expired', 'custom', 'feature_promotion')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  trigger_days INTEGER, -- Dias antes do fim do trial (null para custom)
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  show_cta BOOLEAN DEFAULT true,
  cta_text TEXT DEFAULT 'Assinar agora',
  cta_link TEXT DEFAULT '/settings/plans',
  background_color TEXT DEFAULT '#FEF3C7',
  text_color TEXT DEFAULT '#92400E',
  icon TEXT DEFAULT 'alert-circle',
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'trial', 'specific_users')),
  target_user_ids JSONB, -- Array de user IDs para applies_to='specific_users'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir alertas padrão
INSERT INTO trial_alerts (alert_type, title, message, trigger_days, priority, show_cta, cta_text, background_color, text_color, icon, applies_to)
VALUES 
  (
    'trial_ending', 
    'Seu período de teste está acabando!', 
    'Faltam {days} dias para o fim do seu trial. Assine agora para continuar usando todas as funcionalidades.', 
    3, 
    'high', 
    true, 
    'Ver planos', 
    '#FEF3C7', 
    '#92400E', 
    'clock',
    'trial'
  ),
  (
    'trial_ending', 
    'Último dia de trial!', 
    'Hoje é o último dia do seu período de teste. Não perca acesso às suas receitas e pedidos!', 
    1, 
    'critical', 
    true, 
    'Assinar agora', 
    '#FEE2E2', 
    '#991B1B', 
    'alert-triangle',
    'trial'
  ),
  (
    'trial_expired', 
    'Trial expirado', 
    'Seu período de teste terminou. Assine um plano para continuar usando o SoTasty.', 
    NULL, 
    'critical', 
    true, 
    'Ver planos', 
    '#FEE2E2', 
    '#991B1B', 
    'x-circle',
    'trial'
  )
ON CONFLICT DO NOTHING;

-- 4. Criar tabela de histórico de alertas exibidos
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES trial_alerts(id) ON DELETE CASCADE,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT, -- 'clicked_cta', 'dismissed', 'ignored'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON alert_history(alert_id);

-- 5. Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Policies para system_settings (apenas superadmin pode modificar)
CREATE POLICY "Superadmin can view settings"
  ON system_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "Superadmin can update settings"
  ON system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Policies para trial_alerts
CREATE POLICY "Users can view active alerts"
  ON trial_alerts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Superadmin can manage alerts"
  ON trial_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Policies para alert_history
CREATE POLICY "Users can view their own alert history"
  ON alert_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own alert history"
  ON alert_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own alert history"
  ON alert_history FOR UPDATE
  USING (user_id = auth.uid());

-- 6. Função para calcular e atualizar trial_end_date
CREATE OR REPLACE FUNCTION calculate_trial_end_date()
RETURNS TRIGGER AS $$
DECLARE
  default_days INTEGER;
BEGIN
  -- Se trial_start_date foi definido e trial_end_date não foi
  IF NEW.trial_start_date IS NOT NULL AND NEW.trial_end_date IS NULL THEN
    -- Usar trial_days do perfil ou buscar o padrão
    IF NEW.trial_days IS NOT NULL THEN
      NEW.trial_end_date := NEW.trial_start_date + (NEW.trial_days || ' days')::INTERVAL;
    ELSE
      -- Buscar configuração padrão
      SELECT (setting_value->>'days')::INTEGER INTO default_days
      FROM system_settings
      WHERE setting_key = 'default_trial_days';
      
      NEW.trial_days := COALESCE(default_days, 7);
      NEW.trial_end_date := NEW.trial_start_date + (NEW.trial_days || ' days')::INTERVAL;
    END IF;
    
    NEW.is_trial_active := true;
  END IF;
  
  -- Se trial_end_date passou, desativar trial
  IF NEW.trial_end_date IS NOT NULL AND NEW.trial_end_date < NOW() THEN
    NEW.is_trial_active := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular trial_end_date automaticamente
DROP TRIGGER IF EXISTS calculate_trial_dates ON profiles;
CREATE TRIGGER calculate_trial_dates
  BEFORE INSERT OR UPDATE OF trial_start_date, trial_days ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trial_end_date();

-- 7. Função para inicializar trial em novos usuários
CREATE OR REPLACE FUNCTION initialize_trial_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  default_days INTEGER;
BEGIN
  -- Buscar configuração padrão de dias de trial
  SELECT (setting_value->>'days')::INTEGER INTO default_days
  FROM system_settings
  WHERE setting_key = 'default_trial_days';
  
  -- Se o usuário não é superadmin e ainda não tem trial configurado
  IF NEW.role != 'superadmin' AND NEW.trial_start_date IS NULL THEN
    NEW.trial_days := COALESCE(default_days, 7);
    NEW.trial_start_date := NOW();
    NEW.trial_end_date := NOW() + (NEW.trial_days || ' days')::INTERVAL;
    NEW.is_trial_active := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para inicializar trial em novos usuários
DROP TRIGGER IF EXISTS init_trial_on_new_user ON profiles;
CREATE TRIGGER init_trial_on_new_user
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_trial_on_signup();

-- 8. Função helper para obter dias restantes do trial
CREATE OR REPLACE FUNCTION get_trial_days_remaining(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  days_remaining INTEGER;
BEGIN
  SELECT 
    CASE 
      WHEN trial_end_date IS NULL THEN NULL
      WHEN trial_end_date < NOW() THEN 0
      ELSE CEIL(EXTRACT(EPOCH FROM (trial_end_date - NOW())) / 86400)::INTEGER
    END
  INTO days_remaining
  FROM profiles
  WHERE id = user_id;
  
  RETURN days_remaining;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar trial_days como countdown
CREATE OR REPLACE FUNCTION update_trial_days_countdown()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Atualizar trial_days para todos os usuários com trial ativo
  UPDATE profiles
  SET trial_days = GREATEST(0, CEIL(EXTRACT(EPOCH FROM (trial_end_date - NOW())) / 86400)::INTEGER)
  WHERE is_trial_active = true 
    AND trial_end_date IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Desativar trials expirados
  UPDATE profiles
  SET is_trial_active = false
  WHERE trial_end_date < NOW() 
    AND is_trial_active = true;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar trial_days automaticamente quando consultado
CREATE OR REPLACE FUNCTION sync_trial_days_on_read()
RETURNS TRIGGER AS $$
BEGIN
  -- Se tem trial ativo, atualizar trial_days com base no tempo restante
  IF NEW.is_trial_active = true AND NEW.trial_end_date IS NOT NULL THEN
    NEW.trial_days := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (NEW.trial_end_date - NOW())) / 86400)::INTEGER);
    
    -- Se chegou a zero, desativar
    IF NEW.trial_days = 0 AND NEW.trial_end_date < NOW() THEN
      NEW.is_trial_active := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em leituras (SELECT)
DROP TRIGGER IF EXISTS sync_trial_countdown_on_select ON profiles;
CREATE TRIGGER sync_trial_countdown_on_select
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.trial_end_date IS NOT NULL)
  EXECUTE FUNCTION sync_trial_days_on_read();

-- 9. View para alertas ativos por usuário
CREATE OR REPLACE VIEW user_active_alerts AS
SELECT 
  p.id as user_id,
  p.trial_end_date,
  p.is_trial_active,
  get_trial_days_remaining(p.id) as days_remaining,
  ta.id as alert_id,
  ta.alert_type,
  ta.title,
  REPLACE(ta.message, '{days}', get_trial_days_remaining(p.id)::TEXT) as message,
  ta.priority,
  ta.show_cta,
  ta.cta_text,
  ta.cta_link,
  ta.background_color,
  ta.text_color,
  ta.icon,
  -- Verificar se já foi exibido recentemente
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM alert_history ah
      WHERE ah.user_id = p.id 
      AND ah.alert_id = ta.id
      AND ah.shown_at > NOW() - INTERVAL '24 hours'
    ) THEN true
    ELSE false
  END as shown_recently
FROM profiles p
CROSS JOIN trial_alerts ta
WHERE 
  ta.is_active = true
  AND (
    -- Alertas para trial ending
    (ta.alert_type = 'trial_ending' 
     AND p.is_trial_active = true
     AND get_trial_days_remaining(p.id) <= ta.trigger_days)
    OR
    -- Alertas para trial expirado
    (ta.alert_type = 'trial_expired'
     AND p.trial_end_date < NOW()
     AND p.subscription_status IS NULL)
    OR
    -- Alertas customizados
    (ta.alert_type IN ('custom', 'feature_promotion')
     AND (ta.start_date IS NULL OR ta.start_date <= NOW())
     AND (ta.end_date IS NULL OR ta.end_date >= NOW())
     AND (
       ta.applies_to = 'all'
       OR (ta.applies_to = 'trial' AND p.is_trial_active = true)
       OR (ta.applies_to = 'specific_users' AND ta.target_user_ids ? p.id::TEXT)
     ))
  );

-- Comentários das tabelas
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema, incluindo dias de trial padrão';
COMMENT ON TABLE trial_alerts IS 'Alertas e banners customizados para trial e outras campanhas';
COMMENT ON TABLE alert_history IS 'Histórico de alertas exibidos e ações dos usuários';

COMMENT ON COLUMN profiles.trial_days IS 'Contador regressivo de dias de trial (atualizado automaticamente com base em trial_end_date)';
COMMENT ON COLUMN profiles.trial_start_date IS 'Data de início do período de trial';
COMMENT ON COLUMN profiles.trial_end_date IS 'Data de término do período de trial (calculado automaticamente)';
COMMENT ON COLUMN profiles.is_trial_active IS 'Indica se o trial está ativo (atualizado automaticamente)';

-- 10. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trial_alerts_updated_at ON trial_alerts;
CREATE TRIGGER update_trial_alerts_updated_at 
  BEFORE UPDATE ON trial_alerts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
