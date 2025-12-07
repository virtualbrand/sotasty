-- Adiciona campo file_id para rastrear arquivos do OpenAI
ALTER TABLE assistant_contexts 
ADD COLUMN IF NOT EXISTS file_id TEXT;

-- Comentário explicativo
COMMENT ON COLUMN assistant_contexts.file_id IS 'ID do arquivo no OpenAI Vector Store (quando o contexto também é salvo como arquivo)';
