# Configuração do Webhook WhatsApp API Oficial

Este guia explica como configurar o webhook para receber mensagens da API Oficial do WhatsApp.

## Pré-requisitos

1. Conta Meta Business configurada
2. App do WhatsApp Business criado no Meta for Developers
3. Número de telefone aprovado e conectado
4. Aplicação Sotasty rodando em produção (com HTTPS)

## Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env.local`:

```env
# Webhook Verification Token (crie um token aleatório seguro)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu_token_aleatorio_aqui

# Supabase Service Role Key (para operações server-side no webhook)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

## Configuração no Meta for Developers

### 1. Acessar Configurações do Webhook

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Selecione seu App
3. No menu lateral, clique em **WhatsApp** > **Configuração**
4. Role até a seção **Webhooks**

### 2. Configurar URL do Webhook

**URL do Webhook (Callback URL):**
```
https://seu-dominio.com/api/whatsapp/webhook
```

**Token de Verificação:**
```
seu_token_aleatorio_aqui
```
(O mesmo que você definiu em `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)

### 3. Assinar Campos de Webhook

Marque os seguintes campos para receber notificações:

- ✅ **messages** - Mensagens recebidas
- ✅ **message_status** - Status de entrega (enviado, entregue, lido)

### 4. Verificar Webhook

Clique em **Verificar e salvar**. O Meta irá fazer uma requisição GET para sua URL para validar o webhook.

## Testando o Webhook

### 1. Teste Local com ngrok (Desenvolvimento)

Para testar localmente, use o ngrok:

```bash
# Instalar ngrok (se não tiver)
brew install ngrok  # macOS
# ou baixe em https://ngrok.com/download

# Executar ngrok
ngrok http 3000

# Use a URL do ngrok no Meta (ex: https://abc123.ngrok.io/api/whatsapp/webhook)
```

### 2. Enviar Mensagem de Teste

1. Envie uma mensagem para o número do WhatsApp Business configurado
2. Verifique os logs do servidor:

```bash
# Terminal onde o Next.js está rodando
# Deve aparecer: "Webhook recebido: ..." e "Mensagem salva com sucesso: ..."
```

3. Verifique no banco de dados:

```sql
SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 10;
```

## Estrutura do Webhook

O webhook recebe dois tipos de eventos:

### 1. Mensagens Recebidas

Quando alguém envia uma mensagem para seu número:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "messages": [{
          "id": "wamid.XXX",
          "from": "5511999999999",
          "timestamp": "1234567890",
          "type": "text",
          "text": {
            "body": "Olá!"
          }
        }],
        "contacts": [{
          "profile": {
            "name": "João Silva"
          }
        }]
      }
    }]
  }]
}
```

### 2. Status de Mensagens

Quando uma mensagem enviada muda de status:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "statuses": [{
          "id": "wamid.XXX",
          "status": "delivered",
          "timestamp": "1234567890"
        }]
      }
    }]
  }]
}
```

## Segurança

### 1. Validação de Requisições

O webhook valida:
- Token de verificação (GET)
- Estrutura do payload (POST)
- Origem das requisições (do Meta)

### 2. Autenticação

- Usa Supabase Service Role Key para operações sem contexto de usuário
- Valida phone_number_id para identificar o usuário correto

### 3. Rate Limiting

Configure rate limiting no seu servidor:

```typescript
// middleware.ts ou similar
export function middleware(request: NextRequest) {
  // Implementar rate limiting para /api/whatsapp/webhook
}
```

## Troubleshooting

### Webhook não está recebendo mensagens

1. **Verifique a URL:**
   - Deve ser HTTPS
   - Deve estar acessível publicamente
   - Responder com status 200

2. **Verifique os logs:**
   ```bash
   # Ver logs do servidor
   vercel logs  # Se usar Vercel
   # ou
   pm2 logs  # Se usar PM2
   ```

3. **Teste manualmente:**
   ```bash
   curl -X GET "https://seu-dominio.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=seu_token&hub.challenge=123"
   ```

### Mensagens não aparecem no chat

1. **Verifique o banco de dados:**
   ```sql
   SELECT * FROM whatsapp_messages WHERE user_id = 'seu-user-id' ORDER BY created_at DESC;
   ```

2. **Verifique a configuração:**
   ```sql
   SELECT * FROM whatsapp_config WHERE user_id = 'seu-user-id';
   ```

3. **Verifique os logs do webhook:**
   - "Webhook recebido: ..." ✅
   - "Mensagem salva com sucesso: ..." ✅

### Erros comuns

**"Nenhuma configuração encontrada"**
- O usuário não configurou a API Oficial ou está desconectado

**"Configuração não encontrada para phone_number_id"**
- O phone_number_id do webhook não corresponde ao configurado

**"Erro ao salvar mensagem"**
- Problema com RLS do Supabase
- Problema com os campos da tabela

## Monitoramento

### Logs Importantes

```typescript
// Ver no console do servidor
"Webhook recebido: ..." // Payload completo
"Mensagem salva com sucesso: <message_id>" // Sucesso
"Status atualizado: <message_id> <status>" // Status atualizado
```

### Métricas Sugeridas

- Taxa de sucesso de webhooks
- Latência de processamento
- Mensagens recebidas vs. salvas
- Erros por tipo

## Próximos Passos

1. ✅ Configurar webhook
2. ✅ Receber mensagens
3. 🔄 Implementar notificações em tempo real (WebSocket ou polling)
4. 🔄 Implementar download de mídias
5. 🔄 Implementar respostas automáticas

## Suporte

Para mais informações:
- [Documentação WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Webhooks do WhatsApp Business](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
