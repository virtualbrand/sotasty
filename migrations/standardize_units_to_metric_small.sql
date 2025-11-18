-- Padroniza todas as unidades para g (gramas) e ml (mililitros) no banco de dados
-- A conversão para kg e L será feita apenas no frontend

-- Atualizar unidades de ingredientes
UPDATE ingredients
SET 
  unit = CASE 
    WHEN unit IN ('kg', 'quilogramas', 'Kg', 'KG', 'quilograma') THEN 'gramas'
    WHEN unit IN ('L', 'litros', 'Litros', 'litro') THEN 'ml'
    WHEN unit IN ('g', 'gramas', 'Gramas', 'grama') THEN 'gramas'
    WHEN unit IN ('ml', 'mililitros', 'Mililitros', 'mililitro') THEN 'ml'
    WHEN unit IN ('un', 'unidades', 'Unidades', 'unidade') THEN 'unidades'
    ELSE unit
  END,
  quantity = CASE 
    WHEN unit IN ('kg', 'quilogramas', 'Kg', 'KG', 'quilograma') THEN quantity * 1000
    WHEN unit IN ('L', 'litros', 'Litros', 'litro') THEN quantity * 1000
    ELSE quantity
  END;

-- Atualizar unidades de base_recipes
UPDATE base_recipes
SET 
  unit = CASE 
    WHEN unit IN ('kg', 'quilogramas', 'Kg', 'KG', 'quilograma') THEN 'gramas'
    WHEN unit IN ('L', 'litros', 'Litros', 'litro') THEN 'ml'
    WHEN unit IN ('g', 'gramas', 'Gramas', 'grama') THEN 'gramas'
    WHEN unit IN ('ml', 'mililitros', 'Mililitros', 'mililitro') THEN 'ml'
    WHEN unit IN ('un', 'unidades', 'Unidades', 'unidade') THEN 'unidades'
    ELSE unit
  END,
  yield = CASE 
    WHEN unit IN ('kg', 'quilogramas', 'Kg', 'KG', 'quilograma') THEN yield * 1000
    WHEN unit IN ('L', 'litros', 'Litros', 'litro') THEN yield * 1000
    ELSE yield
  END;

-- Comentários para documentar a padronização
COMMENT ON COLUMN ingredients.unit IS 'Unidade padronizada: gramas, ml ou unidades';
COMMENT ON COLUMN base_recipes.unit IS 'Unidade padronizada: gramas, ml ou unidades';
COMMENT ON COLUMN ingredients.quantity IS 'Quantidade sempre em unidades pequenas (g, ml, un)';
COMMENT ON COLUMN base_recipes.yield IS 'Rendimento sempre em unidades pequenas (g, ml, un)';
