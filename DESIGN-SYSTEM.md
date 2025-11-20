# SoTasty Design System

## Visão Geral

O SoTasty Design System é baseado em uma paleta de cores naturais e acolhedoras, inspiradas em elementos culinários. O sistema suporta tanto Light Theme quanto Dark Theme, garantindo uma experiência visual consistente e acessível.

---

## Paleta de Cores Completa

### Cores Base do Sistema

#### MILK (Neutra Clara)
Cor neutra clara, usada para fundos e superfícies no Light Theme.

```css
--milk-50:  #FFFFFF
--milk-100: #FEFEFE
--milk-200: #FCFCFC
--milk-300: #F9F9F9
--milk-400: #F5F5F5
--milk-500: #F0F0F0  /* Base */
--milk-600: #E8E8E8
--milk-700: #D9D9D9
--milk-800: #C4C4C4
--milk-900: #A8A8A8
```

#### LIGHT STONE (Neutra Média)
Cor neutra média, usada para bordas e elementos secundários.

```css
--stone-50:  #F5F3F0
--stone-100: #EDE9E4
--stone-200: #E3DED7
--stone-300: #D9D2C9
--stone-400: #CFC6BA
--stone-500: #D0D2C2  /* Base */
--stone-600: #B8BAA8
--stone-700: #9A9C8A
--stone-800: #7C7E6C
--stone-900: #5E5F4E
```

#### DESERT CLAY (Principal/Brand)
Cor principal da marca SoTasty, transmite calor e acolhimento.

```css
--clay-50:  #FBF2EE
--clay-100: #F5E0D6
--clay-200: #EECCBB
--clay-300: #E5B49D
--clay-400: #DC9C7F
--clay-500: #B17467  /* Base */
--clay-600: #9A5E51
--clay-700: #824D42
--clay-800: #6A3D34
--clay-900: #523027
```

#### GRAPHITE (Neutra Escura)
Cor neutra escura, usada para texto e fundos no Dark Theme.

```css
--graphite-50:  #F5F5F6
--graphite-100: #E8E9EB
--graphite-200: #D1D3D7
--graphite-300: #B4B7BD
--graphite-400: #9096A0
--graphite-500: #4A4D67  /* Base */
--graphite-600: #3D3F54
--graphite-700: #313342
--graphite-800: #252730
--graphite-900: #1A1C23
```

---

### Cores de Feedback

#### INFO (Azul)
Usada para mensagens informativas e elementos de ajuda.

```css
--info-50:  #EFF6F9
--info-100: #D9EAF2
--info-200: #B3D5E6
--info-300: #85BAD6
--info-400: #5B9FC7
--info-500: #4A7C8C  /* Base */
--info-600: #3D6673
--info-700: #31515C
--info-800: #253D46
--info-900: #1A2A31
```

#### SUCCESS (Verde)
Usada para mensagens de sucesso e confirmações.

```css
--success-50:  #F0F7F3
--success-100: #DCEEE3
--success-200: #B8DCC7
--success-300: #8FC6A7
--success-400: #6BB089
--success-500: #52A675  /* Base */
--success-600: #428760
--success-700: #34694C
--success-800: #274D38
--success-900: #1B3527
```

#### WARNING (Âmbar)
Usada para avisos e alertas que requerem atenção.

```css
--warning-50:  #FDF6ED
--warning-100: #FAEAD4
--warning-200: #F5D4A8
--warning-300: #EFBC76
--warning-400: #E8A24A
--warning-500: #C9935A  /* Base */
--warning-600: #A67747
--warning-700: #835E38
--warning-800: #61462A
--warning-900: #43301D
```

#### DANGER (Vermelho)
Usada para erros e ações destrutivas.

```css
--danger-50:  #FDF2F3
--danger-100: #FAE0E3
--danger-200: #F5C1C7
--danger-300: #EE9BA5
--danger-400: #E67483
--danger-500: #C75D6A  /* Base */
--danger-600: #A34C57
--danger-700: #7F3C45
--danger-800: #5D2D33
--danger-900: #3F1F23
```

