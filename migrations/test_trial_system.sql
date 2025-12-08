-- =====================================================
-- SCRIPT DE TESTE - SISTEMA DE TRIAL
-- =====================================================
-- Este script configura o trial para o usuário de teste
-- Email: jaisson@virtualbrand.com.br

-- 1. Verificar se o usuário existe
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.trial_start_date,
  p.trial_end_date,
  p.is_trial_active,
  p.subscription_status,
  get_trial_days_remaining(p.id) as dias_restantes
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'jaisson@virtualbrand.com.br';

-- 2. Configurar trial de 4 dias para testes (para ver alerta de "4 dias restantes")
UPDATE profiles
SET 
  trial_start_date = NOW(),
  trial_end_date = NOW() + INTERVAL '4 days',
  is_trial_active = true,
  subscription_status = NULL
WHERE id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');

-- 3. Verificar configuração aplicada
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.trial_start_date,
  p.trial_end_date,
  p.is_trial_active,
  get_trial_days_remaining(p.id) as dias_restantes,
  CEIL(EXTRACT(EPOCH FROM (p.trial_end_date - NOW())) / 86400) as dias_calculados
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'jaisson@virtualbrand.com.br';

-- 4. Verificar alertas ativos para este usuário
SELECT 
  alert_type,
  title,
  message,
  priority,
  days_remaining,
  shown_recently
FROM user_active_alerts
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');

-- =====================================================
-- CENÁRIOS DE TESTE
-- =====================================================

-- CENÁRIO 1: Ver alerta de "4 dias restantes"
-- (já configurado acima)

-- CENÁRIO 2: Ver alerta de "3 dias restantes"
/*
UPDATE profiles
SET 
  trial_start_date = NOW(),
  trial_end_date = NOW() + INTERVAL '3 days',
  is_trial_active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');
*/

-- CENÁRIO 3: Ver alerta de "1 dia restante" (crítico)
/*
UPDATE profiles
SET 
  trial_start_date = NOW(),
  trial_end_date = NOW() + INTERVAL '1 day',
  is_trial_active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');
*/

-- CENÁRIO 4: Ver alerta de "trial expirado"
/*
UPDATE profiles
SET 
  trial_start_date = NOW() - INTERVAL '8 days',
  trial_end_date = NOW() - INTERVAL '1 day',
  is_trial_active = false,
  subscription_status = NULL
WHERE id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');
*/

-- CENÁRIO 5: Limpar trial (usuário com assinatura ativa)
/*
UPDATE profiles
SET 
  is_trial_active = false,
  subscription_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');
*/

-- =====================================================
-- COMANDOS ÚTEIS PARA TESTES
-- =====================================================

-- Ver todos os alertas cadastrados no sistema
SELECT 
  alert_type,
  title,
  trigger_days,
  priority,
  is_active
FROM trial_alerts
ORDER BY priority DESC, trigger_days DESC;

-- Ver histórico de alertas exibidos
SELECT 
  ah.shown_at,
  ah.dismissed_at,
  ah.action_taken,
  ta.title,
  ta.alert_type
FROM alert_history ah
JOIN trial_alerts ta ON ta.id = ah.alert_id
WHERE ah.user_id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br')
ORDER BY ah.shown_at DESC;

-- Limpar histórico de alertas (para testar novamente)
/*
DELETE FROM alert_history
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');
*/

-- Verificar configurações do sistema
SELECT * FROM system_settings;
