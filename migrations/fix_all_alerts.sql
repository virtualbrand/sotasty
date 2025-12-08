-- =====================================================
-- ADICIONAR ALERTAS PARA TODOS OS DIAS (4, 3, 2, 1)
-- =====================================================

-- Primeiro, limpar alertas duplicados ou antigos
DELETE FROM trial_alerts 
WHERE alert_type = 'trial_ending';

-- Inserir alertas para cada dia
INSERT INTO trial_alerts (alert_type, title, message, trigger_days, priority, show_cta, cta_text, cta_link, background_color, text_color, icon, applies_to)
VALUES 
  -- 4 DIAS
  (
    'trial_ending', 
    'Seu período de teste está acabando!', 
    'Faltam {days} dias para o fim do seu teste. Assine agora para continuar usando todas as funcionalidades.', 
    4,
    'medium', 
    true, 
    'Ver planos',
    '/settings/plans',
    '#FFFBEB', 
    '#92400E', 
    'clock',
    'trial'
  ),
  -- 3 DIAS
  (
    'trial_ending', 
    'Seu período de teste está acabando!', 
    'Faltam {days} dias para o fim do seu teste. Assine agora para continuar usando todas as funcionalidades.', 
    3,
    'high', 
    true, 
    'Ver planos',
    '/settings/plans',
    '#FFFBEB', 
    '#92400E', 
    'clock',
    'trial'
  ),
  -- 2 DIAS
  (
    'trial_ending', 
    'Atenção: Teste terminando em breve!', 
    'Faltam apenas {days} dias! Não perca acesso às suas receitas e pedidos.', 
    2,
    'high', 
    true, 
    'Assinar agora',
    '/settings/plans',
    '#FEF2F2', 
    '#991B1B', 
    'alert-circle',
    'trial'
  ),
  -- 1 DIA
  (
    'trial_ending', 
    'Último dia de teste!', 
    'Hoje é o último dia do seu período de teste. Não perca acesso!', 
    1,
    'critical', 
    true, 
    'Assinar agora',
    '/settings/plans',
    '#FEF2F2', 
    '#991B1B', 
    'alert-triangle',
    'trial'
  );

-- Verificar alertas cadastrados
SELECT 
  id,
  alert_type,
  title,
  trigger_days,
  priority,
  is_active
FROM trial_alerts
WHERE is_active = true
ORDER BY trigger_days DESC;

-- Limpar histórico para forçar exibição
DELETE FROM alert_history 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');

-- Ajustar trial para 1 dia restante (para testar alerta de último dia)
UPDATE profiles
SET trial_end_date = NOW() + INTERVAL '1 day'
WHERE id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');

-- Verificar que agora retorna alertas
SELECT 
  alert_type,
  title,
  message,
  days_remaining,
  priority,
  shown_recently
FROM user_active_alerts
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br')
ORDER BY priority DESC, days_remaining DESC;
