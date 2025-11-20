# Guia de Migração - SoTasty Design System

## Variáveis CSS Disponíveis

### Cores Base

#### MILK (Neutra Clara)
```css
--color-milk-50 a --color-milk-900
--color-milk (aponta para --color-milk-500)
```

#### STONE (Neutra Média)
```css
--color-stone-50 a --color-stone-900
--color-stone (aponta para --color-stone-500)
```

#### DESERT CLAY (Principal/Brand)
```css
--color-clay-50 a --color-clay-900
--color-clay (aponta para --color-clay-500)
```

#### GRAPHITE (Neutra Escura)
```css
--color-graphite-50 a --color-graphite-900
--color-graphite (aponta para --color-graphite-500)
```

### Cores de Feedback

```css
/* INFO */
--color-info-50 a --color-info-900
--color-info (aponta para --color-info-500)

/* SUCCESS */
--color-success-50 a --color-success-900
--color-success (aponta para --color-success-500)

/* WARNING */
--color-warning-50 a --color-warning-900
--color-warning (aponta para --color-warning-500)

/* DANGER */
--color-danger-50 a --color-danger-900
--color-danger (aponta para --color-danger-500)
```

---

## Tabela de Migração

### Cores Antigas → Novas

| Cor Antiga | Nova Cor | Uso |
|-----------|----------|-----|
| `--color-old-rose` | `--color-clay-500` | Cor principal/brand |
| `--color-old-rose-dark` | `--color-clay-600` | Hover states |
| `--color-rosy-brown` | `--color-clay-600` | Hover states |
| `--color-snow` | `--color-milk-50` | Backgrounds claros |
| `--color-lavender-blush` | `--color-clay-50` | Backgrounds suaves |
| `--color-pale-dogwood` | `--color-clay-200` | Bordas suaves |
| `--color-melon` | `--color-clay-400` | Gradientes |
| `--color-licorice` | `--color-graphite-900` | Texto escuro |

---

## Exemplos de Migração

### Botões

#### Antes:
```tsx
className="bg-[var(--color-old-rose)] hover:bg-[var(--color-rosy-brown)]"
```

#### Depois:
```tsx
className="bg-[var(--color-clay-500)] hover:bg-[var(--color-clay-600)]"
// ou usar as classes prontas:
className="btn-primary"
```

### Texto

#### Antes:
```tsx
className="text-[var(--color-old-rose)]"
```

#### Depois:
```tsx
className="text-[var(--color-clay-500)]"
```

### Bordas

#### Antes:
```tsx
className="border-[var(--color-old-rose)]"
```

#### Depois:
```tsx
className="border-[var(--color-clay-500)]"
```

### Gradientes

#### Antes:
```tsx
className="bg-gradient-to-r from-[var(--color-old-rose)] to-[var(--color-melon)]"
```

#### Depois:
```tsx
className="bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-clay-400)]"
```

### Focus States

#### Antes:
```tsx
className="focus:ring-[var(--color-old-rose)]"
```

#### Depois:
```tsx
className="focus:ring-[var(--color-clay-500)]"
```

---

## Classes de Botão Prontas

Use estas classes em vez de estilos inline:

```css
/* Primary (Desert Clay) */
.btn-primary
.btn-primary-outline

/* Secondary (Graphite) */
.btn-secondary
.btn-secondary-outline

/* Feedback */
.btn-info
.btn-outline-info

.btn-success
.btn-outline-success

.btn-warning
.btn-outline-warning

.btn-danger
.btn-outline-danger

.btn-ghost-danger
```

---

## Próximos Passos

1. ✅ Criar variáveis CSS no `globals.css`
2. ✅ Criar classes de botão padronizadas
3. ✅ Atualizar style-guide com novas cores
4. 🔄 Migrar componentes principais:
   - [ ] Sidebar
   - [ ] Header
   - [ ] Modais
   - [ ] Formulários
   - [ ] Mensagens/Atendimento
5. ⏳ Implementar Dark Theme

---

## Comandos úteis para migração

### Buscar todas as referências antigas:
```bash
grep -r "--color-old-rose" app/ components/
grep -r "--color-rosy-brown" app/ components/
```

### Substituir em massa (com cuidado):
```bash
# Fazer backup primeiro!
find . -type f -name "*.tsx" -exec sed -i '' 's/--color-old-rose/--color-clay-500/g' {} +
find . -type f -name "*.tsx" -exec sed -i '' 's/--color-rosy-brown/--color-clay-600/g' {} +
```

---

*Última atualização: Novembro 2025*
