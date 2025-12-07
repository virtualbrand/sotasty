# Guia de Implementação: Tracking de Atividades em Configurações

## ✅ Concluído

### 1. ActivityLogger Helpers
Todos os helpers necessários foram criados em `/lib/activityLogger.ts`:
- ✅ `ActivitySettings.profileUpdated()` - Para campos de perfil
- ✅ `ActivitySettings.logoUpdated/Removed()` - Para logo
- ✅ `ActivitySettings.businessHoursUpdated()` - Para horários
- ✅ `ActivitySettings.alwaysOpenToggled()` - Para 24h
- ✅ `ActivitySettings.customUrlUpdated()` - Para URL personalizada
- ✅ `ActivitySettings.customDomainUpdated()` - Para domínio
- ✅ `ActivitySettings.productCategory*()` - Para categorias de produtos
- ✅ `ActivitySettings.productPhotoToggled()` - Para fotos
- ✅ `ActivitySettings.lossFactorToggled()` - Para fator de perda
- ✅ `ActivitySettings.measurementUnitChanged()` - Para unidades
- ✅ `ActivitySettings.orderAlternativeTitleToggled()` - Para título alternativo
- ✅ `ActivitySettings.orderStatus*()` - Para status de pedidos
- ✅ `ActivitySettings.orderCategory*()` - Para categorias de pedidos
- ✅ `ActivitySettings.orderTag*()` - Para tags de pedidos
- ✅ `ActivitySettings.customer*Toggled()` - Para campos de clientes
- ✅ `ActivitySettings.agendaStatus*()` - Para status de agenda
- ✅ `ActivitySettings.agendaCategory*()` - Para categorias de agenda
- ✅ `ActivitySettings.agendaTag*()` - Para tags de agenda
- ✅ `ActivitySettings.financialCategory*()` - Para categorias financeiras
- ✅ `ActivitySettings.knowledgeFile*()` - Para base de conhecimento
- ✅ `ActivitySettings.knowledgeContext*()` - Para contextos

---

## 📋 Pendente de Implementação

### 2. /app/(dashboard)/settings/profile/page.tsx

**O que fazer:**
Adicionar chamadas do ActivitySettings após operações de UPDATE no handleSubmit.

**Import necessário:**
```typescript
import { ActivitySettings } from '@/lib/activityLogger'
```

**Onde adicionar (dentro do handleSubmit, após response OK):**

#### 2.1. Dados do Estabelecimento (Aba "Estabelecimento")
Após atualizar o profile_settings, adicionar:
```typescript
// Registrar mudanças em campos específicos
if (originalProfileData.business_name !== profileData.business_name) {
  await ActivitySettings.profileUpdated(
    'Nome do Estabelecimento', 
    originalProfileData.business_name || '', 
    profileData.business_name || ''
  )
}

if (originalProfileData.address !== profileData.address) {
  await ActivitySettings.profileUpdated(
    'Endereço', 
    originalProfileData.address || '', 
    profileData.address || ''
  )
}

if (originalProfileData.neighborhood !== profileData.neighborhood) {
  await ActivitySettings.profileUpdated(
    'Bairro', 
    originalProfileData.neighborhood || '', 
    profileData.neighborhood || ''
  )
}

if (originalProfileData.city !== profileData.city) {
  await ActivitySettings.profileUpdated(
    'Cidade', 
    originalProfileData.city || '', 
    profileData.city || ''
  )
}

if (originalProfileData.state !== profileData.state) {
  await ActivitySettings.profileUpdated(
    'Estado', 
    originalProfileData.state || '', 
    profileData.state || ''
  )
}

if (originalProfileData.zip_code !== profileData.zip_code) {
  await ActivitySettings.profileUpdated(
    'CEP', 
    originalProfileData.zip_code || '', 
    profileData.zip_code || ''
  )
}

// Logo
if (logoFile) {
  await ActivitySettings.logoUpdated()
}
```

