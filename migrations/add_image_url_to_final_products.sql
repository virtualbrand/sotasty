-- Adiciona coluna image_url à tabela final_products
ALTER TABLE final_products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Adiciona comentário para documentar o campo
COMMENT ON COLUMN final_products.image_url IS 'URL da imagem do produto (pode ser base64 ou URL externa)';
