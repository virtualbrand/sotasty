# Página de Ajuda - SoTasty

## Visão Geral

A página de Ajuda do SoTasty foi criada para fornecer aos usuários acesso rápido e organizado a documentação e tutoriais sobre todas as funcionalidades do sistema.

## Localização

📁 `/app/(dashboard)/help/page.tsx`

## Design e Layout

### Estrutura

A página segue o design apresentado na imagem de referência, com:

1. **Header Principal**
   - Título: "Como podemos te ajudar?"
   - Barra de busca centralizada

2. **Layout de Duas Colunas**
   - **Sidebar Esquerda**: Menu lateral com tópicos organizados por features
   - **Conteúdo Principal**: Área de exibição dos artigos de ajuda

### Sidebar (Menu Lateral)

- **Collapsível**: Pode ser minimizada clicando no botão de toggle
- **Organização por Features**: Os tópicos estão agrupados por módulos do sistema
- **Sticky**: Permanece visível ao rolar a página
- **Design Limpo**: Ícones coloridos e hierarquia visual clara

#### Features Organizadas:

1. 📊 Dashboard
2. 🏷️ Produtos
3. 📖 Cardápios
4. 🛒 Pedidos
5. 💰 Financeiro
6. 💬 Mensagens
7. 💭 Atendimento
8. 👥 Clientes
9. 📅 Agenda
10. ⚙️ Configurações

## Funcionalidades

### 1. Busca Inteligente
- Busca em tempo real nos títulos dos tópicos
- Filtragem automática do menu lateral
- Feedback visual quando nenhum resultado é encontrado

### 2. Navegação
- Clique em qualquer tópico para visualizar o conteúdo
- Indicação visual do tópico ativo
- Transições suaves entre conteúdos

### 3. Conteúdo Rico
Cada artigo de ajuda contém:
- Título principal
- Texto explicativo
- Listas ordenadas e não ordenadas
- Caixas de destaque (dicas, avisos, boas práticas)
- Ícones ilustrativos

### 4. Seção de Suporte
No final de cada artigo:
- Link para envio de e-mail
- Botão de contato via WhatsApp
- Mensagem incentivando o contato

## Tópicos Disponíveis

### Dashboard (3 tópicos)
- Visão Geral do Dashboard
- Widgets e Estatísticas
- Personalização

### Produtos (5 tópicos)
- Adicionar Novos Produtos
- Categorias e Subcategorias
- Receitas Base
- Gerenciar Ingredientes
- Precificação

### Cardápios (4 tópicos)
- Criar Cardápio
- Personalizar Design
- Publicar e Compartilhar
- Gerar QR Code

### Pedidos (4 tópicos)
- Receber Pedidos
- Gerenciar Status
- Histórico de Pedidos
- Configurações de Pedidos

### Financeiro (5 tópicos)
- Visão Geral Financeira
- Transações
- Categorias Financeiras
- Relatórios
- Integração com Stripe

### Mensagens (4 tópicos)
- Caixa de Entrada
- Enviar Mensagens
- Modelos de Mensagens
- Integração WhatsApp

### Atendimento (3 tópicos)
- Chat ao Vivo
- Sistema de Tickets
- Configurações de Atendimento

### Clientes (4 tópicos)
- Adicionar Clientes
- Gerenciar Informações
- Histórico de Compras
- Importar Clientes

### Agenda (4 tópicos)
- Criar Eventos
- Gerenciar Compromissos
- Lembretes
- Sincronização

### Configurações (6 tópicos)
- Perfil e Informações
- Dados do Estabelecimento
- Horários de Funcionamento
- Preferências
- Gerenciar Usuários
- Notificações

## Design System

### Cores Utilizadas

As cores seguem o design system do SoTasty:

- **Clay (Primary)**: `var(--color-clay-500)` - Tons de terracota
- **Success**: `var(--color-success-500)` - Verde para dicas de sucesso
- **Info**: `var(--color-info-500)` - Azul para informações
- **Warning**: `var(--color-warning-500)` - Amarelo para avisos
- **Danger**: `var(--color-danger-500)` - Vermelho para alertas

### Tipografia

- **Fonte**: Kumbh Sans
- **Tamanhos**:
  - Título principal: `4xl` (36px)
  - Títulos de seção: `3xl` (30px)
  - Subtítulos: `lg` (18px)
  - Texto normal: `base` (16px)
  - Texto pequeno: `sm` (14px)

### Espaçamentos

- Padding do container: `8` (32px)
- Gap entre sidebar e conteúdo: `6` (24px)
- Espaçamento vertical entre elementos: `4` (16px)

## Estados Interativos

### Sidebar Toggle
- **Expandida**: Largura de 320px (w-80)
- **Colapsada**: Largura de 64px (w-16)
- **Transição**: Suave de 300ms

### Tópicos
- **Normal**: Texto cinza, fundo branco
- **Hover**: Fundo cinza claro
- **Ativo**: Fundo clay-50, texto clay-700, borda esquerda clay-500

## Responsividade

A página é totalmente responsiva:
- Desktop: Layout de duas colunas
- Tablet: Sidebar pode ser colapsada para mais espaço
- Mobile: (A implementar) Sidebar em drawer/modal

## Como Adicionar Novos Tópicos

### 1. Adicionar ao Array `helpTopics`

```typescript
{
  id: 'feature-id',
  title: 'Nome da Feature',
  icon: IconComponent, // from lucide-react
  topics: [
    { 
      id: 'topic-unique-id', 
      title: 'Título do Tópico', 
      slug: 'topic-slug' 
    }
  ]
}
```

### 2. Adicionar Conteúdo em `helpContent`

```typescript
'topic-unique-id': {
  title: 'Título do Tópico',
  content: (
    <div className="space-y-4">
      <p className="text-gray-700">
        Seu conteúdo aqui...
      </p>
      {/* Mais conteúdo */}
    </div>
  )
}
```

## Melhorias Futuras

### Planejadas
- [ ] Implementar busca por conteúdo (não apenas títulos)
- [ ] Adicionar breadcrumbs
- [ ] Histórico de navegação
- [ ] Tópicos favoritos/marcados
- [ ] Feedback "Este artigo foi útil?"
- [ ] Analytics de tópicos mais acessados
- [ ] Vídeos tutoriais
- [ ] GIFs demonstrativos
- [ ] Versão mobile otimizada
- [ ] Exportar artigo como PDF
- [ ] Modo escuro

### Possíveis
- [ ] Chat de ajuda integrado
- [ ] Sugestões de artigos relacionados
- [ ] Comentários e perguntas nos artigos
- [ ] Índice de conteúdo (table of contents)
- [ ] Sistema de versões (para atualizações)

## Acessibilidade

A página implementa boas práticas de acessibilidade:
- Navegação por teclado
- Contraste adequado de cores
- Textos alternativos para ícones
- Hierarquia semântica de headings
- Foco visível em elementos interativos

## Performance

- Componente client-side para interatividade
- Filtros com useMemo para otimização
- Lazy loading pode ser implementado para conteúdos grandes
- Imagens otimizadas (quando adicionadas)

## Contato de Suporte

Os contatos exibidos na página:
- **E-mail**: suporte@sotasty.com
- **WhatsApp**: +55 48 99917-8752

---

**Data de Criação**: 20 de novembro de 2025
**Última Atualização**: 20 de novembro de 2025
**Desenvolvido por**: Jason Ribeiro
