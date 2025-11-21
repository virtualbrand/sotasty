# Sistema de Feedback & Roadmap - SoTasty

## Visão Geral

O sistema de Feedback & Roadmap permite que usuários sugiram melhorias, novos recursos e reportem bugs. A comunidade pode votar nas sugestões, e administradores podem moderar e aprovar feedbacks para aparecerem publicamente.

## Localização

- **Página Principal**: `/app/(dashboard)/feedback/page.tsx`
- **Componente de Upvote**: `/components/ui/upvote-button.tsx`
- **Migration**: `/migrations/create_feedback_system.sql`

## Funcionalidades

### 1. Sistema de Votação (Upvote/Downvote)

- **Upvote**: Voto positivo para indicar que o usuário apoia a sugestão
- **Downvote**: Voto negativo para indicar discordância
- **Contador de Votos**: Exibe a contagem líquida de votos (upvotes - downvotes)
- **Estado Visual**: Botões mudam de cor quando o usuário vota
- **Toggle**: Clicar novamente no mesmo voto remove a votação

#### Regras de Votação:
- Apenas usuários autenticados podem votar
- Cada usuário pode votar apenas uma vez por feedback
- O voto pode ser alterado (de up para down e vice-versa)
- O voto pode ser removido clicando novamente

### 2. Submissão de Feedback

Os usuários podem enviar feedbacks com:
- **Título**: Resumo da sugestão
- **Descrição**: Detalhes da sugestão
- **Categoria**: 
  - 🔵 Melhoria (Improvement)
  - 🟢 Novo Recurso (New Feature)
  - 🔴 Bug
  - 🟣 Outro

### 3. Moderação

**Status de Feedback:**
- `pending`: Aguardando aprovação de um superadmin
- `approved`: Aprovado e visível publicamente
- `in-progress`: Em desenvolvimento
- `completed`: Implementado e lançado
- `rejected`: Rejeitado (não aparece na lista)

**Permissões:**
- Qualquer usuário autenticado pode criar feedback
- Feedbacks começam com status `pending`
- Apenas superadmins podem aprovar/rejeitar feedbacks
- Quando aprovado, o feedback começa com 1 voto (do criador)

### 4. Mesclagem de Feedbacks Duplicados

Superadmins podem mesclar feedbacks similares:
- O campo `merged_into` aponta para o feedback principal
- Os votos são somados ao feedback principal
- O feedback duplicado não aparece mais na lista

### 5. Filtros e Ordenação

**Filtros:**
- Por categoria (Todos, Melhoria, Novo Recurso, Bug, Outro)
- Busca por texto (título e descrição)

**Ordenação:**
- **Mais Votados**: Ordenado por número de votos (padrão)
- **Mais Recentes**: Ordenado por data de criação
- **Trending**: Algoritmo baseado em votos recentes

Fórmula Trending: `votes / dias_desde_criacao`

### 6. Sistema de Comentários

(Implementação futura)
- Usuários podem comentar em feedbacks aprovados
- Contador de comentários aparece em cada feedback
- Discussões sobre implementação e detalhes

## Estrutura do Banco de Dados

### Tabela: `feedbacks`

```sql
- id (UUID, PK)
- title (TEXT)
- description (TEXT)
- category (TEXT) - 'improvement', 'new', 'bug', 'other'
- status (TEXT) - 'pending', 'approved', 'in-progress', 'completed', 'rejected'
- votes (INTEGER) - Contagem de votos líquida
- comments_count (INTEGER)
- user_id (UUID, FK)
- user_name (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- approved_at (TIMESTAMP)
- approved_by (UUID, FK)
- merged_into (UUID, FK) - Para feedbacks duplicados
```

### Tabela: `feedback_votes`

```sql
- id (UUID, PK)
- feedback_id (UUID, FK)
- user_id (UUID, FK)
- vote_type (TEXT) - 'up' ou 'down'
- created_at (TIMESTAMP)
- UNIQUE(feedback_id, user_id) - Um voto por usuário
```

### Tabela: `feedback_comments`

