-- Tabela para armazenar contextos de texto para o assistente
CREATE TABLE IF NOT EXISTS assistant_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_assistant_contexts_user_id ON assistant_contexts(user_id);

-- RLS (Row Level Security)
ALTER TABLE assistant_contexts ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios contextos
CREATE POLICY "Users can view their own contexts"
  ON assistant_contexts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem criar seus próprios contextos
CREATE POLICY "Users can create their own contexts"
  ON assistant_contexts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seus próprios contextos
CREATE POLICY "Users can update their own contexts"
  ON assistant_contexts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar seus próprios contextos
CREATE POLICY "Users can delete their own contexts"
  ON assistant_contexts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assistant_contexts_updated_at
  BEFORE UPDATE ON assistant_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
