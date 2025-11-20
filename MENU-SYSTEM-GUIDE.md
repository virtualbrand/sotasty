# Sistema de Cardápios com URL Personalizada

## Visão Geral

Sistema completo para criação e gerenciamento de cardápios digitais com URLs personalizadas, permitindo que clientes acessem os cardápios através de links amigáveis.

## Estrutura de URLs

### Formato da URL Pública
```
https://sotasty.com.br/{custom_url_slug}/{menu_url_slug}
```

### Exemplo
```
https://sotasty.com.br/conto-atelier/cardapio-bolos
```

Onde:
- `conto-atelier` - URL personalizada do negócio (definida em Configurações)
- `cardapio-bolos` - URL específica do cardápio

## Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. `profile_settings`
Configurações do perfil do usuário/negócio.

**Campos principais:**
- `custom_url_slug` - URL personalizada do negócio (ex: "conto-atelier")
- `business_name` - Nome do negócio
- `logo_url` - URL do logo
- `primary_color` / `secondary_color` - Cores do tema
- `whatsapp_number` - WhatsApp para contato
- `instagram_handle` - Instagram do negócio

#### 2. `menus`
Cardápios criados pelos usuários.

**Campos principais:**
- `name` - Nome do cardápio
- `url_slug` - URL específica do cardápio (ex: "cardapio-bolos")
- `active` - Se o cardápio está ativo/público
- `display_order` - Ordem de exibição

#### 3. `menu_items`
Itens/produtos dentro de cada cardápio.

**Campos principais:**
- `menu_id` - Referência ao cardápio
- `product_id` - Referência opcional ao produto do catálogo
- `name`, `description`, `price` - Dados do item
- `image_url` - Imagem do item
- `available` - Se o item está disponível
- `display_order` - Ordem de exibição

#### 4. `menu_categories`
Categorias para organizar os itens do cardápio (opcional).

#### 5. `menu_views`
Analytics de visualizações dos cardápios (rastreamento).

## API Endpoints

### Gerenciamento de Cardápios (Autenticado)

#### `GET /api/menus`
Lista todos os cardápios do usuário autenticado.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Cardápio de Bolos",
    "description": "Nossos deliciosos bolos",
    "url_slug": "cardapio-bolos",
    "active": true,
    "items": [...],
    "itemCount": 5
  }
]
```

#### `POST /api/menus`
Cria um novo cardápio.

**Body:**
```json
{
  "name": "Cardápio de Bolos",
  "description": "Nossos deliciosos bolos"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Cardápio de Bolos",
  "url_slug": "cardapio-bolos",
  "active": true,
  ...
}
```

#### `GET /api/menus/[id]`
Busca um cardápio específico com todos os itens.

#### `PATCH /api/menus/[id]`
Atualiza um cardápio.

**Body:**
```json
{
  "name": "Novo Nome",
  "description": "Nova descrição",
  "active": true
}
```

#### `DELETE /api/menus/[id]`
Exclui um cardápio.

### Configurações de Perfil (Autenticado)

#### `GET /api/profile-settings`
Busca as configurações do perfil do usuário.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "business_name": "Conto Atelier",
  "custom_url_slug": "conto-atelier",
  "logo_url": "https://...",
  "primary_color": "#B3736B",
  "whatsapp_number": "5511999999999",
  ...
}
```

#### `PATCH /api/profile-settings`
Atualiza as configurações do perfil.

**Body:**
```json
{
  "business_name": "Conto Atelier",
  "custom_url_slug": "conto-atelier",
  "whatsapp_number": "5511999999999",
  "instagram_handle": "@contoatelier"
}
```

### Acesso Público ao Cardápio

#### `GET /api/public/menu/[slug]/[menuSlug]`
Acesso público a um cardápio específico (sem autenticação).

**Exemplo:**
```
GET /api/public/menu/conto-atelier/cardapio-bolos
```