#### 2.2. Horários de Funcionamento (Aba "Horários")
```typescript
// Always Open
if (originalProfileData.always_open !== profileData.always_open) {
  await ActivitySettings.alwaysOpenToggled(profileData.always_open)
}

// Business Hours (comparar o JSON completo)
if (JSON.stringify(originalProfileData.business_hours) !== JSON.stringify(profileData.business_hours)) {
  // Opcional: registrar mudança detalhada por dia
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
  const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  keys.forEach((key, index) => {
    const oldHours = originalProfileData.business_hours?.[key]
    const newHours = profileData.business_hours?.[key]
    if (JSON.stringify(oldHours) !== JSON.stringify(newHours)) {
      const hoursText = newHours?.periods?.[0] 
        ? `${newHours.periods[0].open} - ${newHours.periods[0].close}`
        : undefined
      ActivitySettings.businessHoursUpdated(days[index], undefined, hoursText)
    }
  })
}
```

#### 2.3. Preferências (Aba "Preferências")
```typescript
// Custom URL
if (savedCustomUrlSlug && customUrlSlug !== savedCustomUrlSlug) {
  await ActivitySettings.customUrlUpdated(savedCustomUrlSlug, customUrlSlug)
}

// Custom Domain  
if (savedCustomDomain && customDomain !== savedCustomDomain) {
  await ActivitySettings.customDomainUpdated(savedCustomDomain, customDomain)
}
```

**Localização específica no código:**
- Linha ~750-800: Dentro da função `handleSubmit`, após `if (!error)`

---

### 3. /app/(dashboard)/settings/products/page.tsx

**Import necessário:**
```typescript
import { ActivitySettings } from '@/lib/activityLogger'
```

**Implementações:**

#### 3.1. Adicionar Categoria (função addCategory)
Após `if (response.ok)`:
```typescript
await ActivitySettings.productCategoryAdded(newCat.name)
```

#### 3.2. Remover Categoria (função removeCategory)
Após `if (response.ok)`:
```typescript
await ActivitySettings.productCategoryRemoved(categoryName)
```

#### 3.3. Toggle Fotos
Nas funções `handleProductPhotoToggle`, `handleIngredientPhotoToggle`, `handleBasePhotoToggle`:
```typescript
// Produto Final
await ActivitySettings.productPhotoToggled('produto', checked)

// Ingrediente
await ActivitySettings.productPhotoToggled('ingrediente', checked)

// Base
await ActivitySettings.productPhotoToggled('base', checked)
```

#### 3.4. Toggle Fator de Perda
Nas funções `handleIngredientsToggle`, `handleBasesToggle`, `handleProductsToggle`:
```typescript
// Ingredientes
await ActivitySettings.lossFactorToggled('ingrediente', checked)

// Bases
await ActivitySettings.lossFactorToggled('base', checked)

// Produtos
await ActivitySettings.lossFactorToggled('produto', checked)
```

#### 3.5. Unidade de Medida
Na função `handleMeasurementUnitChange`:
```typescript
const unitNames = {
  'metric-large': 'Kg/L',
  'metric-small': 'g/ml'
}

await ActivitySettings.measurementUnitChanged(
  unitNames[measurementUnit], 
  unitNames[unit]
)
```

---

### 4. /app/(dashboard)/settings/orders/page.tsx

**Import necessário:**
```typescript
import { ActivitySettings } from '@/lib/activityLogger'
```

**Implementações:**

#### 4.1. Título Alternativo (função toggleAlternativeTitle)
```typescript
await ActivitySettings.orderAlternativeTitleToggled(newValue)
```

#### 4.2. Status
```typescript
// Adicionar (função addStatus, após response.ok)
if (editingStatusId) {
  await ActivitySettings.orderStatusUpdated(
    statuses.find(s => s.id === editingStatusId)?.name || '',
    updatedStatus.name
  )
} else {
  await ActivitySettings.orderStatusAdded(newStatus.name, newStatus.color)
}

// Remover (função removeStatus, após response.ok)
await ActivitySettings.orderStatusRemoved(name)
```

