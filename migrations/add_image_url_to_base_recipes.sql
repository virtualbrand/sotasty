-- Adiciona coluna image_url para bases de preparo
ALTER TABLE base_recipes ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN base_recipes.image_url IS 'URL da foto da base de preparo (base64 ou URL externa)';