```sql
- id (UUID, PK)
- feedback_id (UUID, FK)
- user_id (UUID, FK)
- user_name (TEXT)
- comment (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Políticas RLS (Row Level Security)

### Feedbacks
- ✅ Feedbacks aprovados são públicos (qualquer um pode ver)
- ✅ Usuários podem ver seus próprios feedbacks (mesmo se pending)
- ✅ Usuários autenticados podem criar feedbacks
- ✅ Usuários podem editar seus feedbacks pendentes
- ✅ Apenas superadmins podem moderar (aprovar/rejeitar)

### Votos
- ✅ Votos são públicos (qualquer um pode ver)
- ✅ Usuários autenticados podem votar
- ✅ Usuários podem atualizar/deletar seus próprios votos

### Comentários
- ✅ Comentários de feedbacks aprovados são públicos
- ✅ Usuários podem comentar em feedbacks aprovados
- ✅ Usuários podem editar/deletar seus próprios comentários

## Design e UX

### Cores por Categoria

```typescript
- Improvement (Melhoria): Azul (#4A7C8C)
- New (Novo Recurso): Verde (#52A675)
- Bug: Vermelho (#C75D6A)
- Other (Outro): Roxo (#8B5CF6)
```

### Card de Feedback

Cada feedback exibe:
- 📊 Botão de votação (esquerda)
- 🏷️ Badge de categoria
- 👤 Nome do usuário criador
- 📝 Título e descrição
- 📅 Data de criação
- 💬 Contador de comentários

### Botão de Upvote

Componente personalizado com:
- Botão de upvote (ChevronUp)
- Contador central
- Botão de downvote (ChevronDown)
- Design arredondado com sombra
- Estados visuais (hover, active, disabled)

## Tabs de Navegação

1. **Roadmap**: Feedbacks aprovados em desenvolvimento
2. **Dar Feedback**: Lista principal (atual)
3. **Lançado**: Features implementadas
4. **Changelog**: Histórico de atualizações

## Fluxo de Trabalho

### Para Usuários Comuns:

1. **Criar Feedback**
   - Clicar em "Novo Feedback"
   - Preencher título, descrição e categoria
   - Enviar para moderação
   - Status: `pending`

2. **Votar em Feedbacks**
   - Visualizar feedbacks aprovados
   - Clicar em upvote/downvote
   - Voto é registrado instantaneamente

3. **Comentar** (futuro)
   - Adicionar comentários em feedbacks
   - Discutir implementação

### Para Superadmins:

1. **Moderar Feedbacks**
   - Ver feedbacks pendentes
   - Aprovar feedbacks relevantes
   - Rejeitar duplicados ou inapropriados
   - Mesclar feedbacks similares

2. **Atualizar Status**
   - Marcar como "Em Progresso" quando começar
   - Marcar como "Concluído" quando lançar
   - Adicionar ao changelog

3. **Gerenciar Duplicados**
   - Identificar feedbacks similares
   - Mesclar usando `merged_into`
   - Votos são somados automaticamente

## Melhorias Futuras

### Planejadas
- [ ] Sistema de comentários completo
- [ ] Notificações de status (email/push)
- [ ] Integração com GitHub Issues
- [ ] Página de Roadmap visual
- [ ] Changelog automático
- [ ] Exportar feedbacks para CSV
- [ ] Tags customizáveis
- [ ] Attachments (imagens, arquivos)
- [ ] Sistema de recompensas para contribuidores

### Possíveis
- [ ] Votação anônima (opcional)
- [ ] Ranking de contribuidores
- [ ] API pública de feedbacks
- [ ] Widget embarcável
- [ ] Integração com Discord/Slack
- [ ] Sistema de milestones
- [ ] Priorização automática por IA
- [ ] Análise de sentimento

## Instalação

### 1. Executar Migration

```bash
# Via Supabase CLI
supabase migration up

# Ou executar manualmente no Supabase Studio
# SQL Editor > New Query > Colar conteúdo de create_feedback_system.sql
```

### 2. Verificar RLS

Certifique-se de que as políticas RLS estão ativas:

```sql
SELECT * FROM pg_policies WHERE tablename IN ('feedbacks', 'feedback_votes', 'feedback_comments');
```

### 3. Testar Acesso

- Criar um feedback como usuário normal
- Aprovar como superadmin
- Votar no feedback
- Verificar contadores

## Analytics

Métricas sugeridas para tracking:
- Total de feedbacks criados
- Taxa de aprovação
- Feedbacks mais votados
- Usuários mais ativos
- Categorias mais populares
- Tempo médio de aprovação
- Taxa de implementação

## Acessibilidade

- ✅ Navegação por teclado
- ✅ Labels ARIA nos botões
- ✅ Contraste adequado de cores
- ✅ Estados de foco visíveis
- ✅ Textos alternativos para ícones

## Performance

- Índices otimizados para queries frequentes
- Paginação (implementação futura)
- Lazy loading de comentários
- Cache de contadores
- Debounce na busca

## Segurança

- ✅ RLS ativo em todas as tabelas
- ✅ Validação de tipos no banco
- ✅ Sanitização de inputs
- ✅ Rate limiting (via Supabase)
- ✅ Prevenção de SQL injection
- ✅ XSS protection

---

**Data de Criação**: 20 de novembro de 2025  
**Última Atualização**: 20 de novembro de 2025  
**Desenvolvido por**: Jason Ribeiro  
**Inspiração**: Design baseado em Canny.io e Linear
