# Sistema de Permissões de Configurações

## Visão Geral

O sistema de configurações possui dois níveis de acesso:

1. **Acesso Básico**: Membros com permissão específica podem acessar a configuração
2. **Acesso Total**: Apenas admin ou membros com todas as permissões habilitadas

## Configurações e Níveis de Acesso

### Sempre Acessíveis
- **Perfil**: Todos os usuários
- **Notificações**: Todos os usuários

### Apenas Admin/Superadmin
- **Planos**: Somente admin ou superadmin
- **Usuários**: Somente admin ou superadmin

### Acesso Básico (Permissão Específica)
- **Produtos**: 
  - Membros com permissão `products` podem acessar
  - **Podem acessar TODAS as abas**: Insumos, Bases de Preparo e Produtos Finais
  - **Podem gerenciar**: Criar, editar e deletar em todas as 3 abas
  - **Na configuração, podem editar apenas**: Categorias de produtos
  - **Na configuração, NÃO podem editar**: Fotos, Unidades de Medida, Fator de Perda

- **Mensagens**:
  - Membros com permissão `messages` podem acessar
  - **Podem acessar**: Chat completo com API do WhatsApp integrada
  - **Podem**: Ver conversas, enviar e receber mensagens
  - **Na configuração, NÃO podem**: Conectar/desconectar WhatsApp, gerenciar tokens, webhooks

### Acesso Total (Admin ou Admin como Membro)
Requer permissão específica + todas as outras permissões habilitadas:

- **Pedidos**: Configurações completas de pedidos
- **Clientes**: Configurações completas de clientes (CPF/CNPJ, Foto, etc.)
- **Mensagens**: Configurações de WhatsApp e integração
- **Atendimento**: Base de conhecimento e assistente
- **Agenda**: Configurações de agenda e tarefas
- **Financeiro**: Configurações de categorias financeiras
- **Atividades**: Histórico de atividades

## Lógica de "Admin como Membro"

Um membro possui **Acesso Total** quando tem:
- A permissão específica do módulo (ex: `customers: true`)
- **TODAS** as seguintes permissões habilitadas:
  - `dashboard: true`
  - `products: true`
  - `menus: true`
  - `orders: true`
  - `financial: true`
  - `messages: true`
  - `support: true`
  - `customers: true`
  - `agenda: true`
  - `activities: true`

## Implementação

### Layout de Configurações

```typescript
// app/(dashboard)/settings/layout.tsx

const settingsNavigation = [
  {
    name: 'Produtos',
    permission: 'products',
    requiresFullAccess: false // Membros podem acessar
  },
  {
    name: 'Clientes',
    permission: 'customers',
    requiresFullAccess: true // Apenas admin ou admin como membro
  },
  // ...
]

// Lógica de filtragem
const filteredNavigation = settingsNavigation.filter(item => {
  // Admin/superadmin tem acesso total
  if (userRole === 'admin' || userRole === 'superadmin') return true
  
  if (userRole === 'member') {
    const hasPermission = userPermissions[item.permission]
    
    if (item.requiresFullAccess) {
      // Verificar se tem todas as permissões
      const allPermissions = ['dashboard', 'products', 'menus', ...]
      const hasAllPermissions = allPermissions.every(p => userPermissions[p])
      return hasPermission && hasAllPermissions
    }
    
    return hasPermission
  }
})
```

### Página de Configuração de Produtos

```typescript
// app/(dashboard)/settings/products/page.tsx

// Verificar nível de acesso
const isFullAccess = 
  userRole === 'admin' || 
  userRole === 'superadmin' || 
  (userRole === 'member' && hasAllPermissions)

// Seções condicionais
{isFullAccess && (
  <div>
    {/* Fotos, Unidades de Medida, Fator de Perda */}
  </div>
)}

// Categorias sempre acessíveis para quem tem permissão de produtos
<div>
  {/* Gerenciar Categorias */}
</div>
```

## Casos de Uso

### Caso 1: Membro com Permissão Básica em Produtos
**Permissões**: `products: true` (outras: false)

**Acesso na página /products**:
- ✅ Ver e gerenciar **Insumos**
- ✅ Ver e gerenciar **Bases de Preparo**
- ✅ Ver e gerenciar **Produtos Finais**

**Acesso em Configurações > Produtos**:
- ✅ Ver configurações de Produtos
- ✅ Gerenciar categorias de produtos
- ❌ Alterar fotos, unidades de medida, fator de perda

**Outras configurações**:
- ❌ Acessar configurações de Clientes, Pedidos, Financeiro, etc.

### Caso 2: Membro com Acesso Total (Admin como Membro)
**Permissões**: Todas habilitadas

**Acesso na página /products**:
- ✅ Ver e gerenciar **Insumos**
- ✅ Ver e gerenciar **Bases de Preparo**
- ✅ Ver e gerenciar **Produtos Finais**

**Acesso em Configurações**:
- ✅ Ver TODAS as configurações (exceto Planos e Usuários)
- ✅ Gerenciar categorias de produtos
- ✅ Alterar fotos, unidades de medida, fator de perda
- ✅ Configurações completas de Clientes
- ✅ Configurações completas de Pedidos, Financeiro, etc.

### Caso 3: Admin
**Role**: `admin` ou `superadmin`

**Acesso na página /products**:
- ✅ Ver e gerenciar **Insumos**
- ✅ Ver e gerenciar **Bases de Preparo**
- ✅ Ver e gerenciar **Produtos Finais**

**Acesso em Configurações**:
- ✅ Acesso completo a TODAS as configurações
- ✅ Planos e gerenciamento de usuários
- ✅ Todas as funcionalidades sem restrições

## Benefícios

1. **Simplicidade**: Permissão `products` dá acesso completo aos 3 níveis (Insumos, Bases, Produtos Finais)
2. **Granularidade nas Configurações**: Membros básicos só editam categorias, não mexem em configurações avançadas
3. **Flexibilidade**: Admin pode delegar acesso total criando "admin como membro"
4. **Segurança**: Configurações críticas (Fotos, Unidades, Fator de Perda) protegidas por acesso total
5. **Experiência**: Interface de configurações adaptada ao nível de permissão do usuário
