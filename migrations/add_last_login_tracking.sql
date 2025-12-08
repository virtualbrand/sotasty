-- Adicionar campo last_login à tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Criar índice para otimizar queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login);

-- Criar função para atualizar last_login automaticamente
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar last_login para o timestamp atual
  NEW.last_login = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que atualiza last_login em cada update do perfil
DROP TRIGGER IF EXISTS trigger_update_last_login ON profiles;
CREATE TRIGGER trigger_update_last_login
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();

-- Inicializar last_login com created_at para registros existentes
UPDATE profiles 
SET last_login = created_at 
WHERE last_login IS NULL;