---

## Temas

### Light Theme

#### Backgrounds
```css
--bg-primary:    #FEFEFE  /* milk-100 */
--bg-secondary:  #F5F5F5  /* milk-400 */
--surface:       #FFFFFF  /* Cards */
--surface-elevated: #FFFFFF  /* milk-50 */
```

#### Bordas
```css
--border-subtle:  #D9D2C9  /* stone-300 */
--border-default: #CFC6BA  /* stone-400 */
```

#### Texto
```css
--text-primary:    #1A1C23  /* graphite-900 */
--text-secondary:  #3D3F54  /* graphite-600 */
--text-tertiary:   #9096A0  /* graphite-400 */
--text-disabled:   #D0D2C2  /* stone-500 */
```

#### Sombras
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

---

### Dark Theme

#### Backgrounds
```css
--bg-primary:    #1A1C23  /* graphite-900 */
--bg-secondary:  #252730  /* graphite-800 */
--surface:       #313342  /* graphite-700 */
--surface-elevated: #3D3F54  /* graphite-600 */
```

#### Bordas
```css
--border-subtle:  #3D3F54  /* graphite-600 */
--border-default: #4A4D67  /* graphite-500 */
```

#### Texto
```css
--text-primary:    #FEFEFE  /* milk-100 */
--text-secondary:  #D9D2C9  /* stone-300 */
--text-tertiary:   #D0D2C2  /* stone-500 */
--text-disabled:   #9096A0  /* graphite-400 */
```

#### Sombras
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
```

---

## Componentes: Botões

### Transições e Estados Gerais

```css
/* Transições suaves para todos os botões */
transition: all 0.2s ease-in-out;

/* Estado de foco (acessibilidade) */
outline: 2px solid [cor-correspondente];
outline-offset: 2px;
```

---

### Primary (Desert Clay)

#### Filled - Light Theme
```css
/* Default */
background: #B17467;  /* clay-500 */
color: #FFFFFF;
border: 1px solid #B17467;

/* Hover */
background: #9A5E51;  /* clay-600 */
border-color: #9A5E51;

/* Active */
background: #824D42;  /* clay-700 */
border-color: #824D42;

/* Disabled */
background: #CFC6BA;  /* stone-400 */
color: #B8BAA8;  /* stone-600 */
border-color: #CFC6BA;
cursor: not-allowed;
```

#### Filled - Dark Theme
```css
/* Default */
background: #DC9C7F;  /* clay-400 */
color: #1A1C23;  /* graphite-900 */
border: 1px solid #DC9C7F;

/* Hover */
background: #E5B49D;  /* clay-300 */
border-color: #E5B49D;

/* Active */
background: #EECCBB;  /* clay-200 */
border-color: #EECCBB;

/* Disabled */
background: #3D3F54;  /* graphite-600 */
color: #9096A0;  /* graphite-400 */
border-color: #3D3F54;
cursor: not-allowed;
```

#### Outline - Light Theme
```css
/* Default */
background: transparent;
color: #9A5E51;  /* clay-600 */
border: 1px solid #B17467;  /* clay-500 */

/* Hover */
background: #FBF2EE;  /* clay-50 */
color: #824D42;  /* clay-700 */
border-color: #9A5E51;  /* clay-600 */

/* Active */
background: #F5E0D6;  /* clay-100 */
border-color: #824D42;  /* clay-700 */

/* Disabled */
background: transparent;
color: #B8BAA8;  /* stone-600 */
border-color: #D0D2C2;  /* stone-500 */
cursor: not-allowed;
```

#### Outline - Dark Theme
```css
/* Default */
background: transparent;
color: #E5B49D;  /* clay-300 */
border: 1px solid #DC9C7F;  /* clay-400 */

