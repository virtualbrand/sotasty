-- Remove description column from base_recipes table
ALTER TABLE base_recipes DROP COLUMN IF EXISTS description;

-- Remove description column from final_products table
ALTER TABLE final_products DROP COLUMN IF EXISTS description;