#### 4.3. Categorias
```typescript
// Adicionar (função addCategory, após response.ok)
if (editingCategoryId) {
  await ActivitySettings.orderCategoryUpdated(
    categories.find(c => c.id === editingCategoryId)?.name || '',
    updatedCategory.name
  )
} else {
  await ActivitySettings.orderCategoryAdded(newCategory.name)
}

// Remover (função removeCategory, após response.ok)
await ActivitySettings.orderCategoryRemoved(name)
```

#### 4.4. Tags
```typescript
// Adicionar (função addTag, após response.ok)
if (editingTagId) {
  await ActivitySettings.orderTagUpdated(
    tags.find(t => t.id === editingTagId)?.name || '',
    updatedTag.name
  )
} else {
  await ActivitySettings.orderTagAdded(newTag.name)
}

// Remover (função removeTag, após response.ok)
await ActivitySettings.orderTagRemoved(name)
```

---

### 5. /app/(dashboard)/settings/customers/page.tsx

**Import necessário:**
```typescript
import { ActivitySettings } from '@/lib/activityLogger'
```

**Implementações:**

#### 5.1. Toggle CPF/CNPJ (função handleCpfCnpjToggle)
```typescript
await ActivitySettings.customerCpfCnpjToggled(checked)
```

#### 5.2. Toggle Foto (função handlePhotoToggle)
```typescript
await ActivitySettings.customerPhotoToggled(checked)
```

---

### 6. /app/(dashboard)/settings/agenda/page.tsx

**Import necessário:**
```typescript
import { ActivitySettings } from '@/lib/activityLogger'
```

**Implementações:**

#### 6.1. Status
```typescript
// Adicionar (função addStatus, após response.ok)
if (editingStatusId) {
  await ActivitySettings.agendaStatusUpdated(
    statuses.find(s => s.id === editingStatusId)?.name || '',
    updatedStatus.name
  )
} else {
  await ActivitySettings.agendaStatusAdded(newStatus.name)
}

// Remover (função removeStatus, após response.ok)
await ActivitySettings.agendaStatusRemoved(
  statuses.find(s => s.id === id)?.name || ''
)
```

#### 6.2. Categorias
```typescript
// Adicionar (função addCategory, após response.ok)
if (editingCategoryId) {
  await ActivitySettings.agendaCategoryUpdated(
    categories.find(c => c.id === editingCategoryId)?.name || '',
    updatedCategory.name
  )
} else {
  await ActivitySettings.agendaCategoryAdded(newCategory.name)
}

// Remover (função removeCategory, após response.ok)
await ActivitySettings.agendaCategoryRemoved(
  categories.find(c => c.id === id)?.name || ''
)
```

#### 6.3. Tags
```typescript
// Adicionar (função addTag, após response.ok)
if (editingTagId) {
  await ActivitySettings.agendaTagUpdated(
    tags.find(t => t.id === editingTagId)?.name || '',
    updatedTag.name
  )
} else {
  await ActivitySettings.agendaTagAdded(newTag.name)
}

// Remover (função removeTag)
await ActivitySettings.agendaTagRemoved(
  tags.find(t => t.id === id)?.name || ''
)
```

---

### 7. /app/(dashboard)/settings/financeiro/page.tsx

**Import necessário:**
```typescript
import { ActivitySettings } from '@/lib/activityLogger'
```

**Implementações:**

#### 7.1. Adicionar Categoria (Modal de CategoryModal)
**Atenção**: Este precisa ser implementado no `/components/financeiro/CategoryModal.tsx` após o sucesso:
```typescript
// No onSuccess ou após o response OK
if (category?.id) {
  // Edição
  await ActivitySettings.financialCategoryUpdated(
    type,
    originalName,
    data.name
  )
} else {
  // Criação
  await ActivitySettings.financialCategoryAdded(type, data.name)
}
```