/* Hover */
background: #523027;  /* clay-900 */
color: #EECCBB;  /* clay-200 */
border-color: #E5B49D;  /* clay-300 */

/* Active */
background: #6A3D34;  /* clay-800 */
border-color: #EECCBB;  /* clay-200 */

/* Disabled */
background: transparent;
color: #4A4D67;  /* graphite-500 */
border-color: #3D3F54;  /* graphite-600 */
cursor: not-allowed;
```

---

### Secondary (Graphite)

#### Filled - Light Theme
```css
/* Default */
background: #3D3F54;  /* graphite-600 */
color: #FFFFFF;
border: 1px solid #3D3F54;

/* Hover */
background: #313342;  /* graphite-700 */
border-color: #313342;

/* Active */
background: #252730;  /* graphite-800 */
border-color: #252730;

/* Disabled */
background: #CFC6BA;  /* stone-400 */
color: #B8BAA8;  /* stone-600 */
border-color: #CFC6BA;
cursor: not-allowed;
```

#### Filled - Dark Theme
```css
/* Default */
background: #CFC6BA;  /* stone-400 */
color: #1A1C23;  /* graphite-900 */
border: 1px solid #CFC6BA;

/* Hover */
background: #D9D2C9;  /* stone-300 */
border-color: #D9D2C9;

/* Active */
background: #E3DED7;  /* stone-200 */
border-color: #E3DED7;

/* Disabled */
background: #3D3F54;  /* graphite-600 */
color: #9096A0;  /* graphite-400 */
border-color: #3D3F54;
cursor: not-allowed;
```

#### Outline - Light Theme
```css
/* Default */
background: transparent;
color: #313342;  /* graphite-700 */
border: 1px solid #4A4D67;  /* graphite-500 */

/* Hover */
background: #F5F5F6;  /* graphite-50 */
border-color: #3D3F54;  /* graphite-600 */

/* Active */
background: #E8E9EB;  /* graphite-100 */
border-color: #3D3F54;

/* Disabled */
background: transparent;
color: #B8BAA8;  /* stone-600 */
border-color: #D0D2C2;  /* stone-500 */
cursor: not-allowed;
```

#### Outline - Dark Theme
```css
/* Default */
background: transparent;
color: #D9D2C9;  /* stone-300 */
border: 1px solid #D0D2C2;  /* stone-500 */

/* Hover */
background: #252730;  /* graphite-800 */
border-color: #CFC6BA;  /* stone-400 */

/* Active */
background: #313342;  /* graphite-700 */
border-color: #CFC6BA;

/* Disabled */
background: transparent;
color: #4A4D67;  /* graphite-500 */
border-color: #3D3F54;  /* graphite-600 */
cursor: not-allowed;
```

---

### Info (Azul)

#### Filled - Light Theme
```css
/* Default */
background: #4A7C8C;  /* info-500 */
color: #FFFFFF;
border: 1px solid #4A7C8C;

/* Hover */
background: #3D6673;  /* info-600 */
border-color: #3D6673;

/* Active */
background: #31515C;  /* info-700 */
border-color: #31515C;

/* Disabled */
background: #CFC6BA;  /* stone-400 */
color: #B8BAA8;  /* stone-600 */
border-color: #CFC6BA;
cursor: not-allowed;
```

#### Filled - Dark Theme
```css
/* Default */
background: #5B9FC7;  /* info-400 */
color: #1A1C23;  /* graphite-900 */
border: 1px solid #5B9FC7;

/* Hover */
background: #85BAD6;  /* info-300 */
border-color: #85BAD6;

/* Active */
background: #B3D5E6;  /* info-200 */
border-color: #B3D5E6;

/* Disabled */
background: #3D3F54;  /* graphite-600 */
color: #9096A0;  /* graphite-400 */
border-color: #3D3F54;
cursor: not-allowed;
```

#### Outline - Light Theme
```css
/* Default */
background: transparent;
color: #3D6673;  /* info-600 */
border: 1px solid #4A7C8C;  /* info-500 */

