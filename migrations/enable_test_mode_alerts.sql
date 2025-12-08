-- =====================================================
-- CONFIGURAR MODO DE TESTE (ALERTAS SEMPRE VISÍVEIS)
-- =====================================================
-- Execute este arquivo para ver alertas em cada refresh

-- Atualizar view para considerar apenas último 1 minuto (ao invés de 24h)
DROP VIEW IF EXISTS user_active_alerts;

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
  -- MODO TESTE: verificar apenas último 1 minuto
  EXISTS (
    SELECT 1 FROM alert_history ah
    WHERE ah.user_id = p.id 
      AND ah.alert_id = ta.id
      AND ah.shown_at > NOW() - INTERVAL '1 minute'
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

-- Limpar histórico de alertas para forçar exibição
DELETE FROM alert_history 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');

-- Verificar se há alertas disponíveis
SELECT 
  user_id,
  alert_type,
  title,
  message,
  days_remaining,
  shown_recently
FROM user_active_alerts
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');

-- =====================================================
-- PARA VOLTAR AO MODO PRODUÇÃO (2x ao dia = 12 horas)
-- =====================================================
/*
DROP VIEW IF EXISTS user_active_alerts;

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
  -- PRODUÇÃO: 12 horas (2x ao dia)
  EXISTS (
    SELECT 1 FROM alert_history ah
    WHERE ah.user_id = p.id 
      AND ah.alert_id = ta.id
      AND ah.shown_at > NOW() - INTERVAL '12 hours'
  ) as shown_recently
FROM profiles p
JOIN trial_alerts ta ON ta.is_active = true
WHERE 
  p.trial_end_date IS NOT NULL
  AND (
    (ta.alert_type = 'trial_ending' 
     AND p.is_trial_active = true
     AND get_trial_days_remaining(p.id) <= ta.trigger_days
     AND get_trial_days_remaining(p.id) > 0)
    OR (ta.alert_type = 'trial_expired' 
        AND get_trial_days_remaining(p.id) = 0
        AND (p.subscription_status IS NULL OR p.subscription_status NOT IN ('active', 'trialing')))
    OR (ta.alert_type IN ('custom', 'feature_promotion')
        AND (ta.start_date IS NULL OR ta.start_date <= NOW())
        AND (ta.end_date IS NULL OR ta.end_date >= NOW()))
  )
  AND (
    ta.applies_to = 'all'
    OR (ta.applies_to = 'trial' AND p.is_trial_active = true)
    OR (ta.applies_to = 'specific_users' AND ta.target_user_ids ? p.id::TEXT)
  );
*/
