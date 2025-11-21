-- Criar tabela de configuração do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_method TEXT NOT NULL CHECK (auth_method IN ('evolution', 'official')),
  
  -- Campos para Evolution API
  instance_name TEXT,
  
  -- Campos para API Oficial
  phone_number_id TEXT,
  access_token TEXT,
  business_account_id TEXT,
  
  -- Status
  connected BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint por usuário
  UNIQUE(user_id)
);

-- Index para busca por user_id
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_user_id ON whatsapp_config(user_id);

-- RLS Policies
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Policy para usuários lerem apenas suas próprias configs
CREATE POLICY "Users can read own whatsapp config"
  ON whatsapp_config
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy para usuários criarem suas próprias configs
CREATE POLICY "Users can insert own whatsapp config"
  ON whatsapp_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy para usuários atualizarem suas próprias configs
CREATE POLICY "Users can update own whatsapp config"
  ON whatsapp_config
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy para usuários deletarem suas próprias configs
CREATE POLICY "Users can delete own whatsapp config"
  ON whatsapp_config
  FOR DELETE
  USING (auth.uid() = user_id);