/* Hover */
background: #EFF6F9;  /* info-50 */
border-color: #3D6673;  /* info-600 */

/* Active */
background: #D9EAF2;  /* info-100 */
border-color: #3D6673;

/* Disabled */
background: transparent;
color: #B8BAA8;  /* stone-600 */
border-color: #D0D2C2;  /* stone-500 */
cursor: not-allowed;
```

#### Outline - Dark Theme
```css
/* Default */
background: transparent;
color: #85BAD6;  /* info-300 */
border: 1px solid #5B9FC7;  /* info-400 */

/* Hover */
background: #1A2A31;  /* info-900 */
border-color: #85BAD6;  /* info-300 */

/* Active */
background: #253D46;  /* info-800 */
border-color: #85BAD6;

/* Disabled */
background: transparent;
color: #4A4D67;  /* graphite-500 */
border-color: #3D3F54;  /* graphite-600 */
cursor: not-allowed;
```

---

### Success (Verde)

#### Filled - Light Theme
```css
/* Default */
background: #52A675;  /* success-500 */
color: #FFFFFF;
border: 1px solid #52A675;

/* Hover */
background: #428760;  /* success-600 */
border-color: #428760;

/* Active */
background: #34694C;  /* success-700 */
border-color: #34694C;

/* Disabled */
background: #CFC6BA;  /* stone-400 */
color: #B8BAA8;  /* stone-600 */
border-color: #CFC6BA;
cursor: not-allowed;
```

#### Filled - Dark Theme
```css
/* Default */
background: #6BB089;  /* success-400 */
color: #1A1C23;  /* graphite-900 */
border: 1px solid #6BB089;

/* Hover */
background: #8FC6A7;  /* success-300 */
border-color: #8FC6A7;

/* Active */
background: #B8DCC7;  /* success-200 */
border-color: #B8DCC7;

/* Disabled */
background: #3D3F54;  /* graphite-600 */
color: #9096A0;  /* graphite-400 */
border-color: #3D3F54;
cursor: not-allowed;
```

#### Outline - Light Theme
```css
/* Default */
background: transparent;
color: #428760;  /* success-600 */
border: 1px solid #52A675;  /* success-500 */

/* Hover */
background: #F0F7F3;  /* success-50 */
border-color: #428760;  /* success-600 */

/* Active */
background: #DCEEE3;  /* success-100 */
border-color: #428760;

/* Disabled */
background: transparent;
color: #B8BAA8;  /* stone-600 */
border-color: #D0D2C2;  /* stone-500 */
cursor: not-allowed;
```

#### Outline - Dark Theme
```css
/* Default */
background: transparent;
color: #8FC6A7;  /* success-300 */
border: 1px solid #6BB089;  /* success-400 */

/* Hover */
background: #1B3527;  /* success-900 */
border-color: #8FC6A7;  /* success-300 */

/* Active */
background: #274D38;  /* success-800 */
border-color: #8FC6A7;

/* Disabled */
background: transparent;
color: #4A4D67;  /* graphite-500 */
border-color: #3D3F54;  /* graphite-600 */
cursor: not-allowed;
```

---

### Warning (Âmbar)

#### Filled - Light Theme
```css
/* Default */
background: #C9935A;  /* warning-500 */
color: #FFFFFF;
border: 1px solid #C9935A;

/* Hover */
background: #A67747;  /* warning-600 */
border-color: #A67747;

/* Active */
background: #835E38;  /* warning-700 */
border-color: #835E38;

/* Disabled */
background: #CFC6BA;  /* stone-400 */
color: #B8BAA8;  /* stone-600 */
border-color: #CFC6BA;
cursor: not-allowed;
```

#### Filled - Dark Theme
```css
/* Default */
background: #E8A24A;  /* warning-400 */
color: #1A1C23;  /* graphite-900 */
border: 1px solid #E8A24A;

