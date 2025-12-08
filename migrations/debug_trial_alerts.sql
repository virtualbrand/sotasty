-- =====================================================
-- DEBUG: VERIFICAR SISTEMA DE ALERTAS
-- =====================================================

-- 1. Verificar se o usuário tem trial configurado
SELECT 
  p.id,
  u.email,
  p.trial_start_date,
  p.trial_end_date,
  p.is_trial_active,
  p.subscription_status,
  get_trial_days_remaining(p.id) as dias_restantes_calculados,
  CEIL(EXTRACT(EPOCH FROM (p.trial_end_date - NOW())) / 86400) as dias_manual
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'jaisson@virtualbrand.com.br';

-- 2. Verificar se existem alertas cadastrados
SELECT 
  id,
  alert_type,
  title,
  trigger_days,
  priority,
  is_active,
  applies_to
FROM trial_alerts
WHERE is_active = true
ORDER BY alert_type, trigger_days;

-- 3. Testar a função get_trial_days_remaining diretamente
SELECT get_trial_days_remaining(
  (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br')
) as dias_restantes;

-- 4. Verificar condições da view manualmente
SELECT 
  p.id as user_id,
  p.trial_end_date,
  p.is_trial_active,
  get_trial_days_remaining(p.id) as days_remaining,
  ta.id as alert_id,
  ta.alert_type,
  ta.title,
  ta.trigger_days,
  ta.applies_to,
  -- Condições individuais para debug
  CASE 
    WHEN ta.alert_type = 'trial_ending' 
         AND p.is_trial_active = true
         AND get_trial_days_remaining(p.id) <= ta.trigger_days
         AND get_trial_days_remaining(p.id) > 0
    THEN 'MATCH: trial_ending'
    WHEN ta.alert_type = 'trial_expired' 
         AND get_trial_days_remaining(p.id) = 0
    THEN 'MATCH: trial_expired'
    ELSE 'NO MATCH'
  END as match_reason
FROM profiles p
JOIN auth.users u ON u.id = p.id
CROSS JOIN trial_alerts ta
WHERE u.email = 'jaisson@virtualbrand.com.br'
  AND ta.is_active = true
  AND p.trial_end_date IS NOT NULL
ORDER BY ta.trigger_days DESC;

-- 5. Verificar se há registros na alert_history
SELECT 
  ah.id,
  ah.shown_at,
  ah.dismissed_at,
  ta.title,
  ta.alert_type,
  NOW() - ah.shown_at as tempo_desde_exibicao
FROM alert_history ah
JOIN trial_alerts ta ON ta.id = ah.alert_id
WHERE ah.user_id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br')
ORDER BY ah.shown_at DESC
LIMIT 5;
