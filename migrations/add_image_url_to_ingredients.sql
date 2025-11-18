-- Adiciona coluna image_url para ingredientes e materiais
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN ingredients.image_url IS 'URL da foto do insumo (base64 ou URL externa)';
