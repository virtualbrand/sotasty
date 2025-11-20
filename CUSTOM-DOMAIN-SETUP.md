# Sistema de Domínio Personalizado - SoTasty

## 📋 Visão Geral

O sistema permite que clientes da SoTasty configurem seus próprios domínios personalizados para seus cardápios públicos, em vez de usar apenas `sotasty.com.br/seu-negocio`.

## 🏗️ Arquitetura

### 1. **Banco de Dados**

Três novos campos na tabela `profile_settings`:
- `custom_domain` (TEXT, UNIQUE): O domínio configurado (ex: cardapios.minhaconfeitaria.com.br)
- `custom_domain_verified` (BOOLEAN): Status da verificação DNS
- `custom_domain_verified_at` (TIMESTAMP): Data/hora da verificação

**Migração**: `/migrations/add_custom_domain_to_profile_settings.sql`

### 2. **API Endpoints**

#### `POST /api/profile-settings/verify-domain`
Verifica se o domínio está configurado corretamente via DNS.

**Verificações realizadas:**
1. **CNAME Record**: Verifica se aponta para `sotasty.com.br`
2. **A Record**: Verifica se aponta para o IP do servidor (fallback)

**Request:**
```json
{
  "domain": "cardapios.minhaconfeitaria.com.br"
}
```

**Response (Sucesso):**
```json
{
  "verified": true,
  "method": "CNAME",
  "domain": "cardapios.minhaconfeitaria.com.br",
  "message": "Domínio verificado com sucesso!"
}
```

**Response (Erro):**
```json
{
  "verified": false,
  "error": "Domínio não está apontando corretamente",
  "details": "Configure um registro CNAME apontando para sotasty.com.br"
}
```

#### `PATCH /api/profile-settings`
Atualizado para incluir o campo `custom_domain`.

### 3. **Interface do Usuário**

Localização: `/settings/profile` → Aba "Preferências"

**Componentes:**
- Input para domínio
- Botão "Verificar DNS"
- Status visual (verificado/erro)
- Instruções de configuração

## 🔧 Como Configurar (Para o Cliente)

### Passo 1: Adicionar Registro DNS

O cliente deve acessar o painel do provedor de domínio e criar:

**Opção A - CNAME (Recomendado):**
```
Tipo: CNAME
Nome: cardapios (ou subdomínio desejado)
Valor: sotasty.com.br
TTL: 3600
```

**Opção B - A Record:**
```
Tipo: A
Nome: cardapios (ou subdomínio desejado)
Valor: 191.252.xxx.xxx (IP do servidor)
TTL: 3600
```

### Passo 2: Aguardar Propagação

Tempo de propagação: 5 minutos a 48 horas (geralmente < 1 hora)

### Passo 3: Verificar no SoTasty

1. Acessar Settings > Perfil > Preferências
2. Digitar o domínio completo: `cardapios.minhaconfeitaria.com.br`
3. Clicar em "Verificar DNS"
4. Aguardar confirmação

## 🖥️ Configuração do Servidor (Para Você)

### 1. **Configurar o Servidor Web**

Você precisará configurar o servidor para aceitar múltiplos domínios.

#### Next.js + Vercel

No `next.config.ts`:
```typescript
const config: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: '(?!sotasty\\.com\\.br).*', // Qualquer domínio exceto sotasty.com.br
            },
          ],
          destination: '/api/custom-domain/:path*',
        },
      ],
    }
  },
}
```

#### Nginx

```nginx
server {
    listen 80;
    server_name *.sotasty.com.br sotasty.com.br;
    
    # Detectar custom domain
    set $custom_domain 0;
    if ($host != "sotasty.com.br") {
        set $custom_domain 1;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Custom-Domain $custom_domain;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. **Criar API para Resolver Custom Domain**

Crie `/app/api/custom-domain/[...path]/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  if (hostname === 'sotasty.com.br' || hostname.includes('localhost')) {
    return NextResponse.next()
  }
  
  // Buscar usuário pelo custom_domain
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('profile_settings')
    .select('user_id, custom_url_slug')
    .eq('custom_domain', hostname)
    .eq('custom_domain_verified', true)
    .single()
  
  if (!settings) {
    return NextResponse.json(
      { error: 'Domínio não encontrado ou não verificado' },
      { status: 404 }
    )
  }
  
  // Redirecionar para a página pública do usuário
  const url = new URL(request.url)
  return NextResponse.redirect(
    new URL(`/${settings.custom_url_slug}${url.pathname}`, request.url)
  )
}
```

### 3. **Configurar SSL/TLS**

Use Let's Encrypt com certbot para gerar certificados automaticamente:

```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Gerar certificado wildcard (para subdomínios)
sudo certbot certonly --manual --preferred-challenges dns \
  -d "*.sotasty.com.br" -d "sotasty.com.br"

# Ou usar DNS automático (se suportado pelo provedor)
sudo certbot --nginx -d sotasty.com.br -d "*.sotasty.com.br"
```

### 4. **Wildcard DNS**

Configure no seu provedor de DNS:

```
Tipo: A
Nome: *
Valor: [IP do servidor]
TTL: 3600
```

Isso permite que qualquer subdomínio aponte automaticamente para seu servidor.

## 🔒 Segurança

### Validações Implementadas:

1. **Formato do domínio**: Regex valida formato correto
2. **Unicidade**: Um domínio só pode ser usado por um usuário
3. **Verificação DNS**: Garante que o domínio realmente aponta para sotasty.com.br
4. **Autenticação**: Apenas o dono pode configurar seu domínio

### Proteções Necessárias:

- [ ] Rate limiting na API de verificação
- [ ] Logs de tentativas de verificação
- [ ] Alertas para domínios suspeitos
- [ ] Revalidação periódica (a cada 7 dias)

## 🧪 Testes

### Testar Localmente:

1. Adicione ao `/etc/hosts`:
```
127.0.0.1 cardapios.teste.local
```

2. Acesse: `http://cardapios.teste.local:3000`

### Testar DNS:

```bash
# Verificar CNAME
dig cardapios.minhaconfeitaria.com.br CNAME

# Verificar A record
dig cardapios.minhaconfeitaria.com.br A

# Verificar propagação global
https://www.whatsmydns.net/
```

## 📝 Próximos Passos

- [ ] Implementar revalidação automática de domínios
- [ ] Dashboard de status de domínios verificados
- [ ] Email de notificação quando DNS expirar
- [ ] Suporte para domínios raiz (sem subdomínio)
- [ ] Analytics separados por domínio
- [ ] Custom SSL para cada domínio (Let's Encrypt)

## 🐛 Troubleshooting

### Erro: "Domínio não está apontando corretamente"

**Causas possíveis:**
- DNS ainda não propagou (aguardar)
- Registro CNAME/A incorreto
- TTL muito alto (cache DNS)

**Solução:**
```bash
# Limpar cache DNS local
sudo dscacheutil -flushcache  # macOS
ipconfig /flushdns             # Windows
sudo systemd-resolve --flush-caches  # Linux
```

### Erro: "Este domínio já está sendo usado"

Outro usuário já configurou este domínio. Cada domínio é único no sistema.

### HTTPS não funciona no custom domain

1. Verificar se SSL está configurado para wildcard
2. Renovar certificado incluindo o novo domínio
3. Verificar configuração do servidor web

## 📚 Recursos Úteis

- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Next.js Rewrites](https://nextjs.org/docs/api-reference/next.config.js/rewrites)
