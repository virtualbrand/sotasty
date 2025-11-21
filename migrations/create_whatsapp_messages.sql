-- Criar tabela para armazenar mensagens do WhatsApp
-- Necessária para API Oficial que não fornece histórico
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT, -- 'image', 'audio', 'video', 'document'
  from_me BOOLEAN NOT NULL DEFAULT false,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
  read BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON whatsapp_messages(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_read ON whatsapp_messages(user_id, read) WHERE read = false;

-- RLS Policies
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias mensagens
CREATE POLICY "Usuários podem ver suas próprias mensagens"
  ON whatsapp_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias mensagens
CREATE POLICY "Usuários podem inserir suas próprias mensagens"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias mensagens
CREATE POLICY "Usuários podem atualizar suas próprias mensagens"
  ON whatsapp_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias mensagens
CREATE POLICY "Usuários podem deletar suas próprias mensagens"
  ON whatsapp_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_messages_updated_at_trigger
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_messages_updated_at();
