-- =====================================================
-- CRON JOB PARA ATUALIZAR TRIAL_DAYS DIARIAMENTE
-- =====================================================
-- Este job atualiza o countdown de trial_days para todos os usuários
-- Execute este comando para configurar o cron job no Supabase

-- Habilitar extensão pg_cron (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar job para rodar diariamente à meia-noite (UTC)
SELECT cron.schedule(
  'update-trial-countdown',     -- Nome do job
  '0 0 * * *',                   -- Cron schedule: meia-noite todos os dias
  $$
  -- Atualizar trial_days com base no tempo restante
  UPDATE profiles
  SET trial_days = GREATEST(0, CEIL(EXTRACT(EPOCH FROM (trial_end_date - NOW())) / 86400)::INTEGER)
  WHERE is_trial_active = true 
    AND trial_end_date IS NOT NULL;
  
  -- Desativar trials expirados
  UPDATE profiles
  SET 
    is_trial_active = false,
    trial_days = 0
  WHERE trial_end_date < NOW() 
    AND is_trial_active = true;
  $$
);

-- Ver jobs agendados
SELECT * FROM cron.job;

-- Desabilitar job (se necessário)
-- SELECT cron.unschedule('update-trial-countdown');

-- Executar manualmente para testar
-- SELECT update_trial_days_countdown();

-- =====================================================
-- ALTERNATIVA: View materializada com refresh automático
-- =====================================================
-- Se pg_cron não estiver disponível, use uma view materializada

CREATE MATERIALIZED VIEW IF NOT EXISTS profiles_with_trial_countdown AS
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.workspace_id,
  p.trial_start_date,
  p.trial_end_date,
  p.is_trial_active,
  p.subscription_status,
  CASE 
    WHEN p.trial_end_date IS NULL THEN 0
    WHEN p.trial_end_date < NOW() THEN 0
    ELSE CEIL(EXTRACT(EPOCH FROM (p.trial_end_date - NOW())) / 86400)::INTEGER
  END as trial_days_remaining,
  p.created_at,
  p.updated_at
FROM profiles p;

-- Criar índice único para refresh concurrent
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_trial_countdown_id 
  ON profiles_with_trial_countdown(id);

-- Agendar refresh da view (requer pg_cron)
SELECT cron.schedule(
  'refresh-trial-countdown-view',
  '*/5 * * * *',  -- A cada 5 minutos
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY profiles_with_trial_countdown;$$
);

-- Refresh manual
-- REFRESH MATERIALIZED VIEW CONCURRENTLY profiles_with_trial_countdown;

-- =====================================================
-- ALTERNATIVA 3: Computed column via trigger
-- =====================================================
-- Atualizar trial_days sempre que o perfil for lido/atualizado

-- Esta função já foi criada no arquivo principal
-- Ela atualiza trial_days automaticamente em cada UPDATE
