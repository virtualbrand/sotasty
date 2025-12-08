-- =====================================================
-- TESTAR BLOQUEIO POR TRIAL EXPIRADO
-- =====================================================

-- Expirar o trial do usuário (1 dia após término)
UPDATE profiles
SET 
  trial_end_date = NOW() - INTERVAL '2 days',
  is_trial_active = false,
  subscription_status = 'trial'
WHERE id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');

-- Verificar status
SELECT 
  u.email,
  p.trial_end_date,
  p.is_trial_active,
  p.subscription_status,
  CEIL(EXTRACT(EPOCH FROM (NOW() - p.trial_end_date)) / 86400) as dias_apos_expiracao
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'jaisson@virtualbrand.com.br';
