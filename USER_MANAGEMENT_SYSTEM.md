# Sistema de Gerenciamento de Usuários - SoTasty

## Visão Geral

O SoTasty implementa um sistema de gerenciamento de usuários com três níveis de permissão e funcionalidade de convites por e-mail.

## Tipos de Usuário

### 1. Superadmin
- **Descrição**: Dono do software SoTasty
- **Acesso**: View diferenciada com dashboards e relatórios do SaaS
- **Permissões**: Controle total sobre todas as contas e configurações do sistema

### 2. Admin (Administrador)
- **Descrição**: Dono do negócio gastronômico
- **Acesso**: Controle total sobre sua própria conta
- **Permissões**:
  - Gerenciar todos os aspectos do negócio
  - Convidar novos usuários para o workspace
  - Configurar permissões granulares para membros
  - Remover membros do workspace
- **Criação**: Automaticamente atribuído quando um usuário cria conta na SoTasty

### 3. Member (Membro)
- **Descrição**: Usuário convidado por um Admin
- **Acesso**: Acesso limitado com base em permissões específicas
- **Permissões**: Definidas pelo Admin (ex: acesso apenas a Pedidos e Financeiro)
- **Criação**: Via convite por e-mail enviado por um Admin

## Estrutura de Dados

### Tabela: profiles
```sql
- id (UUID, FK para auth.users)
- full_name (TEXT)
- role (TEXT) - 'superadmin' | 'admin' | 'member'
- workspace_id (UUID) - Identifica o workspace/empresa
- invited_by (UUID) - ID do usuário que convidou
- ... outros campos de perfil
```

### Tabela: user_invites
```sql
- id (UUID)
- email (TEXT)
- workspace_id (UUID)
- invited_by (UUID)
- role (TEXT) - 'admin' | 'member'
- status (TEXT) - 'pending' | 'accepted' | 'expired'
- token (TEXT) - Token único para aceitar convite
- expires_at (TIMESTAMP) - Convite expira em 7 dias
```

### Tabela: user_permissions (para granularidade futura)
```sql
- user_id (UUID)
- workspace_id (UUID)
- module (TEXT) - 'orders' | 'customers' | 'products' | 'messages' | 'agenda' | 'financial' | 'activities' | 'settings'
- can_view (BOOLEAN)
- can_create (BOOLEAN)
- can_edit (BOOLEAN)
- can_delete (BOOLEAN)
```

## Fluxo de Convite

1. **Admin envia convite**
   - Admin acessa Configurações > Usuários
   - Insere e-mail e seleciona role (Admin ou Membro)
   - Clica em "Convidar"

2. **Sistema processa convite**
   - Valida se e-mail já existe no workspace
   - Verifica se já existe convite pendente
   - Cria registro em `user_invites`
   - Gera token único
   - Define expiração (7 dias)
   - TODO: Envia e-mail com link de convite

3. **Usuário aceita convite**
   - Acessa link do e-mail
   - Cria conta ou faz login
   - Sistema vincula usuário ao workspace
   - Atualiza status do convite para 'accepted'

## Recursos Implementados

### Página de Usuários (/settings/users)
- ✅ Formulário de convite com e-mail e seleção de role
- ✅ Lista de membros do time com avatares e badges de role
- ✅ Lista de convites pendentes com status
- ✅ Botão de remover membro (apenas para members)
- ✅ Botão de cancelar convite
- ✅ Dialog de confirmação para remoções
- ✅ Feedback visual com toasts

### APIs Implementadas

#### `/api/users/invites`
- **GET**: Lista convites do workspace
- **POST**: Cria novo convite
- **DELETE**: Cancela convite pendente

#### `/api/users/members`
- **GET**: Lista membros do workspace
- **DELETE**: Remove membro do workspace

## Segurança (RLS - Row Level Security)

### Policies Implementadas

1. **profiles**: Usuários podem ver perfis do mesmo workspace
2. **user_invites**: 
   - Usuários podem ver convites do seu workspace
   - Apenas Admins podem criar/atualizar/deletar convites
3. **user_permissions**: 
   - Usuários veem suas próprias permissões
   - Admins gerenciam permissões no workspace

## Workspace Automático

Quando um novo usuário cria conta:
- Automaticamente recebe role 'admin'
- `workspace_id` é definido como seu próprio `id`
- Isso cria um workspace isolado para seu negócio

## Próximos Passos (TODO)

1. ⏳ Implementar envio de e-mail de convite
2. ⏳ Criar página de aceite de convite (/invite/[token])
3. ⏳ Implementar sistema de permissões granulares
4. ⏳ Dashboard de superadmin
5. ⏳ Auditoria de ações dos usuários
6. ⏳ Configuração de expiração de convites customizável

## Migrations

Para aplicar as mudanças no banco de dados, execute:
```sql
-- Arquivo: migrations/add_user_roles_and_invites.sql
```

Este arquivo contém:
- Alteração da tabela profiles (role, workspace_id, invited_by)
- Criação da tabela user_invites
- Criação da tabela user_permissions
- Policies de segurança (RLS)
- Triggers para workspace automático
- Índices para performance
