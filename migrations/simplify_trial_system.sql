-- =====================================================
-- SIMPLIFICAÇÃO DO SISTEMA DE TRIAL
-- =====================================================
-- Usar apenas trial_end_date (fixo) e calcular dias dinamicamente
-- Execute este arquivo APÓS add_trial_management_system.sql

-- 1. Remover coluna trial_days (não é mais necessária)
ALTER TABLE profiles
DROP COLUMN IF EXISTS trial_days CASCADE;

-- 2. Simplificar triggers
DROP TRIGGER IF EXISTS calculate_trial_dates ON profiles;
DROP TRIGGER IF EXISTS sync_trial_countdown_on_select ON profiles;
DROP TRIGGER IF EXISTS check_trial_expiration ON profiles;

CREATE OR REPLACE FUNCTION check_trial_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Se trial passou da data, desativar
  IF NEW.trial_end_date IS NOT NULL AND NEW.trial_end_date < NOW() THEN
    NEW.is_trial_active := false;
  END IF;
  
  -- Se trial_start_date foi definido mas trial_end_date não
  IF NEW.trial_start_date IS NOT NULL AND NEW.trial_end_date IS NULL THEN
    -- Buscar configuração padrão
    SELECT NOW() + ((setting_value->>'days')::INTEGER || ' days')::INTERVAL
    INTO NEW.trial_end_date
    FROM system_settings
    WHERE setting_key = 'default_trial_days';
    
    IF NEW.trial_end_date IS NULL THEN
      NEW.trial_end_date := NOW() + INTERVAL '7 days';
    END IF;
    
    NEW.is_trial_active := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trial_expiration_check
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.trial_end_date IS NOT NULL OR NEW.trial_start_date IS NOT NULL)
  EXECUTE FUNCTION check_trial_expiration();

-- 3. Simplificar função de inicialização
DROP TRIGGER IF EXISTS init_trial_on_new_user ON profiles;

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
    NEW.trial_start_date := NOW();
    NEW.trial_end_date := NOW() + (COALESCE(default_days, 7) || ' days')::INTERVAL;
    NEW.is_trial_active := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER init_trial_on_new_user
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_trial_on_signup();

-- 4. Dropar view primeiro (depende da função)
DROP VIEW IF EXISTS user_active_alerts;

-- 5. Função helper simplificada - calcular dias restantes on-demand
DROP FUNCTION IF EXISTS get_trial_days_remaining(UUID);

CREATE OR REPLACE FUNCTION get_trial_days_remaining(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  end_date TIMESTAMPTZ;
BEGIN
  SELECT trial_end_date INTO end_date
  FROM profiles
  WHERE id = user_id;
  
  IF end_date IS NULL THEN
    RETURN NULL;
  ELSIF end_date < NOW() THEN
    RETURN 0;
  ELSE
    RETURN CEIL(EXTRACT(EPOCH FROM (end_date - NOW())) / 86400)::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Remover funções de countdown (não são mais necessárias)
DROP FUNCTION IF EXISTS update_trial_days_countdown();
DROP FUNCTION IF EXISTS sync_trial_days_on_read();
DROP FUNCTION IF EXISTS calculate_trial_end_date();

-- 7. Recriar view de alertas ativos (agora simplificada)

-- 7. Recriar view de alertas ativos (agora simplificada)
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
  EXISTS (
    SELECT 1 FROM alert_history ah
    WHERE ah.user_id = p.id 
      AND ah.alert_id = ta.id
      AND ah.shown_at > NOW() - INTERVAL '1 minute'  -- TESTE: 1 minuto ao invés de 24 horas
  ) as shown_recently
FROM profiles p
JOIN trial_alerts ta ON ta.is_active = true
WHERE 
  p.trial_end_date IS NOT NULL
  AND (
    -- Alertas de trial ending (baseado em dias restantes calculados)
    (ta.alert_type = 'trial_ending' 
     AND p.is_trial_active = true
     AND get_trial_days_remaining(p.id) <= ta.trigger_days
     AND get_trial_days_remaining(p.id) > 0)
    
    -- Alerta de trial expirado
    OR (ta.alert_type = 'trial_expired' 
        AND get_trial_days_remaining(p.id) = 0
        AND (p.subscription_status IS NULL OR p.subscription_status NOT IN ('active', 'trialing')))
    
    -- Alertas customizados
    OR (ta.alert_type IN ('custom', 'feature_promotion')
        AND (ta.start_date IS NULL OR ta.start_date <= NOW())
        AND (ta.end_date IS NULL OR ta.end_date >= NOW()))
  )
  AND (
    ta.applies_to = 'all'
    OR (ta.applies_to = 'trial' AND p.is_trial_active = true)
    OR (ta.applies_to = 'specific_users' AND ta.target_user_ids ? p.id::TEXT)
  );

-- 8. Adicionar índice para otimização
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_active 
  ON profiles(trial_end_date, is_trial_active) 
  WHERE trial_end_date IS NOT NULL AND is_trial_active = true;

-- 9. Atualizar comentários
COMMENT ON COLUMN profiles.trial_start_date IS 'Data de início do período de trial (fixo)';
COMMENT ON COLUMN profiles.trial_end_date IS 'Data de término do período de trial (fixo - calculado no signup)';
COMMENT ON COLUMN profiles.is_trial_active IS 'Indica se o trial está ativo (atualizado automaticamente quando trial_end_date < NOW)';

-- 10. Verificar integridade dos dados existentes
DO $$
BEGIN
  -- Atualizar is_trial_active para usuários com trial expirado
  UPDATE profiles
  SET is_trial_active = false
  WHERE trial_end_date < NOW() 
    AND is_trial_active = true;
  
  RAISE NOTICE 'Trial system simplification completed successfully!';
END $$;