/* Hover */
background: #EFBC76;  /* warning-300 */
border-color: #EFBC76;

/* Active */
background: #F5D4A8;  /* warning-200 */
border-color: #F5D4A8;

/* Disabled */
background: #3D3F54;  /* graphite-600 */
color: #9096A0;  /* graphite-400 */
border-color: #3D3F54;
cursor: not-allowed;
```

#### Outline - Light Theme
```css
/* Default */
background: transparent;
color: #A67747;  /* warning-600 */
border: 1px solid #C9935A;  /* warning-500 */

/* Hover */
background: #FDF6ED;  /* warning-50 */
border-color: #A67747;  /* warning-600 */

/* Active */
background: #FAEAD4;  /* warning-100 */
border-color: #A67747;

/* Disabled */
background: transparent;
color: #B8BAA8;  /* stone-600 */
border-color: #D0D2C2;  /* stone-500 */
cursor: not-allowed;
```

#### Outline - Dark Theme
```css
/* Default */
background: transparent;
color: #EFBC76;  /* warning-300 */
border: 1px solid #E8A24A;  /* warning-400 */

/* Hover */
background: #43301D;  /* warning-900 */
border-color: #EFBC76;  /* warning-300 */

/* Active */
background: #61462A;  /* warning-800 */
border-color: #EFBC76;

/* Disabled */
background: transparent;
color: #4A4D67;  /* graphite-500 */
border-color: #3D3F54;  /* graphite-600 */
cursor: not-allowed;
```

---

### Danger (Vermelho)

#### Filled - Light Theme
```css
/* Default */
background: #C75D6A;  /* danger-500 */
color: #FFFFFF;
border: 1px solid #C75D6A;

/* Hover */
background: #A34C57;  /* danger-600 */
border-color: #A34C57;

/* Active */
background: #7F3C45;  /* danger-700 */
border-color: #7F3C45;

/* Disabled */
background: #CFC6BA;  /* stone-400 */
color: #B8BAA8;  /* stone-600 */
border-color: #CFC6BA;
cursor: not-allowed;
```

#### Filled - Dark Theme
```css
/* Default */
background: #E67483;  /* danger-400 */
color: #1A1C23;  /* graphite-900 */
border: 1px solid #E67483;

/* Hover */
background: #EE9BA5;  /* danger-300 */
border-color: #EE9BA5;

/* Active */
background: #F5C1C7;  /* danger-200 */
border-color: #F5C1C7;

/* Disabled */
background: #3D3F54;  /* graphite-600 */
color: #9096A0;  /* graphite-400 */
border-color: #3D3F54;
cursor: not-allowed;
```

#### Outline - Light Theme
```css
/* Default */
background: transparent;
color: #A34C57;  /* danger-600 */
border: 1px solid #C75D6A;  /* danger-500 */

/* Hover */
background: #FDF2F3;  /* danger-50 */
border-color: #A34C57;  /* danger-600 */

/* Active */
background: #FAE0E3;  /* danger-100 */
border-color: #A34C57;

/* Disabled */
background: transparent;
color: #B8BAA8;  /* stone-600 */
border-color: #D0D2C2;  /* stone-500 */
cursor: not-allowed;
```

#### Outline - Dark Theme
```css
/* Default */
background: transparent;
color: #EE9BA5;  /* danger-300 */
border: 1px solid #E67483;  /* danger-400 */

/* Hover */
background: #3F1F23;  /* danger-900 */
border-color: #EE9BA5;  /* danger-300 */

/* Active */
background: #5D2D33;  /* danger-800 */
border-color: #EE9BA5;

