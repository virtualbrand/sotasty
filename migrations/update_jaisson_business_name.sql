-- Atualizar business_name do usuário jaisson@virtualbrand.com.br
UPDATE profiles
SET business_name = 'Virtual Brand'
WHERE id = '56a08d47-6c51-4336-b624-ca5531e2512a';

-- Verificar se atualizou
SELECT id, business_name, email FROM profiles WHERE id = '56a08d47-6c51-4336-b624-ca5531e2512a';
