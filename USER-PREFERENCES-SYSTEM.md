# Sistema de Preferências Individuais por Usuário

## Visão Geral

Este sistema permite que cada usuário (admin, membro com permissão total, ou convidado) tenha suas próprias preferências de interface e visualização, independente de outros usuários no mesmo workspace.

## Arquitetura

### 1. Banco de Dados

**Tabela:** `user_preferences`
- `user_id` (UUID) - Referência ao usuário
- `menu_position` - Posição do menu (sidebar, header, footer, right)
- `notification_settings` - JSONB com configurações de notificações
- `orders_default_view` - Visualização padrão de pedidos (list, day, week, month)
- `orders_date_format` - Formato de data em pedidos (short, numeric, long)
- `agenda_default_view` - Visualização padrão da agenda (list, kanban, day, week, month)
- `agenda_date_format` - Formato de data na agenda (short, numeric, long)

**RLS (Row Level Security):**
- Cada usuário só pode ver/editar suas próprias preferências
- Políticas implementadas: SELECT, INSERT, UPDATE

### 2. API

**Endpoint:** `/api/user-preferences`

**GET** - Buscar preferências do usuário atual
- Retorna preferências salvas ou valores padrão se não existir

**PATCH** - Atualizar preferências
- Aceita qualquer campo da tabela `user_preferences`
- Cria registro se não existir (upsert)

### 3. Hook Customizado

**Hook:** `useUserPreferences()`

```typescript
const { preferences, loading, updatePreferences, refreshPreferences } = useUserPreferences()
```

**Retorna:**
- `preferences`: Objeto com todas as preferências
- `loading`: Estado de carregamento
- `error`: Mensagem de erro (se houver)
- `updatePreferences(updates)`: Função para atualizar preferências
- `refreshPreferences()`: Função para recarregar do servidor

## Configurações Incluídas

### 1. Perfil > Preferências > Posição do Menu
- **Antes:** localStorage compartilhado
- **Depois:** user_preferences.menu_position
- **Valores:** 'sidebar' | 'header' | 'footer' | 'right'

### 2. Notificações > Todas
- **Antes:** localStorage compartilhado
- **Depois:** user_preferences.notification_settings (JSONB)
- **Estrutura:** `{ [notificationId]: { email: boolean, push: boolean } }`

### 3. Pedidos > Visualização padrão
- **Antes:** localStorage ('ordersDefaultView')
- **Depois:** user_preferences.orders_default_view
- **Valores:** 'list' | 'day' | 'week' | 'month'

### 4. Pedidos > Formato de data
- **Antes:** localStorage ('ordersDateFormat')
- **Depois:** user_preferences.orders_date_format
- **Valores:** 'short' | 'numeric' | 'long'

### 5. Agenda > Visualização padrão
- **Antes:** localStorage ('agendaDefaultView')
- **Depois:** user_preferences.agenda_default_view
- **Valores:** 'list' | 'kanban' | 'day' | 'week' | 'month'

### 6. Agenda > Formato de data
- **Antes:** localStorage ('agendaDateFormat')
- **Depois:** user_preferences.agenda_date_format
- **Valores:** 'short' | 'numeric' | 'long'

## Implementação

### Arquivos Criados

1. **Migração:**
   - `migrations/create_user_preferences.sql`

2. **API:**
   - `app/api/user-preferences/route.ts`

3. **Hook:**
   - `hooks/useUserPreferences.ts`

### Arquivos a Atualizar

1. **Perfil (Posição do Menu):**
   - `app/(dashboard)/settings/profile/page.tsx`
   - `app/(dashboard)/layout.tsx`
   - `components/Sidebar.tsx`

2. **Notificações:**
   - `app/(dashboard)/settings/notifications/page.tsx`

3. **Pedidos:**
   - `app/(dashboard)/settings/orders/page.tsx`
   - `app/(dashboard)/orders/page.tsx`

4. **Agenda:**
   - `app/(dashboard)/settings/agenda/page.tsx`
   - `app/(dashboard)/agenda/page.tsx`

## Próximos Passos

1. ✅ Criar migração da tabela `user_preferences`
2. ✅ Criar API endpoint `/api/user-preferences`
3. ✅ Criar hook `useUserPreferences()`
4. ⏳ Executar migração no Supabase
5. ⏳ Atualizar componentes para usar o hook
6. ⏳ Remover dependências de localStorage
7. ⏳ Testar com múltiplos usuários

## Benefícios

- ✅ Preferências individuais por usuário
- ✅ Sincronização entre dispositivos
- ✅ Persistência no banco de dados
- ✅ Segurança via RLS
- ✅ Facilmente extensível para novas preferências
- ✅ Não afeta outros usuários do workspace

## Notas Importantes

- As preferências antigas no localStorage serão ignoradas após a implementação
- Cada usuário começa com valores padrão na primeira vez
- As preferências são carregadas automaticamente ao fazer login
- Atualizações são imediatas e persistidas no servidor