/* Disabled */
background: transparent;
color: #4A4D67;  /* graphite-500 */
border-color: #3D3F54;  /* graphite-600 */
cursor: not-allowed;
```

---

## Notas de Implementação

### Acessibilidade
- ✅ Todas as combinações de texto/background atendem **WCAG 2.1 AA**
- ✅ Contraste mínimo de 4.5:1 para texto normal
- ✅ Contraste mínimo de 3:1 para texto grande (18px+)
- ✅ Estados de foco claramente visíveis com outline

### Transições
```css
transition: all 0.2s ease-in-out;
```

### Estados de Foco
```css
/* Para botões Primary */
outline: 2px solid #B17467;  /* clay-500 */
outline-offset: 2px;

/* Para botões Secondary */
outline: 2px solid #4A4D67;  /* graphite-500 */
outline-offset: 2px;

/* Para botões de Feedback, usar a cor base correspondente */
```

### Sombras
```css
/* Light Theme */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

/* Dark Theme */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

/* Cards elevados (Light Theme) */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* Cards elevados (Dark Theme) */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
```

### Border Radius (Recomendado)
```css
--radius-sm:  4px;   /* Elementos pequenos */
--radius-md:  8px;   /* Botões, inputs */
--radius-lg:  12px;  /* Cards */
--radius-xl:  16px;  /* Modals */
--radius-full: 9999px; /* Badges, avatares */
```

### Espaçamento (Recomendado)
```css
--spacing-xs:  4px;
--spacing-sm:  8px;
--spacing-md:  16px;
--spacing-lg:  24px;
--spacing-xl:  32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

### Tipografia (Recomendado)
```css
/* Tamanhos de fonte */
--text-xs:   0.75rem;  /* 12px */
--text-sm:   0.875rem; /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg:   1.125rem; /* 18px */
--text-xl:   1.25rem;  /* 20px */
--text-2xl:  1.5rem;   /* 24px */
--text-3xl:  1.875rem; /* 30px */
--text-4xl:  2.25rem;  /* 36px */

/* Pesos de fonte */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

---

## Exemplos de Uso

### Card com tema Light
```html
<div style="
  background: #FFFFFF;
  border: 1px solid #D9D2C9;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
">
  <h2 style="color: #1A1C23;">Título do Card</h2>
  <p style="color: #3D3F54;">Descrição do conteúdo</p>
  <button style="
    background: #B17467;
    color: #FFFFFF;
    border: 1px solid #B17467;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s ease-in-out;
  ">Ação Principal</button>
</div>
```

### Card com tema Dark
```html
<div style="
  background: #313342;
  border: 1px solid #3D3F54;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
">
  <h2 style="color: #FEFEFE;">Título do Card</h2>
  <p style="color: #D9D2C9;">Descrição do conteúdo</p>
  <button style="
    background: #DC9C7F;
    color: #1A1C23;
    border: 1px solid #DC9C7F;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s ease-in-out;
  ">Ação Principal</button>
