-- Adiciona a coluna cpf_cnpj à tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- Adiciona comentário à coluna
COMMENT ON COLUMN profiles.cpf_cnpj IS 'CPF ou CNPJ do usuário (formatado)';
