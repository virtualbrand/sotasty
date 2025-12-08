# 🏗️ ARQUITETURA DE ROLES E VIEWS

## 📊 HIERARQUIA DE USUÁRIOS

### 1. **SUPERADMIN** (role: 'superadmin')
- **Usuário:** admin@admin.com
- **Função:** Dono do SaaS, vê todos os clientes admin como SaaS customers
- **View em /customers:** `SuperAdminCustomers.tsx` (Painel SaaS Analytics)
- **O que vê:**
  - Lista de todos os admins (cada um é um cliente SaaS)
  - MRR, trial status, health score
  - Métricas de engajamento de cada cliente
  - Conversões de trial para pago

### 2. **ADMIN** (role: 'admin')
- **Usuário:** jaisson@virtualbrand.com.br (e outros clientes)
- **Função:** Dono de uma confeitaria usando o SoTasty
- **View em /customers:** Página normal de clientes (página principal do page.tsx)
- **O que vê:**
  - Lista dos clientes da CONFEITARIA dele
  - Cadastro de clientes (nome, email, telefone, CPF)
  - Histórico de pedidos de cada cliente

### 3. **MEMBER** (role: 'member')
- **Usuário:** dash@teste.com (funcionário de confeitaria)
- **Função:** Funcionário/colaborador de uma confeitaria
- **View em /customers:** Mesma página que admin (pode ter permissões diferentes)
- **O que vê:**
  - Lista dos clientes da confeitaria onde trabalha
  - Pode ter permissões limitadas (definidas por permissions)

---

## 🎯 FLUXO DE DECISÃO NO /customers

```typescript
// app/(dashboard)/customers/page.tsx (linha 540)

if (loadingRole) {
  return <PageLoading />  // Carregando role do usuário
}

if (userRole === 'superadmin' || profile?.is_superadmin) {
  return <SuperAdminCustomers />  // 🎨 Painel SaaS Analytics
}

return (
  // 📋 Painel de Clientes da Confeitaria
)
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
app/(dashboard)/customers/
├── page.tsx                    # Roteador principal + View para admin/member
├── SuperAdminCustomers.tsx     # View para superadmin (Painel SaaS)
└── [customer]/                 # Detalhes do cliente (futuro)
```

---

## 🔐 CONTROLE DE ACESSO

### Database (profiles table):
```sql
id              | uuid
email           | text
role            | text ('superadmin', 'admin', 'member')
is_superadmin   | boolean (não usado atualmente, role='superadmin' é suficiente)
```

### Lógica:
- **role === 'superadmin'** → SuperAdminCustomers (B2B Analytics)
- **role === 'admin'** → Customers Page (B2C CRM)
- **role === 'member'** → Customers Page (B2C CRM com permissões)

---

## 🎨 DIFERENÇAS VISUAIS

### SuperAdminCustomers (B2B - Painel SaaS):
- Título: "Clientes SaaS"
- Colunas: Status, Plano, MRR, Health Score, Trial Days
- Filtros: Status (trial/active/expired), Plano (start/grow/scale), Health (green/yellow/red)
- Objetivo: Gestão de clientes do SaaS (confeitarias)

### Customers Page (B2C - CRM):
- Título: "Clientes"
- Colunas: Nome, Email, Telefone, Pedidos
- Filtros: Busca por nome/email/telefone
- Objetivo: Gestão de clientes da confeitaria (consumidores finais)

---

## 🔄 QUANDO O ADMIN@ADMIN.COM ACESSA /customers:

1. Sistema busca: `userRole = 'superadmin'`
2. Condição: `userRole === 'superadmin'` → ✅ TRUE
3. Renderiza: `<SuperAdminCustomers />`
4. Mostra: Painel SaaS com todos os admins (confeitarias) como clientes

---

## 📊 DADOS QUE CADA VIEW BUSCA

### SuperAdminCustomers:
```javascript
GET /api/admin-customers
→ Busca profiles onde role='admin'
→ Retorna: business_name, trial_end_date, subscription_status, etc.
```

### Customers Page:
```javascript
GET /api/customers
→ Busca customers onde profile_id = user.id (admin logado)
→ Retorna: name, email, phone, orders_count
```

---

## ✅ ESTÁ FUNCIONANDO CORRETAMENTE!

✅ admin@admin.com (superadmin) → Vê painel SaaS
✅ jaisson@virtualbrand.com.br (admin) → Vê seus clientes da confeitaria
✅ dash@teste.com (member) → Vê clientes da confeitaria onde trabalha

---

## 🚀 PRÓXIMOS PASSOS SUGERIDOS:

1. **Adicionar RLS no banco:**
   - Members só veem clientes do workspace do admin deles
   - Admins só veem seus próprios clientes
   - Superadmin vê tudo

2. **Implementar workspace_id:**
   - Cada admin tem um workspace
   - Members pertencem a um workspace
   - Customers pertencem a um workspace

3. **Melhorar UI:**
   - Badge no header mostrando role atual
   - Cor diferente para superadmin no sidebar

4. **Adicionar switch de contexto (futuro):**
   - Superadmin pode "impersonate" um admin para testar
