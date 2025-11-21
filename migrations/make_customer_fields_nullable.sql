-- Tornar campos opcionais em customers
ALTER TABLE customers 
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

-- Remover a constraint antiga
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;

-- Adicionar constraint para garantir unicidade apenas quando email não for nulo
CREATE UNIQUE INDEX customers_email_unique 
  ON customers (email) 
  WHERE email IS NOT NULL;
