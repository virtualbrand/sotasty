# Módulo Financeiro - SoTasty

## Visão Geral

O módulo financeiro do SoTasty é inspirado no Organizze e oferece controle completo sobre receitas e despesas do negócio.

## Funcionalidades Implementadas

### ✅ Modal de Transações

O modal de transações permite:

- **Campos Básicos:**
  - Descrição da transação
  - Valor (R$)
  - Data
  - Conta/Cartão
  - Categoria

- **Abas de Funcionalidades:**
  - **Repetir**: Configure transações fixas ou parceladas
  - **Observação**: Adicione notas à transação
  - **Anexo**: Upload de arquivos (em desenvolvimento)
  - **Tags**: Adicione tags personalizadas

- **Recorrência:**
  - Despesa/Receita fixa (mensal)
  - Lançamento parcelado em Meses ou Semanas
  - Cálculo automático de parcelas

- **Status de Pagamento:**
  - Marcar como pago/não pago
  - Indicador visual com ícone de polegar

## Estrutura do Banco de Dados

### Tabelas

#### `financial_accounts`
Contas e cartões do usuário.

```sql
- id (UUID)
- user_id (UUID)
- name (TEXT)
- type (TEXT) - 'conta-corrente', 'poupanca', 'cartao-credito', 'dinheiro'
- initial_balance (DECIMAL)
- current_balance (DECIMAL)
- is_active (BOOLEAN)
```

#### `financial_categories`
Categorias de receitas e despesas.

```sql
- id (UUID)
- user_id (UUID)
- name (TEXT)
- type (TEXT) - 'receita' ou 'despesa'
- color (TEXT)
- icon (TEXT)
- is_system (BOOLEAN) - categorias do sistema não podem ser editadas
```

**Categorias Padrão de Receita:**
- Vendas
- Serviços
- Outras Receitas

**Categorias Padrão de Despesa:**
- Ingredientes
- Embalagens
- Aluguel
- Energia
- Salários
- Marketing
- Outras Despesas

#### `financial_transactions`
Transações financeiras.

```sql
- id (UUID)
- user_id (UUID)
- account_id (UUID)
- category_id (UUID)
- type (TEXT) - 'receita' ou 'despesa'
- description (TEXT)
- amount (DECIMAL)
- date (DATE)
- is_paid (BOOLEAN)
- observation (TEXT)
- tags (TEXT[])
- attachment_url (TEXT)

# Campos de recorrência
- is_recurring (BOOLEAN)
- recurrence_type (TEXT) - 'fixa' ou 'parcelada'
- parent_transaction_id (UUID)
- installment_number (INTEGER)
- total_installments (INTEGER)
- installment_period (TEXT) - 'Meses' ou 'Semanas'
```

## API Endpoints

### Transações

#### `GET /api/financeiro/transactions`
Lista transações do usuário.

**Query Parameters:**
- `startDate` - Data inicial
- `endDate` - Data final
- `type` - 'receita' ou 'despesa'
- `accountId` - UUID da conta
- `categoryId` - UUID da categoria

#### `POST /api/financeiro/transactions`
Cria nova transação.

**Body:**
```json
{
  "type": "receita" | "despesa",
  "description": "string",
  "amount": "number",
  "date": "YYYY-MM-DD",
  "accountId": "uuid",
  "categoryId": "uuid",
  "isPaid": boolean,
  "observation": "string",
  "tags": ["tag1", "tag2"],
  "recurrenceType": "fixa" | "parcelada" | null,
  "installments": "number",
  "installmentPeriod": "Meses" | "Semanas"
}
```

#### `PUT /api/financeiro/transactions`
Atualiza transação existente.

#### `DELETE /api/financeiro/transactions?id={uuid}`
Remove transação.

### Contas

#### `GET /api/financeiro/accounts`
Lista contas ativas do usuário.

#### `POST /api/financeiro/accounts`
Cria nova conta.

**Body:**
```json
{
  "name": "string",
  "type": "conta-corrente" | "poupanca" | "cartao-credito" | "dinheiro",
  "initialBalance": "number"
}
```

#### `PUT /api/financeiro/accounts`
Atualiza conta.

#### `DELETE /api/financeiro/accounts?id={uuid}`
Desativa conta (soft delete).

### Categorias

#### `GET /api/financeiro/categories?type={receita|despesa}`
Lista categorias do usuário e do sistema.

#### `POST /api/financeiro/categories`
Cria nova categoria.

**Body:**
```json
{
  "name": "string",
  "type": "receita" | "despesa",
  "color": "#hex",
  "icon": "string"
}
```

#### `PUT /api/financeiro/categories`
Atualiza categoria (apenas categorias do usuário).

#### `DELETE /api/financeiro/categories?id={uuid}`
Remove categoria (apenas categorias do usuário).

## Recursos Avançados

### Atualização Automática de Saldo

O sistema atualiza automaticamente o saldo da conta quando:
- Uma transação é criada (se `is_paid = true`)
- Uma transação é atualizada
- Uma transação é removida

Isso é feito através de um trigger no banco de dados.

### Transações Parceladas

Quando uma transação parcelada é criada:
1. Cria-se uma transação "pai" com o valor total
2. Cria-se N transações "filhas" com valores divididos
3. Apenas a primeira parcela pode começar como paga
4. Cada parcela tem sua própria data calculada

### Row Level Security (RLS)

Todas as tabelas têm políticas RLS que garantem:
- Usuários só podem ver seus próprios dados
- Usuários só podem modificar seus próprios dados
- Categorias do sistema podem ser vistas por todos mas não editadas

## Componentes

### `TransactionModal`
Modal principal para criar/editar transações.

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `type`: 'receita' | 'despesa'
- `onSuccess?`: () => void

**Localização:** `/components/financeiro/TransactionModal.tsx`

## Próximos Passos

### Funcionalidades Planejadas

- [ ] Página de configurações do módulo financeiro
- [ ] Gráficos de receitas x despesas
- [ ] Relatórios mensais/anuais
- [ ] Exportação de dados (CSV, PDF)
- [ ] Dashboard com métricas financeiras
- [ ] Upload e visualização de anexos
- [ ] Filtros avançados de transações
- [ ] Conciliação bancária
- [ ] Metas financeiras
- [ ] Alertas de vencimento

### Melhorias Técnicas

- [ ] Cache de dados com React Query
- [ ] Validação de formulários com Zod
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Otimização de queries

## Migration

Para aplicar o schema no banco de dados, execute:

```bash
# No Supabase SQL Editor
# Execute o arquivo: migrations/create_financial_transactions.sql
```

## Uso

```tsx
import TransactionModal from '@/components/financeiro/TransactionModal'

function MyComponent() {
  const [modalType, setModalType] = useState<'receita' | 'despesa' | null>(null)

  return (
    <>
      <button onClick={() => setModalType('receita')}>
        Nova Receita
      </button>
      
      {modalType && (
        <TransactionModal
          isOpen={modalType !== null}
          onClose={() => setModalType(null)}
          type={modalType}
          onSuccess={() => {
            // Refresh data
            console.log('Transação criada!')
          }}
        />
      )}
    </>
  )
}
```

## Design

O design é inspirado no Organizze com:
- Interface limpa e minimalista
- Cores semânticas (verde para receita, vermelho para despesa)
- Tabs para organizar funcionalidades
- Feedback visual claro
- Mobile-first responsive design
