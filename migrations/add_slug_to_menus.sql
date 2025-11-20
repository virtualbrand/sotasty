-- Adicionar campo slug aos menus para URLs amigáveis

DO $$ 
BEGIN
  -- Adicionar slug se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menus' AND column_name = 'slug'
  ) THEN
    ALTER TABLE menus ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Índice para busca rápida por slug
CREATE INDEX IF NOT EXISTS idx_menus_slug ON menus(slug);

-- Comentário
COMMENT ON COLUMN menus.slug IS 'Slug amigável para URL do menu (ex: cardapio-principal)';
