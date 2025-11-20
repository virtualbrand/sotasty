-- Adicionar campo de domínio personalizado
-- ATENÇÃO: Execute primeiro a migração create_menus_system.sql

-- Verificar se a tabela existe antes de adicionar colunas
DO $$ 
BEGIN
  -- Adicionar custom_domain se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_settings' AND column_name = 'custom_domain'
  ) THEN
    ALTER TABLE profile_settings ADD COLUMN custom_domain TEXT UNIQUE;
  END IF;

  -- Adicionar custom_domain_verified se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_settings' AND column_name = 'custom_domain_verified'
  ) THEN
    ALTER TABLE profile_settings ADD COLUMN custom_domain_verified BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar custom_domain_verified_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_settings' AND column_name = 'custom_domain_verified_at'
  ) THEN
    ALTER TABLE profile_settings ADD COLUMN custom_domain_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Índice para busca rápida por domínio
CREATE INDEX IF NOT EXISTS idx_profile_settings_custom_domain ON profile_settings(custom_domain);

-- Comentários
COMMENT ON COLUMN profile_settings.custom_domain IS 'Domínio personalizado do cliente (ex: cardapios.minhaconfeitaria.com.br)';
COMMENT ON COLUMN profile_settings.custom_domain_verified IS 'Indica se o domínio foi verificado via DNS';
COMMENT ON COLUMN profile_settings.custom_domain_verified_at IS 'Data e hora da verificação do domínio';

-- Constraint para validar formato do domínio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'custom_domain_format'
  ) THEN
    ALTER TABLE profile_settings 
    ADD CONSTRAINT custom_domain_format CHECK (
      custom_domain IS NULL OR 
      custom_domain ~ '^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$'
    );
  END IF;
END $$;