**Response:**
```json
{
  "menu": {
    "id": "uuid",
    "name": "Cardápio de Bolos",
    "description": "...",
    "active": true
  },
  "business": {
    "name": "Conto Atelier",
    "logo_url": "https://...",
    "whatsapp_number": "5511999999999",
    "instagram_handle": "@contoatelier",
    "primary_color": "#B3736B",
    "secondary_color": "#E79F9C"
  },
  "items": [
    {
      "id": "uuid",
      "name": "Bolo de Chocolate",
      "description": "...",
      "price": 45.00,
      "image_url": "https://...",
      "available": true
    }
  ],
  "categories": [...]
}
```

## Funcionalidades Principais

### 1. Geração Automática de Slugs
A função `generate_unique_slug()` do banco de dados:
- Converte o nome para minúsculas
- Remove acentos e caracteres especiais
- Substitui espaços por hífens
- Garante unicidade adicionando números se necessário

### 2. Row Level Security (RLS)
- Usuários só podem ver/editar seus próprios cardápios
- Cardápios públicos (`active = true`) são acessíveis a todos
- Analytics são registrados sem autenticação

### 3. Analytics
- Toda visualização pública é registrada em `menu_views`
- Captura IP, User Agent e Referrer
- Permite análise de tráfego e origem dos visitantes

## Fluxo de Uso

### Para o Dono do Negócio

1. **Configurar URL Personalizada**
   - Ir em `/settings/preferences`
   - Definir `custom_url_slug` (ex: "conto-atelier")
   - Configurar nome do negócio, logo, cores, etc.

2. **Criar Cardápio**
   - Ir em `/cardapios`
   - Clicar em "+ Novo Cardápio"
   - Nome e descrição são convertidos automaticamente em URL

3. **Adicionar Itens ao Cardápio**
   - Selecionar produtos existentes ou criar novos
   - Definir preços, descrições, imagens
   - Organizar ordem de exibição

4. **Compartilhar URL**
   - URL final: `sotasty.com.br/conto-atelier/cardapio-bolos`
   - Compartilhar nas redes sociais, WhatsApp, etc.

### Para os Clientes

1. Acessar URL pública do cardápio
2. Ver produtos com preços e imagens
3. Entrar em contato via WhatsApp ou Instagram
4. Fazer pedidos diretamente

## Migrações

### Aplicar no Supabase

1. Acesse o SQL Editor no Supabase
2. Execute o arquivo `/migrations/create_menus_system.sql`
3. Verifique se as tabelas foram criadas com sucesso

### Verificar Estrutura

```sql
-- Listar tabelas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'menu%' OR tablename = 'profile_settings';

-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## Próximos Passos

### Implementação na Interface

1. **Página de Cardápios** (`/cardapios`)
   - ✅ Lista de cardápios
   - ✅ Criar novo cardápio
   - ⬜ Editar cardápio
   - ⬜ Gerenciar itens
   - ⬜ Visualizar analytics

2. **Página de Configurações** (`/settings/preferences`)
   - ⬜ Campo para custom_url_slug
   - ⬜ Validação em tempo real
   - ⬜ Preview da URL final

3. **Página Pública do Cardápio** (`/[slug]/[menuSlug]`)
   - ⬜ Layout público otimizado
   - ⬜ Responsivo mobile-first
   - ⬜ Tema customizável com cores do perfil
   - ⬜ Botões de WhatsApp e Instagram
   - ⬜ Compartilhamento social

4. **Analytics**
   - ⬜ Dashboard de visualizações
   - ⬜ Gráficos de acessos por período
   - ⬜ Origem do tráfego

## Validações

### custom_url_slug
- Apenas letras minúsculas, números e hífens
- Não pode começar ou terminar com hífen
- Deve ser único no sistema
- Regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$`

### url_slug (menus)
- Mesmo formato do custom_url_slug
- Único por usuário
- Gerado automaticamente a partir do nome

## Segurança

- RLS habilitado em todas as tabelas
- Validação de propriedade em todas as operações
- URLs públicas só mostram cardápios ativos
- Analytics não expõem dados sensíveis

## Performance

- Índices em todas as colunas de busca
- Função RPC para busca pública otimizada
- Cache recomendado no frontend
- Paginação para listas grandes
