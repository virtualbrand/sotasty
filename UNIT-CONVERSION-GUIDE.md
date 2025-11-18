# Guia de Conversão de Unidades - Sistema de Medidas

## ✅ Implementado

### 1. Funções Utilitárias (`/lib/unitConversion.ts`)
- `convertFromSmallUnit()` - Converte de g/ml (banco) para a unidade de exibição
- `convertToSmallUnit()` - Converte da unidade de exibição para g/ml (banco)
- `getDisplayUnit()` - Retorna a unidade de exibição baseada no sistema
- `getUnitOptions()` - Retorna as opções do select baseado no sistema
- `formatQuantityWithUnit()` - Formata valor com unidade apropriada
- `getUnitAbbreviation()` - Retorna abreviação da unidade

### 2. Configurações de Produto (`useProductSettings`)
- `measurementUnit`: 'metric-small' (g/ml) ou 'metric-large' (kg/L)
- Armazenado no localStorage
- UI configurável em `/settings/products`

### 3. Modal de Insumos (IngredientsTab)
✅ Select de unidades usa `getUnitOptions(settings.measurementUnit)`
✅ Valores convertidos ao salvar com `convertToSmallUnit()`
✅ Valores convertidos ao editar com `convertFromSmallUnit()`
✅ Unidade padrão definida por `getDefaultUnit()`

### 4. Exibição de Insumos
✅ Tabela converte valores para exibição
✅ Cards mostram quantidades convertidas
✅ Unidades exibidas corretamente (g/kg, ml/L)

### 5. Modal de Bases de Preparo (BasesTab)
✅ Select de unidades usa `getUnitOptions(settings.measurementUnit)`
✅ Rendimento convertido ao salvar
✅ Rendimento convertido ao editar
✅ Quantidades de ingredientes nas bases convertidas

### 6. Exibição de Bases
✅ Cards mostram rendimento convertido
✅ Tabelas de composição mostram ingredientes com quantidades convertidas

## 📋 Próximos Passos

### 1. Aplicar Migration no Supabase

**IMPORTANTE:** Execute a migration antes de testar o sistema!

```sql
-- Acesse o Supabase SQL Editor e execute:
-- migrations/standardize_units_to_metric_small.sql

-- Isso irá:
-- 1. Converter kg → gramas (*1000)
-- 2. Converter L → ml (*1000)
-- 3. Atualizar campos 'unit' para o padrão
-- 4. Adicionar comentários documentando a padronização
```

### 2. Produtos Finais (ProductsTab) - PENDENTE

Ainda precisa implementar conversão em:
- [ ] Modal de adicionar produto final
- [ ] Select de unidades no modal
- [ ] Conversão ao salvar/editar
- [ ] Exibição nas tabelas de composição

### 3. Testes Recomendados

#### Teste 1: Criar Insumo em g/ml
1. Configure em `/settings/products`: "Gramas (g) / Mililitros (ml)"
2. Crie insumo: Farinha, 1000g, R$ 5,00
3. Verifique no banco: deve estar como 1000 gramas

#### Teste 2: Criar Insumo em kg/L
1. Configure em `/settings/products`: "Quilogramas (kg) / Litros (L)"
2. Crie insumo: Açúcar, 1kg, R$ 4,50
3. Verifique no banco: deve estar como 1000 gramas
4. Edite o insumo: deve mostrar 1kg no campo

#### Teste 3: Alternar Sistema de Medidas
1. Crie insumos em kg/L
2. Mude configuração para g/ml
3. Verifique tabelas: valores devem aparecer em gramas
4. Volte para kg/L: valores devem aparecer em quilogramas

#### Teste 4: Bases de Preparo
1. Crie base com rendimento de 2kg
2. Adicione insumos com quantidades em kg
3. Verifique banco: tudo deve estar em gramas
4. Alterne sistema de medidas: exibição deve mudar

## 🔧 Lógica de Conversão

### Banco de Dados → Frontend (Exibição)
```typescript
// Se measurementUnit === 'metric-large'
displayValue = dbValue / 1000  // 1000g → 1kg, 1000ml → 1L
displayUnit = 'kg' ou 'L'

// Se measurementUnit === 'metric-small'
displayValue = dbValue  // mantém como está
displayUnit = 'gramas' ou 'ml'
```

### Frontend → Banco de Dados (Salvar)
```typescript
// Se measurementUnit === 'metric-large'
dbValue = inputValue * 1000  // 1kg → 1000g, 1L → 1000ml
dbUnit = 'gramas' ou 'ml'

// Se measurementUnit === 'metric-small'
dbValue = inputValue  // mantém como está
dbUnit = 'gramas' ou 'ml'
```

## 📊 Estrutura do Banco Após Migration

### Tabela: ingredients
```
id | name      | quantity | unit    | average_cost | unit_cost
---|-----------|----------|---------|--------------|----------
1  | Farinha   | 1000     | gramas  | 5.00         | 0.00510
2  | Leite     | 1000     | ml      | 4.50         | 0.00459
3  | Embalagem | 50       | unidades| 25.00        | 0.51000
```

### Tabela: base_recipes
```
id | name       | unit_yield | unit   | loss_factor
---|------------|------------|--------|------------
1  | Massa Base | 2000       | gramas | 2
2  | Recheio    | 1500       | ml     | 3
```

## 🎯 Benefícios da Implementação

1. **Consistência:** Banco sempre em g/ml, evita erros de cálculo
2. **Flexibilidade:** Usuário escolhe como prefere visualizar
3. **Simplicidade:** Conversão acontece apenas na exibição
4. **Precisão:** Cálculos de custo sempre em unidade pequena (maior precisão)
5. **UX:** Interface adaptada ao padrão familiar do usuário

## ⚠️ Atenção

- **Sempre teste em ambiente de desenvolvimento primeiro!**
- A migration é irreversível (converte dados existentes)
- Faça backup do banco antes de aplicar a migration
- Após aplicar, todos os dados estarão em g/ml
- A conversão visual é automática baseada nas configurações

## 🔍 Como Verificar se Está Funcionando

1. **Inspeção de Rede (DevTools):**
   - Ao salvar insumo, verifique payload da request
   - Deve sempre enviar valores em g/ml para o banco

2. **Console do Navegador:**
   - Use `console.log` para ver valores antes/depois da conversão
   - Verifique se `convertToSmallUnit` está sendo chamado

3. **Supabase Table Editor:**
   - Abra a tabela `ingredients`
   - Todos os valores devem estar em g/ml
   - Campo `unit` deve ser 'gramas', 'ml' ou 'unidades'

4. **Teste de Alternância:**
   - Mude configuração e recarregue a página
   - Valores devem atualizar automaticamente na exibição
