# Configuração do Stripe

## 1. Criar conta no Stripe
1. Acesse https://dashboard.stripe.com/register
2. Crie sua conta
3. Ative o modo de teste

## 2. Obter chaves de API
1. No Dashboard do Stripe, vá em **Developers > API keys**
2. Copie:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

## 3. Criar produtos e preços
1. No Dashboard, vá em **Products**
2. Crie 3 produtos:

### Start - R$ 97/mês
- Nome: "CakeCloud Start"
- Preço: R$ 97,00
- Recorrência: Mensal
- Copie o **Price ID** → `STRIPE_PRICE_START`

### Grow - R$ 197/mês
- Nome: "CakeCloud Grow"
- Preço: R$ 197,00
- Recorrência: Mensal
- Copie o **Price ID** → `STRIPE_PRICE_GROW`

### Scale - R$ 397/mês
- Nome: "CakeCloud Scale"
- Preço: R$ 397,00
- Recorrência: Mensal
- Copie o **Price ID** → `STRIPE_PRICE_SCALE`

## 4. Configurar Webhook
1. No Dashboard, vá em **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://seu-dominio.com/api/stripe/webhook`
4. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copie o **Signing secret** → `STRIPE_WEBHOOK_SECRET`

## 5. Configurar variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha com suas chaves:

```bash
cp .env.local.example .env.local
```

## 6. Executar migration
```bash
# Conecte ao Supabase e execute o SQL em migrations/add_stripe_fields.sql
```

## 7. Testar webhooks localmente
Use o Stripe CLI para testar webhooks no ambiente local:

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escutar webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Em outro terminal, testar evento
stripe trigger checkout.session.completed
```

## 8. Fluxo de pagamento

### Para clientes
1. Cliente escolhe um plano
2. Clique em "Assinar"
3. Redirecionado para checkout do Stripe
4. Preenche dados do cartão
5. Inicia trial de 14 dias gratuito
6. Após 14 dias, cobra automaticamente

### Status da assinatura
- `trialing` - Em período de trial (14 dias)
- `active` - Pagamento bem-sucedido, assinatura ativa
- `past_due` - Falha no pagamento, tentando novamente
- `canceled` - Assinatura cancelada
- `incomplete` - Pagamento incompleto

## 9. Próximos passos
- [ ] Criar página de seleção de planos
- [ ] Adicionar botão de checkout
- [ ] Criar portal do cliente (gerenciar assinatura)
- [ ] Implementar lógica de limites por plano
- [ ] Adicionar notificações de cobrança
- [ ] Configurar emails transacionais
