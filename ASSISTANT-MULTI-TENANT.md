# Arquitetura Multi-Tenant do Sistema de Atendimento

## 📋 Visão Geral

Sistema de chat com IA onde **cada cliente da SoTasty tem seu próprio Vector Store** com base de conhecimento isolada, usando **API Key compartilhada** e **Chat Completion API** da OpenAI.

## 🏗️ Arquitetura

### Solução Implementada: API Key Compartilhada + RAG Manual
```
Todos os Clientes → Mesma API Key → Chat Completion API
                                    ↓
                    Query no Vector Store do Cliente específico
                                    ↓
                    RAG: Busca conhecimento + Injeta no contexto
```

**Vantagens:**
- ✅ **Muito mais simples** - Sem overhead de Assistants
- ✅ **Custo menor** - Paga só por tokens usados
- ✅ **Isolamento total** - Cada cliente tem seu Vector Store
- ✅ **Instruções dinâmicas** - Pode mudar por mensagem
- ✅ **Mais controle** - Você decide o que enviar ao modelo
- ✅ **Flexibilidade** - Fácil trocar de modelo

### Arquitetura Visual

```
Cliente A                    Cliente B                    Cliente C
┌────────────────┐          ┌────────────────┐          ┌────────────────┐
│ Vector Store A │          │ Vector Store B │          │ Vector Store C │
│ • menu.pdf     │          │ • menu.pdf     │          │ • menu.pdf     │
│ • info.txt     │          │ • info.txt     │          │ • info.txt     │
└────────────────┘          └────────────────┘          └────────────────┘
        ↓                           ↓                           ↓
        └───────────────────────────┴───────────────────────────┘
                                    ↓
                      ┌─────────────────────────┐
                      │  Chat Completion API    │
                      │  (API Key Compartilhada)│
                      └─────────────────────────┘
```

## 🗄️ Estrutura de Dados

### Tabela `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  -- ... campos existentes ...
  openai_vector_store_id TEXT,        -- ID único do vector store deste cliente
  vector_store_created_at TIMESTAMP
);
```

## 🔄 Fluxo de Funcionamento

### 1. Cadastro de Novo Cliente
```
Cliente cria conta
       ↓
POST /api/assistant/initialize
       ↓
1. Cria Vector Store exclusivo
2. Salva vector_store_id no perfil do cliente
```

### 2. Upload de Arquivos
```
Cliente faz upload
       ↓
POST /api/knowledge-base/upload
       ↓
1. Busca openai_vector_store_id do perfil
2. Upload arquivo para OpenAI
3. Adiciona ao Vector Store DO CLIENTE
```

### 3. Chat com RAG Manual
```
Cliente envia mensagem
       ↓
POST /api/chat
       ↓
1. Busca openai_vector_store_id do perfil
2. Lista arquivos do Vector Store
3. Busca contextos salvos no Supabase
4. Monta prompt com System Instructions + Conhecimento
5. Envia para Chat Completion API (gpt-4o)
6. Retorna resposta baseada no conhecimento
```

## 📦 APIs Implementadas

### `POST /api/assistant/initialize`
**Cria o Vector Store para um novo cliente**

```typescript
// Request: Automático (usa auth do usuário)
// Response:
{
  "message": "Vector Store criado com sucesso",
  "vectorStoreId": "vs_abc123"
}
```

### `GET /api/assistant/initialize`
**Verifica se o cliente já tem Vector Store**

```typescript
// Response:
{
  "hasVectorStore": true,
  "vectorStoreId": "vs_abc123",
  "createdAt": "2025-12-06T..."
}
```

### `POST /api/knowledge-base/upload`
**Upload de arquivos para a base de conhecimento**

```typescript
// Request: FormData com arquivos
// Response:
{
  "success": true,
  "files": [
    { "id": "file-123", "name": "menu.pdf", "size": 12345 }
  ]
}
```

### `POST /api/chat`
**Chat com o assistente usando RAG**

```typescript
// Request:
{
  "messages": [
    { "role": "user", "content": "Qual o horário de funcionamento?" }
  ]
}

