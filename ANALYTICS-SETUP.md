# Setup de Analytics

## Opção 1: PostHog (Recomendado)

### 1. Criar conta
1. Acesse https://posthog.com/
2. Crie uma conta gratuita
3. Crie um novo projeto

### 2. Obter chaves
1. No dashboard, vá em **Settings > Project**
2. Copie:
   - **Project API Key** → `NEXT_PUBLIC_POSTHOG_KEY`
   - **Instance Address** → `NEXT_PUBLIC_POSTHOG_HOST` (geralmente https://app.posthog.com)

### 3. Adicionar ao .env.local
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 4. Adicionar Provider ao layout
Em `app/layout.tsx`:
```tsx
import { PostHogProvider } from '@/components/PostHogProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
```

### 5. Recursos do PostHog

#### Session Replay
Veja exatamente o que o usuário fez na tela:
- Gravação automática de sessões
- Replay de bugs e problemas
- Console logs capturados

#### Heatmaps
Veja onde os usuários clicam mais:
- Cliques por página
- Scrolling behavior
- Rage clicks (cliques frustrados)

#### Funnels
Analise conversão entre etapas:
- Trial → Conversão
- Cadastro → Primeiro produto
- Produto criado → Pedido criado

#### Feature Flags
Controle features por usuário:
```tsx
import { useFeatureFlagEnabled } from 'posthog-js/react'

function MyComponent() {
  const newFeatureEnabled = useFeatureFlagEnabled('new-feature')
  
  if (newFeatureEnabled) {
    return <NewFeature />
  }
  return <OldFeature />
}
```

#### A/B Testing
Teste variações:
```tsx
const variant = posthog.getFeatureFlag('pricing-test')
if (variant === 'test') {
  // Mostrar preço teste
} else {
  // Mostrar preço controle
}
```

## Métricas Importantes para SaaS

### 1. Engajamento
- **DAU/MAU Ratio** - Quantos usuários ativos diários vs mensais
- **Stickiness** - Frequência de retorno
- **Features mais usadas** - Quais funcionalidades são populares
- **Features menos usadas** - Candidatas para remoção

### 2. Retenção
- **Day 1, 7, 30 Retention** - Quantos voltam após X dias
- **Cohort Analysis** - Como diferentes grupos se comportam
- **Churn Triggers** - O que acontece antes de cancelar

### 3. Conversão
- **Trial to Paid** - Taxa de conversão do trial
- **Time to Value** - Quanto tempo até primeiro valor
- **Activation Rate** - Quantos completam onboarding

### 4. Product
- **Page Load Times** - Performance
- **Error Rate** - Bugs e problemas
- **Feature Adoption** - Adoção de novas features

## Eventos Customizados

### Exemplo: Rastrear criação de produto
```tsx
import { trackProductCreated } from '@/lib/analytics/events'

async function handleCreateProduct(data) {
  const product = await createProduct(data)
  trackProductCreated(product.id, product.category)
}
```

### Exemplo: Rastrear uso de feature
```tsx
import { trackFeatureUsed } from '@/lib/analytics/events'

function handleExportReport() {
  trackFeatureUsed('export_report', { format: 'pdf' })
  // ... export logic
}
```

## Dashboard SuperAdmin

Crie uma página de analytics para o superadmin ver:

```tsx
// app/(dashboard)/analytics/page.tsx
'use client'

import { useEffect, useState } from 'react'

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState({
    dau: 0,
    mau: 0,
    topFeatures: [],
    activeUsers: [],
  })

  useEffect(() => {
    // Buscar métricas do PostHog ou banco
    fetchAnalytics()
  }, [])

  return (
    <div className="p-8">
      <h1>Analytics</h1>
      {/* Mostrar gráficos e métricas */}
    </div>
  )
}
```

## Queries Úteis

### Features mais usadas (últimos 30 dias)
```sql
SELECT 
  feature_name,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users
FROM feature_usage
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY feature_name
ORDER BY usage_count DESC
LIMIT 10;
```

### Tempo médio de sessão por usuário
```sql
SELECT 
  user_id,
  AVG(duration_seconds) as avg_session_duration,
  COUNT(*) as session_count
FROM user_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY avg_session_duration DESC;
```

### Usuários mais ativos
```sql
SELECT 
  u.id,
  p.email,
  COUNT(DISTINCT DATE(ae.created_at)) as active_days,
  COUNT(ae.id) as total_events
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN analytics_events ae ON ae.user_id = u.id
WHERE ae.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, p.email
ORDER BY active_days DESC
LIMIT 20;
```

## Alertas Automáticos

Configure alertas no PostHog para:
- ⚠️ Usuário em trial sem atividade há 3 dias
- 🔥 Spike de erros (>10 em 1 hora)
- 📉 Drop significativo em DAU
- ⏱️ Tempo de carregamento >3s

## Privacidade

- ❌ Não rastreie dados sensíveis (senhas, cartões)
- ✅ Anonimize IPs se necessário
- ✅ Permita usuários optarem out
- ✅ Siga LGPD/GDPR
