-- Verificar status do RLS e policies na tabela profiles

-- 1. Verificar se RLS está ativo
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Ver todas as policies existentes
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Desabilitar RLS temporariamente para testar
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 4. Ou criar policy que permite tudo para authenticated users
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 5. Habilitar RLS novamente
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