#### 7.2. Remover Categoria (função removeCategory)
Após `if (response.ok)`:
```typescript
await ActivitySettings.financialCategoryRemoved(
  activeTab === 'despesas' ? 'despesa' : 'receita',
  categoryName
)
```

#### 7.3. Reordenar Categorias
Nas funções `handleDrop`, `handleSubcategoryDrop`, `reorderSubcategories`:
```typescript
// Após Promise.all(updates) e fetchCategories()
await ActivitySettings.financialCategoryReordered(
  activeTab === 'despesas' ? 'despesa' : 'receita',
  draggedCategory.name
)
```

#### 7.4. Mover Subcategoria
Na função `handleDrop` quando `position === 'inside'`:
```typescript
await ActivitySettings.financialSubcategoryMoved(
  draggedCategory.name,
  targetCategory.name
)
```

---

### 8. /app/(dashboard)/settings/atendimento/page.tsx

**Import necessário:**
```typescript
import { ActivitySettings } from '@/lib/activityLogger'
```

**Implementações:**

#### 8.1. Upload de Arquivo (função handleFileUpload)
Após `if (!response.ok)` (no bloco try, após sucesso):
```typescript
const uploadedFiles = await response.json()
// Para cada arquivo
uploadedFiles.files?.forEach((file: { name: string; size: number }) => {
  ActivitySettings.knowledgeFileUploaded(file.name, file.size)
})
```

#### 8.2. Salvar Contexto (função handleSaveText)
Após `if (!response.ok)` (no bloco try, após sucesso):
```typescript
await ActivitySettings.knowledgeContextAdded(fileName, textContent.length)
```

#### 8.3. Deletar Item (função handleDeleteFile)
Após `if (!response.ok)` (no bloco try, após sucesso):
```typescript
if (item.type === 'context') {
  await ActivitySettings.knowledgeContextRemoved(item.name)
} else {
  await ActivitySettings.knowledgeFileRemoved(item.name)
}
```

---

## 🎯 Prioridades de Implementação

1. **Alta Prioridade** (Mais usados):
   - Settings/Products (categorias, fotos, unidades)
   - Settings/Orders (status, categorias, tags)
   - Settings/Financeiro (categorias)

2. **Média Prioridade**:
   - Settings/Profile (estabelecimento, horários, preferências)
   - Settings/Agenda (status, categorias, tags)
   - Settings/Customers (toggles)

3. **Baixa Prioridade**:
   - Settings/Atendimento (base de conhecimento)

---

## ✅ Checklist de Verificação

Após implementar em cada arquivo:

- [ ] Import do `ActivitySettings` adicionado
- [ ] Chamadas após operações bem-sucedidas (response.ok)
- [ ] `await` usado corretamente
- [ ] Nomes dos campos/valores corretos
- [ ] Toast já existe (não adicionar novo)
- [ ] Testar criação, edição e remoção
- [ ] Verificar atividades aparecendo em /activities

---

## 📝 Notas Importantes

1. **Sempre usar `await`** antes das chamadas do ActivitySettings
2. **Nunca bloquear** a operação principal se o logging falhar (try/catch opcional)
3. **Não adicionar toasts** - já existem nos componentes
4. **Verificar estado anterior** para comparações (old vs new)
5. **Usar nomes descritivos** nas atividades
6. **Badge classes** já estão nos helpers (badge-success, badge-secondary, badge-danger)

---

## 🔍 Como Testar

1. Fazer uma alteração na configuração
2. Ir para `/activities`
3. Filtrar por "Configuração"
4. Verificar se a atividade aparece com:
   - ✅ Badge colorido correto
   - ✅ Descrição clara
   - ✅ Timestamp correto
   - ✅ Categoria "configuracao"
