-- Permitir que usuários leiam seu próprio perfil
-- Isso é necessário para o sistema identificar o role (admin, superadmin, member)

-- Drop policy antiga se existir
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Criar policy para leitura do próprio perfil
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Verificar se a policy foi criada
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' AND policyname = 'Users can read own profile';
