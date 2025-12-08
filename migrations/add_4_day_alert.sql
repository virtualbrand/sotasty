-- Adicionar alerta para 4 dias (para testes)
INSERT INTO trial_alerts (alert_type, title, message, trigger_days, priority, show_cta, cta_text, background_color, text_color, icon, applies_to)
VALUES 
  (
    'trial_ending', 
    'Seu período de teste está acabando!', 
    'Faltam {days} dias para o fim do seu trial. Assine agora para continuar usando todas as funcionalidades.', 
    4,  -- ADICIONAR ALERTA PARA 4 DIAS
    'high', 
    true, 
    'Ver planos', 
    '#FEF3C7', 
    '#92400E', 
    'clock',
    'trial'
  )
ON CONFLICT DO NOTHING;

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

-- Testar se agora aparece o alerta
SELECT 
  alert_type,
  title,
  message,
  days_remaining,
  trigger_days
FROM user_active_alerts
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jaisson@virtualbrand.com.br');
