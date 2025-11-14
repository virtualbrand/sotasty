-- Adicionar novas colunas à tabela customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(18),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Criar índice para busca por CPF/CNPJ (opcional, mas recomendado)
CREATE INDEX IF NOT EXISTS idx_customers_cpf_cnpj ON customers(cpf_cnpj);

-- Comentários para documentação
COMMENT ON COLUMN customers.avatar_url IS 'URL do avatar do cliente no storage';
COMMENT ON COLUMN customers.cpf_cnpj IS 'CPF ou CNPJ do cliente (formatado)';
COMMENT ON COLUMN customers.notes IS 'Observações sobre o cliente';
