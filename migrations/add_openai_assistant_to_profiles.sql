-- Adiciona campo para armazenar o Vector Store ID de cada cliente
-- Cada cliente tem seu próprio Vector Store para isolamento de dados
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS openai_vector_store_id TEXT,
ADD COLUMN IF NOT EXISTS vector_store_created_at TIMESTAMP WITH TIME ZONE;

-- Índice para buscar por vector_store_id
CREATE INDEX IF NOT EXISTS idx_profiles_vector_store_id ON profiles(openai_vector_store_id);

-- Comentários
COMMENT ON COLUMN profiles.openai_vector_store_id IS 'ID do Vector Store exclusivo deste cliente para base de conhecimento';
COMMENT ON COLUMN profiles.vector_store_created_at IS 'Data de criação do Vector Store';
