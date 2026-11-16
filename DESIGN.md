---
name: Gestão Multi-lojas e E-Commerce
description: Plataforma operacional ágil para varejo adaptativo, PDV balcão e vitrine online integrada
colors:
  primary: "#2563EB"
  primary-hover: "#1D4ED8"
  primary-bg: "#EFF6FF"
  danger: "#DC2626"
  danger-hover: "#B91C1C"
  danger-bg: "#FEF2F2"
  neutral-app: "#F8FAFC"
  neutral-surface: "#FFFFFF"
  neutral-border: "#E2E8F0"
  neutral-muted: "#64748B"
  neutral-dark: "#0F172A"
  neutral-black: "#000000"
  neutral-text: "#1E293B"
  success: "#10B981"
  success-bg: "#ECFDF5"
  warning: "#F59E0B"
  warning-bg: "#FFFBEB"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  subtitle:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body-large:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
  body-compact:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  label:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
  label-micro:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
  label-nano:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
  label-badge:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input-field:
    backgroundColor: "{colors.neutral-app}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  card-surface:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge-status:
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Gestão Multi-lojas e E-Commerce

## Overview

**Creative North Star: "O Balcão Moderno"**

O sistema visual é construído sobre a metáfora do balcão de varejo de alta eficiência: tudo está ao alcance das mãos, cada ação responde com feedback físico imediato e a informação crítica (preços, estoque, pendências financeiras) é transmitida com legibilidade instantânea. No ambiente do lojista (PDV e retaguarda), a densidade é utilitária, enxuta e sem fricções; no ambiente do cliente (vitrine online), a experiência é elegante, fluida e desimpedida, conduzindo à conversão direta no WhatsApp.

A filosofia estética prioriza funcionalidade autêntica em vez de ornamentação vazia. Rejeitam-se expressamente gradientes violeta/roxos genéricos de IA, cartões aninhados que geram ruído estrutural, sombras difusas sem propósito e componentes decorativos sem valor operacional. A autoridade visual reside no equilíbrio entre contraste WCAG AA rigoroso, tipografia geométrica precisa e micro-interações táteis.

**Key Characteristics:**
- **Clareza de Balcão:** Informações financeiras e de estoque organizadas em hierarquia direta e sem ambiguidades.
- **Tonal Flat com Elevação Funcional:** Fundo neutro suave (`#F8FAFC`) com superfícies de conteúdo alvas (`#FFFFFF`) e sombras reservadas estritamente para estados interativos e modais.
- **Ergonomia Tátil:** Alvos de toque generosos ($\ge 44\times 44\text{px}$), cantos arredondados acolhedores (12px a 24px) e resposta elástica ao clique (`scale(0.98)`).
- **Resiliência Multi-Tenant:** Identidade visual viva e configurável por loja (cor primária, logotipo e avisos) sem quebra de contraste ou vazamento de estilos.

## Colors

A paleta equilibra a sobriedade executiva do ardósia escuro com a vivacidade operacional do azul cobalto e o poder sinalizador do rubi.

### Primary
- **Azul Cobalto Operacional** (`#2563EB`): Cor primária padrão da plataforma e âncora de identidade. Utilizada em botões de ação principal, seleções ativas, badges informativos e anéis de foco acessível.
- **Azul Cobalto Profundo** (`#1D4ED8`): Estado de hover da ação primária.
- **Azul Tint Brando** (`#EFF6FF`): Superfícies de apoio, filtros ativos e contêineres de contexto primário.

### Danger & Destaque
- **Rubi Alerta** (`#DC2626`): Utilizado em badges de promoção/oferta, avisos de estoque crítico, débitos pendentes e ações destrutivas confirmadas. Homologado para WCAG AA com contraste $\ge 4.5:1$ contra fundo branco.
- **Rubi Queimado** (`#B91C1C`): Hover em ações de perigo e textos de alerta em superfícies claras.
- **Rubi Suave** (`#FEF2F2`): Fundo de cartões de cobrança, cancelamento e avisos promocionais.