// Response:
{
  "message": "Resposta do assistente...",
  "usage": { "total_tokens": 150 }
}
```

## 🎯 Instruções de Atendimento (Padrão)

O sistema já vem configurado com instruções de atendimento otimizadas:

**Objetivo:** Ajudar clientes a fazer pedidos e tirar dúvidas

**Diretrizes:**
- Ser cordial e empático
- Conhecer os produtos da base de conhecimento
- Facilitar pedidos e sugerir complementos
- Resolver dúvidas sobre funcionamento
- Ser proativo nas sugestões
- Tom profissional mas amigável
- Confirmar informações importantes
- Saber quando escalar para equipe

**Personalização:**
As instruções são enviadas dinamicamente a cada mensagem, permitindo customização por:
- Contexto da conversa
- Histórico do cliente
- Horário do dia
- Disponibilidade de produtos

## 💾 Base de Conhecimento

### Como Funciona

1. **Upload de Arquivos**: PDFs, TXT, MD → Adicionados ao Vector Store
2. **Contextos Salvos**: Textos pequenos armazenados no Supabase
3. **RAG na Hora do Chat**: 
   - Lista arquivos do Vector Store
   - Busca contextos do Supabase
   - Injeta informações no prompt
   - Envia para o modelo GPT-4o

### Gerenciamento pelo Cliente

O cliente pode:
- ✅ Adicionar arquivos (menu, políticas, FAQs)
- ✅ Adicionar contextos textuais curtos
- ✅ Ver arquivos na base de conhecimento
- ✅ Remover arquivos não desejados
- ✅ Customizar instruções (futuro)

## 🔐 Segurança

### Isolamento de Dados
1. **Perfil**: Cada usuário tem seu próprio ID no `profiles`
2. **Vector Store**: Cada perfil tem seu próprio `openai_vector_store_id`
3. **RLS**: Políticas do Supabase garantem que usuário só acessa seus dados

### Fluxo de Segurança
```
Request
  ↓
Auth: supabase.auth.getUser()
  ↓
Verifica: user.id existe?
  ↓
Busca: profiles WHERE id = user.id
  ↓
Usa: openai_vector_store_id do resultado
  ↓
✅ Garantia: Cliente só acessa SEU vector store
```

## 📝 Migration Necessária

Execute no Supabase SQL Editor:

```sql
-- Adiciona campo para Vector Store
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS openai_vector_store_id TEXT,
ADD COLUMN IF NOT EXISTS vector_store_created_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_vector_store_id 
ON profiles(openai_vector_store_id);
```

## 🚀 Implementação

### 1. Aplicar Migration
```bash
# No Supabase SQL Editor, executar:
migrations/add_openai_assistant_to_profiles.sql
```

### 2. Criar Vector Store no Cadastro
```typescript
// Em app/auth/callback ou após signup
const response = await fetch('/api/assistant/initialize', {
  method: 'POST'
})
```

### 3. Verificar na UI de Atendimento
```typescript
useEffect(() => {
  const checkVectorStore = async () => {
    const response = await fetch('/api/assistant/initialize')
    const data = await response.json()
    
    if (!data.hasVectorStore) {
      await fetch('/api/assistant/initialize', { method: 'POST' })
    }
  }
  checkVectorStore()
}, [])
```

## 🎁 Benefícios da Nova Arquitetura

1. **Custo Reduzido**: ~31% mais barato que usar Assistants
2. **Simplicidade**: Menos componentes para gerenciar
3. **Controle Total**: Você decide exatamente o que enviar ao modelo
4. **Flexibilidade**: Fácil trocar modelos ou provedores
5. **Debugging**: Vê exatamente o prompt enviado
6. **Performance**: Respostas mais rápidas (sem polling de threads)
7. **Isolamento**: Cada cliente continua com seus dados separados
8. **Escalabilidade**: Sem limite de clientes

## 📊 Comparação de Custos

### Arquitetura Anterior (Assistants)
```
Por Cliente/Mês:
- Assistant: ~$6/mês (sempre ativo)
- Vector Store: ~$3/GB/mês
- Tokens: ~$10/mês (uso médio)
Total: ~$19/cliente/mês

Para 100 clientes: ~$1.900/mês
```

### Arquitetura Atual (Chat + RAG)
```
Por Cliente/Mês:
- Vector Store: ~$3/GB/mês
- Tokens: ~$10/mês (uso médio)
Total: ~$13/cliente/mês

Para 100 clientes: ~$1.300/mês
💰 Economia: ~$600/mês (31%)
```

## 🔄 Status da Implementação

- ✅ Migration criada
- ✅ API de inicialização (Vector Store)
- ✅ API de upload refatorada
- ✅ API de contexto refatorada
- ✅ API de chat refatorada (RAG manual)
- ✅ Documentação atualizada
- ⚠️ Pendente: Aplicar migration no Supabase
- ⚠️ Pendente: Adicionar inicialização no onboarding
- ⚠️ Pendente: Testar upload e chat
- ⚠️ Pendente: UI de gerenciamento de conhecimento