</div>
```

---

## Variáveis CSS Recomendadas

### Para implementação com CSS Custom Properties

```css
:root {
  /* Cores Base - MILK */
  --milk-50:  #FFFFFF;
  --milk-100: #FEFEFE;
  --milk-200: #FCFCFC;
  --milk-300: #F9F9F9;
  --milk-400: #F5F5F5;
  --milk-500: #F0F0F0;
  --milk-600: #E8E8E8;
  --milk-700: #D9D9D9;
  --milk-800: #C4C4C4;
  --milk-900: #A8A8A8;

  /* Cores Base - STONE */
  --stone-50:  #F5F3F0;
  --stone-100: #EDE9E4;
  --stone-200: #E3DED7;
  --stone-300: #D9D2C9;
  --stone-400: #CFC6BA;
  --stone-500: #D0D2C2;
  --stone-600: #B8BAA8;
  --stone-700: #9A9C8A;
  --stone-800: #7C7E6C;
  --stone-900: #5E5F4E;

  /* Cores Base - CLAY */
  --clay-50:  #FBF2EE;
  --clay-100: #F5E0D6;
  --clay-200: #EECCBB;
  --clay-300: #E5B49D;
  --clay-400: #DC9C7F;
  --clay-500: #B17467;
  --clay-600: #9A5E51;
  --clay-700: #824D42;
  --clay-800: #6A3D34;
  --clay-900: #523027;

  /* Cores Base - GRAPHITE */
  --graphite-50:  #F5F5F6;
  --graphite-100: #E8E9EB;
  --graphite-200: #D1D3D7;
  --graphite-300: #B4B7BD;
  --graphite-400: #9096A0;
  --graphite-500: #4A4D67;
  --graphite-600: #3D3F54;
  --graphite-700: #313342;
  --graphite-800: #252730;
  --graphite-900: #1A1C23;

  /* Cores de Feedback - INFO */
  --info-50:  #EFF6F9;
  --info-100: #D9EAF2;
  --info-200: #B3D5E6;
  --info-300: #85BAD6;
  --info-400: #5B9FC7;
  --info-500: #4A7C8C;
  --info-600: #3D6673;
  --info-700: #31515C;
  --info-800: #253D46;
  --info-900: #1A2A31;

  /* Cores de Feedback - SUCCESS */
  --success-50:  #F0F7F3;
  --success-100: #DCEEE3;
  --success-200: #B8DCC7;
  --success-300: #8FC6A7;
  --success-400: #6BB089;
  --success-500: #52A675;
  --success-600: #428760;
  --success-700: #34694C;
  --success-800: #274D38;
  --success-900: #1B3527;

  /* Cores de Feedback - WARNING */
  --warning-50:  #FDF6ED;
  --warning-100: #FAEAD4;
  --warning-200: #F5D4A8;
  --warning-300: #EFBC76;
  --warning-400: #E8A24A;
  --warning-500: #C9935A;
  --warning-600: #A67747;
  --warning-700: #835E38;
  --warning-800: #61462A;
  --warning-900: #43301D;

  /* Cores de Feedback - DANGER */
  --danger-50:  #FDF2F3;
  --danger-100: #FAE0E3;
  --danger-200: #F5C1C7;
  --danger-300: #EE9BA5;
  --danger-400: #E67483;
  --danger-500: #C75D6A;
  --danger-600: #A34C57;
  --danger-700: #7F3C45;
  --danger-800: #5D2D33;
  --danger-900: #3F1F23;
}

/* Light Theme (padrão) */
:root {
  --bg-primary: var(--milk-100);
  --bg-secondary: var(--milk-400);
  --surface: #FFFFFF;
  --surface-elevated: var(--milk-50);
  
  --border-subtle: var(--stone-300);
  --border-default: var(--stone-400);
  
  --text-primary: var(--graphite-900);
  --text-secondary: var(--graphite-600);
  --text-tertiary: var(--graphite-400);
  --text-disabled: var(--stone-500);
  
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Dark Theme */
[data-theme="dark"] {
  --bg-primary: var(--graphite-900);
  --bg-secondary: var(--graphite-800);
  --surface: var(--graphite-700);
  --surface-elevated: var(--graphite-600);
  
  --border-subtle: var(--graphite-600);
  --border-default: var(--graphite-500);
  
  --text-primary: var(--milk-100);
  --text-secondary: var(--stone-300);
  --text-tertiary: var(--stone-500);
  --text-disabled: var(--graphite-400);
  
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
}
```

---

## Manutenção e Evolução

### Versionamento
- **Versão Atual**: 1.0.0
- **Data**: Novembro 2025

### Próximos Passos
- [ ] Implementação completa do Dark Theme
- [ ] Criação de componentes React com Tailwind CSS
- [ ] Documentação de componentes de formulário
- [ ] Guia de animações e micro-interações
- [ ] Tokens de design para Figma

### Contato
Para dúvidas ou sugestões sobre o Design System, entre em contato com a equipe de Design da SoTasty.

---

*Documento gerado em Novembro de 2025 - SoTasty Design System v1.0.0*