### Neutral
- **Ardósia Noturno** (`#0F172A`): Barra lateral executiva (desktop), gaveta móvel e fundos de alta hierarquia administrativa.
- **Cinza Profundo de Texto** (`#1E293B`): Cor padrão de tipografia para leitura confortável sem fadiga visual.
- **Cinza Muted** (`#64748B`): Rótulos secundários, metadados, legendas e ícones inativos.
- **Linha Divisora Suave** (`#E2E8F0`): Bordas de separação estrutural e contornos de cartões.
- **Superfície Alva** (`#FFFFFF`): Cartões de conteúdo, diálogos modais e menus suspensos.
- **Fundo do Ecossistema** (`#F8FAFC`): Plano de fundo neutro de toda a aplicação web.

### Secondary Accents
- **Esmeralda Concluído** (`#10B981` / Fundo: `#ECFDF5`): Indicadores de lucro líquido real, sincronização com banco de dados ativa e pagamentos quitados.
- **Âmbar Atenção** (`#F59E0B` / Fundo: `#FFFBEB`): Alertas de validade de lotes (30 dias), itens em reposição preventiva e destaques de catálogo.

### Named Rules
**The High-Contrast Destaque Rule.** Toda cor de promoção ou destaque dinâmico deve manter uma taxa de contraste mínima de 4.5:1 em relação ao fundo onde repousa. O tom `#DC2626` é a base normativa; tons avermelhados mais claros como `#EF4444` são proibidos em textos e badges com fundo branco.

**The Multi-Tenant Scope Rule.** As cores customizadas de lojistas (`--cor-tema`, etc.) injetam-se estritamente via variáveis CSS no escopo do lojista ativo. Cabeçalhos e botões dinâmicos devem declarar `color: #FFFFFF` ou herança explícita para evitar contraste insuficiente contra paletas personalizadas.

## Typography

**Display Font:** Plus Jakarta Sans (sans-serif)  
**Body Font:** Plus Jakarta Sans (sans-serif)  
**Tabular/Data:** Plus Jakarta Sans com `font-variant-numeric: tabular-nums` e `font-feature-settings: 'tnum' 1`

A tipografia geométrica moderna alia peso expressivo nos números e cabeçalhos com legibilidade nítida e ampla em corpos de texto de notas de balcão e listas de catálogo.

### Hierarchy
- **Display** (800 ExtraBold, 2rem / 32px, line-height 1.15): Títulos de impacto principal de telas administrativas e boas-vindas do sistema.
- **Headline** (700 Bold, 1.5rem / 24px, line-height 1.25): Títulos de seções principais (Métricas, Minha Loja, Estoque).
- **Title** (700 Bold, 1.25rem / 20px, line-height 1.3): Títulos de cartões de dados, modais e agrupamentos funcionais.
- **Sub-Title** (600 SemiBold, 1.125rem / 18px, line-height 1.5): Cabeçalhos de blocos secundários e tabelas.
- **Body Base** (500 Medium, 1rem / 16px, line-height 1.5): Parágrafos descritivos e textos explicativos de políticas e avisos.
- **Body Compact** (500 Medium, 0.875rem / 14px, line-height 1.4): Listagens de produtos, dados de tabelas e valores do catálogo.
- **Micro / Label** (700 Bold, 0.6875rem / 11px a 0.625rem / 10px, uppercase, letter-spacing 0.05em): Rótulos de formulário, badges de status, pills de categorias e identificadores de coluna.

### Named Rules
**The Tabular Currency Rule.** Todo valor monetário (`R$ ...`), quantidade fracionada e métrica de desempenho numérico deve aplicar compulsoriamente `tabular-nums`. O alinhamento vertical dos dígitos impede que valores oscilem horizontalmente durante atualizações reativas de caixa e filtros.

**The No-Skip Heading Rule.** A hierarquia estrutural do documento não pode saltar níveis semânticos. Um `<h2>` deve ser seguido por `<h3>` ou texto de apoio; o uso de `<h4>` direto sob `<h2>` é proibido.

## Layout

O modelo espacial adota uma estrutura em duas zonas operacionais:

1. **Barra de Controle (Desktop Sidebar & Mobile Drawer):** Largura fixa de 256px (`w-64`) no desktop em Ardósia Noturno; gaveta deslizante lateral (`w-72 max-w-[85vw]`) em telas touch móveis com backdrop escuro (`bg-slate-900/80 backdrop-blur-sm`).
2. **Palco Central de Conteúdo:** Contêiner fluido responsivo (`max-w-7xl mx-auto w-full p-4 md:p-8`) com grid adaptativo de 1 a 5 colunas para métricas, gráficos e tabelas.
3. **Vitrine Pública (E-Commerce):** Contêiner focado (`max-w-5xl mx-auto px-4 py-4`) com cabeçalho de marca dinâmico, barra de busca instantânea e grid responsivo de 2 colunas no smartphone e 4 colunas no desktop.

**Densidade & Espaçamento:**
- Ritmo de 8px: `gap-2` (8px), `gap-3.5` (14px), `gap-4` (16px), `space-y-6` (24px).
- Margens inferiores generosas (`pb-20 md:pb-0`) para acomodar com segurança a barra de navegação móvel fixa inferior em smartphones sem sobrepor botões de ação ou totais de venda.

## Elevation & Depth

O sistema adota uma abordagem **Tonal Flat com Elevação Funcional**: o estado de repouso é totalmente bidimensional, estruturado por fundos contrastantes (`bg-white` sobre `bg-slate-50`) e bordas delicadas (`border border-slate-200/80`). Sombras não atuam como enfeite, mas como pistas táteis de estado ativo, elevação de camadas e hierarquia de foco.

### Shadow Vocabulary
- **Nível 0 (Repouso):** `box-shadow: none` — Cartões internos, tabelas e contêineres padrão delimitados por borda `1px solid #E2E8F0`.
- **Nível 1 (Sutil):** `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` — Cartões de métricas do dashboard e botões secundários.
- **Nível 2 (Interativo / Hover):** `box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` — Cartões de produto ao passar o cursor e botões primários destacados.
- **Nível 3 (Flutuante / Modal):** `box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)` — Modais centralizados, gaveta mobile e diálogos de confirmação de segurança.

### Named Rules
**The Zero-Nested-Card Rule.** É estritamente proibido aninhar um cartão com borda e sombra dentro de outro cartão com borda e sombra. Divisões internas devem ser estabelecidas unicamente por variações tonais de fundo (`bg-slate-50/70`), linhas divisórias sutis (`border-t border-slate-100`) ou espaçamento tipográfico.

## Shapes

A linguagem de formas é **Acolhedora, Tátil e Confiável**. Cantos arredondados generosos eliminam a rigidez corporativa fria sem perder a compostura de uma ferramenta comercial séria.

- **Micro (8px / `rounded-lg`):** Badges compactos, botões internos de tabelas e seletores segmentados.
- **Padrão (12px / `rounded-xl`):** Botões de ação, campos de entrada (`<input>`, `<select>`), botões de navegação e filtros.
- **Contêiner Médio (16px / `rounded-2xl`):** Cartões de métricas secundárias, caixas de agrupamento de cores e itens de lista.
- **Painel / Cartão Master (24px / `rounded-3xl`):** Cartões de primeiro nível do painel, modais e seções completas.
- **Pill / Cápsula (9999px / `rounded-full`):** Badges de status, selos de categoria, tags de desconto e botões de filtro rápido.

## Components

### Buttons
- **Shape:** Arredondamento suave de 12px (`rounded-xl`).
- **Primary (`.btn-tema`):** Fundo dinâmico `{colors.primary}`, texto branco `#FFFFFF`, padding `10px 16px` (ou `12px 24px` em checkout), peso 700 Bold.
- **Hover & Active:** Escurecimento tonal no hover (`{colors.primary-hover}`); leve compressão elástica no clique ativo (`transform: scale(0.98)`).
- **Secondary / Ghost:** Fundo branco, borda `1px solid #E2E8F0`, texto `#1E293B`, padding `8px 14px`, hover suave para `bg-slate-50`.
- **Destructive:** Fundo suave `#FEF2F2`, borda `#FECACA`, texto `#B91C1C`, hover para `#FEE2E2`.

