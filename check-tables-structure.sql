-- Verificar estrutura das tabelas e relacionamentos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'final_products' 
AND column_name IN ('profile_id', 'user_id', 'workspace_id')
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('profile_id', 'user_id', 'workspace_id')
ORDER BY ordinal_position;

-- Ver workspace_id do jaisson
SELECT id, workspace_id, business_name 
FROM profiles 
WHERE id = '56a08d47-6c51-4336-b624-ca5531e2512a';
