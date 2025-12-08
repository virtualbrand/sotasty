# Sistema de Gerenciamento de Trial Configurável

Sistema completo para gerenciar períodos de trial configuráveis e alertas customizados para usuários em período de teste.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
- [Configuração Inicial](#configuração-inicial)
- [Uso do Sistema](#uso-do-sistema)
- [API Endpoints](#api-endpoints)
- [Componentes e Hooks](#componentes-e-hooks)
- [Gerenciamento de Alertas](#gerenciamento-de-alertas)

## 🎯 Visão Geral

O sistema permite:

1. **Período de trial configurável** por banco de dados (padrão: 7 dias)
2. **Trial customizável por usuário** - cada usuário pode ter um período diferente
3. **Alertas automáticos** quando o trial está chegando ao fim
4. **Banners customizados** para campanhas e promoções
5. **Histórico de alertas** para analytics

## 🗄️ Estrutura do Banco de Dados

### Tabela: `system_settings`

Configurações globais do sistema.

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Configurações padrão:**
- `default_trial_days`: `{"days": 7}` - Número padrão de dias de trial
- `trial_alert_thresholds`: `{"warning_days": [4, 3, 1], "critical_days": [1]}` - Quando mostrar alertas

### Campos Adicionados: `profiles`

```sql
ALTER TABLE profiles
ADD COLUMN trial_days INTEGER DEFAULT 7,
ADD COLUMN trial_start_date TIMESTAMPTZ,
ADD COLUMN trial_end_date TIMESTAMPTZ,
ADD COLUMN is_trial_active BOOLEAN DEFAULT false;
```

**Campos:**
- `trial_start_date`: Data de início do trial (fixo)
- `trial_end_date`: Data de término (fixo - calculado no signup)
- `is_trial_active`: Status do trial (atualizado automaticamente quando expira)

### Como funciona o sistema simplificado

O sistema usa apenas **datas fixas** (`trial_end_date`) e calcula dias restantes dinamicamente:
1. **No signup**: Define `trial_end_date` = hoje + 7 dias (ou configurável)
2. **Trigger automático**: Desativa `is_trial_active` quando `trial_end_date < NOW()`
3. **View de alertas**: Calcula dias restantes on-demand via `get_trial_days_remaining()`

**Vantagens:**
- ✅ **Zero manutenção**: Não precisa atualizar nenhum contador
- ✅ **Performance**: Sem cron jobs, sem triggers pesados
- ✅ **Simples**: Apenas uma data fixa
- ✅ **Confiável**: Baseado em timestamp, não pode dessincorinizar

### Tabela: `trial_alerts`

Alertas e banners customizados.

```sql
CREATE TABLE trial_alerts (
  id UUID PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'trial_ending', 'trial_expired', 'custom', 'feature_promotion'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  trigger_days INTEGER, -- Dias antes do fim do trial (null para custom)
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  show_cta BOOLEAN DEFAULT true,
  cta_text TEXT DEFAULT 'Assinar agora',
  cta_link TEXT DEFAULT '/settings/billing',
  background_color TEXT DEFAULT '#FEF3C7',
  text_color TEXT DEFAULT '#92400E',
  icon TEXT DEFAULT 'alert-circle',
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'all', -- 'all', 'trial', 'specific_users'
  target_user_ids JSONB,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `alert_history`

Histórico de alertas exibidos aos usuários.

```sql
CREATE TABLE alert_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  action_taken TEXT, -- 'clicked_cta', 'dismissed', 'ignored'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### View: `user_active_alerts`

View que retorna automaticamente os alertas ativos para cada usuário.

```sql
CREATE VIEW user_active_alerts AS
SELECT 
  p.id as user_id,
  p.trial_end_date,
  p.is_trial_active,
  get_trial_days_remaining(p.id) as days_remaining,
  ta.id as alert_id,
  ta.alert_type,
  ta.title,
  REPLACE(ta.message, '{days}', get_trial_days_remaining(p.id)::TEXT) as message,
  ...
FROM profiles p
CROSS JOIN trial_alerts ta
WHERE ta.is_active = true
  AND (conditions...)
```

## 🚀 Configuração Inicial

### 1. Executar Migration

```bash
# No Supabase SQL Editor ou via CLI
psql -h your-db-host -U postgres -d postgres -f migrations/add_trial_management_system.sql
```

### 2. Adicionar TrialBanner ao Layout

```tsx
// app/(dashboard)/layout.tsx
import TrialBanner from '@/components/TrialBanner'

export default function DashboardLayout({ children }) {
  return (
    <div>
      <TrialBanner />
      {/* Resto do layout */}
      {children}
    </div>
  )
}
```

## 💻 Uso do Sistema

### Hook: `useTrialStatus`

```tsx
import { useTrialStatus } from '@/hooks/useTrialStatus'

function MyComponent() {
  const {
    isActive,       // boolean - Trial está ativo?
    daysRemaining,  // number | null - Dias restantes
    startDate,      // string | null
    endDate,        // string | null
    alerts,         // TrialAlert[] - Alertas ativos
    isLoading,      // boolean
    error,          // string | null
    // Métodos
    markAlertAsShown,
    dismissAlert,
    handleCtaClick,
    refresh
  } = useTrialStatus()

  if (isLoading) return <div>Carregando...</div>
  
  return (
    <div>
      {isActive && (
        <p>Seu trial termina em {daysRemaining} dias</p>
      )}
    </div>
  )
}
```

### Componente: `TrialBanner`

Exibe automaticamente o alerta de maior prioridade para o usuário.

```tsx
import TrialBanner from '@/components/TrialBanner'

// No layout ou página
<TrialBanner />
```

## 🔌 API Endpoints

### GET `/api/system/settings`

Obter todas as configurações do sistema (apenas superadmin).

```bash
# Todas as configurações
GET /api/system/settings

# Configuração específica
GET /api/system/settings?key=default_trial_days
```

**Response:**
```json
{
  "settings": [
    {
      "id": "uuid",
      "setting_key": "default_trial_days",
      "setting_value": {"days": 7},
      "description": "Número padrão de dias de trial",
      "created_at": "2025-12-07T00:00:00Z",
      "updated_at": "2025-12-07T00:00:00Z"
    }
  ]
}
```

### PUT `/api/system/settings`

Atualizar configuração (apenas superadmin).

```bash
PUT /api/system/settings
Content-Type: application/json

{
  "setting_key": "default_trial_days",
  "setting_value": {"days": 14},
  "description": "Atualizado para 14 dias"
}
```

### POST `/api/system/settings`

Criar nova configuração (apenas superadmin).

```bash
POST /api/system/settings
Content-Type: application/json

{
  "setting_key": "custom_feature_flag",
  "setting_value": {"enabled": true},
  "description": "Feature flag customizada"
}
```

### DELETE `/api/system/settings`

Deletar configuração (apenas superadmin, exceto configurações protegidas).

```bash
DELETE /api/system/settings?key=custom_feature_flag
```

## 🎨 Gerenciamento de Alertas

### Criar Alerta de Trial Ending

```sql
INSERT INTO trial_alerts (
  alert_type,
  title,
  message,
  trigger_days,
  priority,
  show_cta,
  cta_text,
  background_color,
  text_color,
  icon,
  applies_to
) VALUES (
  'trial_ending',
  'Seu trial está acabando!',
  'Faltam {days} dias para o fim do seu período de teste.',
  3, -- Mostrar 3 dias antes
  'high',
  true,
  'Ver planos',
  '#FEF3C7',
  '#92400E',
  'clock',
  'trial'
);
```

### Criar Banner Customizado

```sql
INSERT INTO trial_alerts (
  alert_type,
  title,
  message,
  priority,
  show_cta,
  cta_text,
  cta_link,
  background_color,
  text_color,
  icon,
  applies_to,
  start_date,
  end_date
) VALUES (
  'feature_promotion',
  '🎉 Nova funcionalidade disponível!',
  'Agora você pode integrar com WhatsApp Business!',
  'medium',
  true,
  'Saiba mais',
  '/settings/integrations',
  '#DBEAFE',
  '#1E40AF',
  'sparkles',
  'all',
  NOW(),
  NOW() + INTERVAL '7 days'
);
```

### Criar Alerta para Usuários Específicos

```sql
INSERT INTO trial_alerts (
  alert_type,
  title,
  message,
  priority,
  show_cta,
  cta_text,
  cta_link,
  background_color,
  text_color,
  applies_to,
  target_user_ids
) VALUES (
  'custom',
  'Oferta especial para você!',
  'Ganhe 50% de desconto no primeiro mês.',
  'high',
  true,
  'Resgatar oferta',
  '/settings/billing',
  '#FEF3C7',
  '#92400E',
  'specific_users',
  '["user-uuid-1", "user-uuid-2"]'::jsonb
);
```

## 🔧 Customização de Trial por Usuário

### Customizar trial por usuário (via SQL)

```sql
-- Dar 30 dias de trial para um usuário específico
UPDATE profiles
SET 
  trial_start_date = NOW(),
  trial_end_date = NOW() + INTERVAL '30 days',
  is_trial_active = true
WHERE id = 'user-uuid';

-- Verificar dias restantes
SELECT 
  full_name,
  trial_end_date,
  get_trial_days_remaining(id) as dias_restantes
FROM profiles
WHERE id = 'user-uuid';
```

### Via API (futuro - painel superadmin)

```typescript
// Exemplo de como seria a implementação
await fetch('/api/users/trial', {
  method: 'PUT',
  body: JSON.stringify({
    user_id: 'user-uuid',
    trial_days: 30
  })
})
```

## 📊 Análise de Alertas

### Ver alertas mais exibidos

```sql
SELECT 
  ta.title,
  ta.alert_type,
  COUNT(ah.id) as times_shown,
  COUNT(CASE WHEN ah.action_taken = 'clicked_cta' THEN 1 END) as clicks,
  COUNT(CASE WHEN ah.action_taken = 'dismissed' THEN 1 END) as dismissals
FROM trial_alerts ta
LEFT JOIN alert_history ah ON ta.id = ah.alert_id
WHERE ta.is_active = true
GROUP BY ta.id, ta.title, ta.alert_type
ORDER BY times_shown DESC;
```

### Ver usuários que não converteram após trial

```sql
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.trial_end_date,
  p.subscription_status
FROM profiles p
WHERE 
  p.trial_end_date < NOW()
  AND p.subscription_status IS NULL
ORDER BY p.trial_end_date DESC;
```

## 🎯 Próximos Passos

- [ ] Painel superadmin para gerenciar configurações
- [ ] UI para criar/editar alertas customizados
- [ ] Dashboard de analytics de trial/conversão
- [ ] Automação de emails para trial ending
- [ ] Testes A/B de diferentes alertas
- [ ] Integração com sistemas de pagamento

## 📝 Notas Importantes

1. **Triggers automáticos**: O sistema calcula automaticamente `trial_end_date` e `is_trial_active`
2. **Proteção**: Configurações críticas não podem ser deletadas
3. **RLS**: Apenas superadmins podem modificar configurações do sistema
4. **Performance**: Índices criados para queries eficientes
5. **Histórico**: Todos os alertas exibidos são registrados para análise

## 🐛 Troubleshooting

### Trial não está iniciando automaticamente

Verificar se o trigger está ativo:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'init_trial_on_new_user';
```

### Alertas não aparecem

Verificar se há alertas ativos:

```sql
SELECT * FROM trial_alerts WHERE is_active = true;
```

Verificar se o usuário tem alertas disponíveis:

```sql
SELECT * FROM user_active_alerts WHERE user_id = 'user-uuid';
```

### Alterar dias de trial padrão

```sql
UPDATE system_settings
SET setting_value = '{"days": 14}'
WHERE setting_key = 'default_trial_days';
```