### Inputs & Fields
- **Style:** Fundo neutro `#F8FAFC`, borda `1px solid #E2E8F0`, raio 12px (`rounded-xl`), texto `#1E293B` em 14px com peso 600 SemiBold.
- **Focus:** Fundo ilumina para `#FFFFFF`, anel de foco visível com 2px em `{colors.primary}` com offset de 2px, sem outline feio do navegador.
- **Caret:** Cor do cursor de digitação (`caret-color`) vinculada à cor primária do tema ativo.

### Cards / Containers
- **Corner Style:** 24px (`rounded-3xl`) para contêineres principais; 16px (`rounded-2xl`) para blocos secundários.
- **Background:** Superfície alva `#FFFFFF` ou gradiente administrativo profundo (`from-slate-900 to-indigo-950`).
- **Borders:** Linha hairline `1px solid #E2E8F0/80`.
- **Internal Padding:** `p-5` a `p-6` (20px a 24px) no desktop; `p-4` (16px) no smartphone.

### Chips & Badges
- **Style:** Formato cápsula (`rounded-full`), padding vertical de 2px a 4px e horizontal de 8px a 12px.
- **Typography:** 10px a 11px, ExtraBold / Black, letras maiúsculas para status operacional.
- **Variantes:**
  - *Destaque/Promoção:* Fundo `#DC2626`, texto branco `#FFFFFF`.
  - *Sucesso/Ativo:* Fundo `#D1FAE5`, texto `#065F46`.
  - *Alerta/Pendente:* Fundo `#FEF3C7`, texto `#92400E`.
  - *Muted:* Fundo `#F1F5F9`, texto `#475569`.

### Segmented Controls (Alternadores de Opção)
- **Style:** Fundo de trilho plano `#E2E8F0/70`, raio 12px (`rounded-xl`), padding interno compacto de 2px.
- **Active Pill:** Botão selecionado com fundo `{colors.primary}`, texto branco e leve sombra de profundidade (`shadow-sm`).
- **Inactive Pill:** Texto em cinza `#64748B`, transparente, sem bordas adicionais.

### Signature Component: Vitrine Product Card
O cartão de produto do catálogo online combina imagem em proporção consistente com zoom sutil no hover (`group-hover:scale-105 transition-transform duration-300`), selos flutuantes de oferta (`-X% OFF`), preço em destaque visual e botão de acréscimo rápido à sacola via WhatsApp.

## Do's and Don'ts

### Do:
- **Do** manter todos os botões de ação e itens tocáveis com no mínimo $44\times 44\text{px}$ de área de interação efetiva ou padding compensatório.
- **Do** aplicar `loading="lazy"` e `decoding="async"` em todas as tags `<img>` de produtos injetadas dinamicamente via JavaScript.
- **Do** respeitar o modo de movimento reduzido com `@media (prefers-reduced-motion: reduce)`, desativando transições bruscas para usuários sensíveis.
- **Do** formatar todo número monetário ou métrica com a classe e estilização `tabular-nums`.
- **Do** utilizar exclusivamente ícones da biblioteca Lucide com espessura de traço consistente de 1.75 a 2px, sem misturar com emojis do sistema em rótulos de interface.

### Don't:
- **Don't** aninhar cartões com bordas e sombras dentro de outros cartões (`nested-cards`).
- **Don't** utilizar fontes genéricas de IA como Inter, Roboto ou Geist; a identidade visual é estritamente vinculada à *Plus Jakarta Sans*.
- **Don't** utilizar texto com gradiente colorido decorativo; ênfase visual deve ser alcançada através de peso tipográfico (ExtraBold/Black) ou escala de tamanho.
- **Don't** aplicar cores de destaque com contraste inferior a 4.5:1 com branco (como `#EF4444`).
- **Don't** deixar campos de formulário sem rótulos semânticos explícitos (`<label>`) e anéis de foco visíveis para navegação via teclado.
