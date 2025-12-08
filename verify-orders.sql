-- Verificar todos os pedidos do workspace do jaisson@virtualbrand.com.br

-- 1. Pegar o workspace_id do jaisson
SELECT id, workspace_id, business_name 
FROM profiles 
WHERE id = '56a08d47-6c51-4336-b624-ca5531e2512a';

-- 2. Listar TODOS os pedidos desse workspace
SELECT 
  id,
  customer,
  product,
  created_at,
  status,
  user_id,
  workspace_id
FROM orders 
WHERE workspace_id = (
  SELECT workspace_id 
  FROM profiles 
  WHERE id = '56a08d47-6c51-4336-b624-ca5531e2512a'
)
ORDER BY created_at DESC;

-- 3. Verificar se algum pedido tem status específico ou filtro
SELECT 
  status,
  COUNT(*) as count
FROM orders 
WHERE workspace_id = (
  SELECT workspace_id 
  FROM profiles 
  WHERE id = '56a08d47-6c51-4336-b624-ca5531e2512a'
)
GROUP BY status;

-- 4. Verificar o user_id de cada pedido
SELECT 
  id,
  user_id,
  customer,
  product,
  CASE 
    WHEN user_id = '56a08d47-6c51-4336-b624-ca5531e2512a' THEN '✅ É do Jaisson'
    ELSE '❌ NÃO é do Jaisson'
  END as verification
FROM orders
WHERE workspace_id = (
  SELECT workspace_id 
  FROM profiles 
  WHERE id = '56a08d47-6c51-4336-b624-ca5531e2512a'
);
