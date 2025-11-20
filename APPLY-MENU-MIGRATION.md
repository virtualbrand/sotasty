# Como Aplicar a Migration do Sistema de Cardápios

## ⚠️ IMPORTANTE: Execute esta migration no Supabase

A tabela `profile_settings` e as tabelas de cardápios ainda não existem no seu banco de dados. Você precisa aplicar a migration primeiro.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral

### 2. Execute a Migration
1. Clique em **New Query**
2. Copie TODO o conteúdo do arquivo `/migrations/create_menus_system.sql`
3. Cole no editor SQL
4. Clique em **Run** ou pressione `Ctrl/Cmd + Enter`

### 3. Verifique se funcionou
Execute esta query para verificar se as tabelas foram criadas:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profile_settings', 'menus', 'menu_items', 'menu_categories', 'menu_views')
ORDER BY tablename;
```

Você deve ver estas 5 tabelas:
- ✅ menu_categories
- ✅ menu_items
- ✅ menu_views
- ✅ menus
- ✅ profile_settings

### 4. Teste a aplicação
Depois de aplicar a migration:
1. Recarregue a página de Preferências
2. Tente configurar sua URL personalizada
3. Deve funcionar perfeitamente! ✨

## 🔍 Troubleshooting

### Erro: "relation profile_settings does not exist"
**Solução:** A migration não foi aplicada. Siga os passos acima.

### Erro: "violates row level security policy"
**Solução:** Certifique-se de estar autenticado no sistema.

### Erro: "duplicate key value violates unique constraint"
**Solução:** A URL personalizada já está em uso por outro usuário. Escolha outra.

### Erro ao executar a migration
Se você já tem dados no banco e há conflitos:

```sql
-- Verificar se as tabelas já existem
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'menu%';

-- Se necessário, remover tabelas antigas (CUIDADO: isso apaga dados!)
DROP TABLE IF EXISTS menu_views CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS profile_settings CASCADE;

-- Depois execute a migration completa novamente
```

## 📊 Estrutura Criada

Após aplicar a migration, você terá:

1. **5 Tabelas Novas**
2. **11 Índices** para performance
3. **3 Triggers** para atualização automática
4. **15+ Políticas RLS** para segurança
5. **2 Funções auxiliares** (generate_unique_slug, get_public_menu)

## ✅ Próximos Passos

Depois de aplicar a migration com sucesso:

1. Configure sua URL personalizada em **Configurações > Preferências**
2. Crie cardápios em **Cardápios**
3. Compartilhe a URL pública com seus clientes!

---

**Dúvidas?** Verifique o arquivo `MENU-SYSTEM-GUIDE.md` para documentação completa.
