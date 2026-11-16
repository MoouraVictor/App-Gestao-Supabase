# 📋 Histórico de Alterações e Monitoramento do Sistema (Changelog)

Este documento registra todas as alterações, manutenções, implementações de novas funcionalidades e correções realizadas na plataforma de Gestão de Vendas, Catálogo Digital e PDV.

---

## 📌 Versão 4.5.5 — Isolamento do Painel Master, Menus em Alto Contraste, Gestão do Carrinho da Vitrine e Responsividade Mobile Total
**Data:** 16/11/2026  
**Status:** Concluído e Homologado (Detector Impeccable: 0 anti-patterns, 0 avisos)

### 1. Isolamento Estrito do Tema do Painel Master (`CORES_PADRAO_MASTER`):
- 🛡️ **Blindagem de Identidade do Master:** Criada constante global `CORES_PADRAO_MASTER` (`#2563EB`, `#EF4444`, `#0F172A`, `#F8FAFC`). Ao entrar no sistema como Administrador Master ou ao acionar o botão *"👑 Voltar ao Painel Master"*, a função `aplicarIdentidadeVisualLoja(CORES_PADRAO_MASTER)` é executada imediatamente, eliminando qualquer contaminação das cores de lojas individuais na interface global.

### 2. Tipografia e Menus em Alto Contraste Dinâmico (Sidebar, Header, Drawer e Bottom Nav):
- 🎨 **Conformidade WCAG 2.1 AA ($L > 0.35$):** A função de cálculo de luminância relativa foi estendida para gerenciar dinamicamente `--cor-menu-sidebar`, `--cor-menu-texto` (`#0F172A` vs `#FFFFFF`), `--cor-menu-texto-sec`, `--cor-menu-item-hover`, `--cor-menu-borda`, `--cor-menu-card-bg` e `--cor-menu-btn-bg`.
- 👁️ **Fim dos Textos Ilegíveis em Menus Claros:** Substituídas classes Tailwind estáticas (`text-slate-300`, `text-white`, `bg-slate-800`) por seletores semânticos universais (`.bg-menu-custom`, `.text-menu-custom`, `.text-menu-secundario`, `.nav-item-menu`, `.nav-item-ativo`, `.nav-bottom-btn`, `.menu-card-perfil`, `.menu-btn-acao`, `.menu-divisor`). Não importa a cor escolhida pelo lojista (inclusive branco, amarelo ou tons pastéis), todos os textos, ícones e divisores mantêm legibilidade máxima automática.

### 3. Gestão Completa da Sacola na Loja Online (`carrinhoVitrine`):
- 🗑️ **Remoção Unitária com Stepper de Quantidade:** Adicionados botões de ajuste de quantidade `(-)` e `(+)` (`alterarQtdItemCarrinhoVitrine(idx, delta)`) e botão de exclusão rápida individual (`trash-2`) (`removerItemCarrinhoVitrine(idx)`), com atualização instantânea do subtotal e contador de sacola.
- 🧹 **Limpeza Total com Confirmação Defensiva:** Implementada ação "Limpar Sacola" (`limparCarrinhoVitrine`) com diálogo protetivo SweetAlert2 para evitar perdas acidentais de pedidos montados.
- 🛍️ **Empty State Ergonômico:** Sacola vazia exibe ilustração, mensagem amigável e desabilitação automática do botão "Enviar Pedido via WhatsApp" com feedback contextual.

### 4. Responsividade e Formatação das Tabelas de Vendas e Histórico do Cliente:
- 📊 **Modal Detalhes da Venda (`modalDetalhesVenda`):** Corrigido o truncamento de colunas em dispositivos móveis. Substituído container restritivo por `overflow-x-auto` com largura mínima controlada (`min-w-[500px]`), indicação visual de rolagem horizontal (`Deslize a tabela para o lado`) e células protegidas com `whitespace-nowrap`.
- 📜 **Histórico Financeiro do Cliente (`modalHistoricoCliente`):** Tabela de histórico de compras formatada com container de rolagem suave (`min-w-[620px]`), cabeçalho fixo (`sticky top-0`) e indicador de deslize lateral em telas compactas.
- 💳 **Tabela de Vendas & Cobranças (`tela-cobranca`):** Adicionada proteção `min-w-[680px]` e indicação para telas de smartphone.

### 5. Auditoria e Padronização Mobile Global (Main Tables & Bottom Nav Guard):
- 📱 **Blindagem contra Sobreposição do Menu Inferior:** Injetado `pb-24 md:pb-6` no contêiner principal `<main>` para impedir que a barra de navegação móvel fixa (`#mobileBottomNav`) sobreponha botões, rodapés ou formulários.
- 📑 **Padronização Responsiva em Todas as Tabelas do Sistema:** Aplicados containers `overflow-x-auto`, larguras mínimas calibradas (`min-w-[540px]` a `min-w-[720px]`), cabeçalhos `whitespace-nowrap` e dicas visuais em:
  - Gerenciador Geral de Lojas (`#tabelaMasterLojas`);
  - Alerta de Reposição de Estoque no Dashboard (`#tabelaEstoqueCritico`);
  - Despesas e Saídas de Caixa (`#tabelaDespesas`);
  - Pedidos & Orçamentos Online (`#tabelaPedidos`);
  - Estoque e Catálogo de Produtos (`#tabelaProdutos`);
  - Cadastro Geral de Clientes (`#tabelaClientes`).
- 📐 **Espaçamento Otimizado em Telas Pequenas:** Reduzido o padding externo de modais em mobile de `p-5 sm:p-6` para `p-4 sm:p-6` para máximo aproveitamento da tela útil.

---

## 📌 Versão 4.5.4 — Blindagem Defensiva, Acessibilidade WAI-ARIA e Refinamento de Autenticação
**Data:** 16/11/2026  
**Status:** Concluído e Homologado (Detector Impeccable: 0 anti-patterns, 0 avisos)

### 1. Refinamento Ergonômico do Modal de Login (`#modalLogin`):
- 🛡️ **Integração Visual de Cabeçalho:** Removido o ícone empilhado em bloco cinza isolado (resolvendo o anti-padrão `icon-tile-stack`). Implementada linha integrada em flexbox (`flex items-center justify-center space-x-3 mb-2`) com o título do sistema, resultando em visual moderno e profissional.
- 👁️ **Contraste de Acessibilidade em Inputs:** Placeholders dos campos `#loginUsuario` e `#loginSenha` ajustados com `placeholder:text-slate-500`, assegurando conformidade de contraste $\ge 4.5:1$ (WCAG AA).
- 🔤 **Legibilidade do Rodapé de Segurança:** Micro-texto de 11px substituído por `text-xs text-slate-600 font-medium` (12px), eliminando avisos de `tiny-text` e baixo contraste.

### 2. Confirmação Defensiva na Exclusão de Produtos (`excluirProduto`):
- ⚠️ **Prevenção contra Exclusão Acidental:** Substituída a remoção imediata e silenciosa por diálogo modal SweetAlert2 defensivo (`Swal.fire`).
- 🛑 **Foco no Cancelamento e Nome Explícito:** O modal exibe o nome real do produto (`"${escapeHtml(nomeProd)}"`) e define o foco primário no botão de cancelamento (`focusCancel: true`), com confirmação destrutiva destacada em vermelho.

### 3. Trava de Segurança no Cancelamento do Carrinho PDV (`limparCarrinho` & `F2`):
- 🛒 **Proteção do Atendimento Ativo:** Ao acionar "Limpar" no cabeçalho do carrinho ou pressionar a tecla de atalho `F2`, o sistema agora verifica se há itens inseridos (`ESTADO.carrinhoPdv.length > 0`) e solicita confirmação antes de descartar os produtos.
- ⚡ **Fluxo Direto na Venda Concluída:** O fechamento automático após a concretização da venda (`finalizarVendaPdv`) segue liberado diretamente sem interrupção do operador.

### 4. Sincronização Bidirecional de Prestação de Serviço (`modalProduto`):
- 🔄 **Conexão Integrada Select ↔ Aba Segmentada:** Ao alternar para a aba "Serviços", o campo `#prodTipoItem` é automaticamente sincronizado para `SERVICO`, ajustando os parâmetros de estoque virtual (999).
- 🔁 Ao alternar para abas de produtos físicos (Varejo Geral, Moda & Brechó, Perfumaria), o tipo de item é restaurado de forma segura para `PRODUTO` sem recursão ou perda de estado.

### 5. Semântica WAI-ARIA nas Abas de Nicho (`modalProduto`):
- ♿ **Suporte Normativo a Leitores de Tela:** Adicionados `role="tablist"` com `aria-label`, `role="tab"` com `aria-selected` e `aria-controls` nos botões seletores, e `role="tabpanel"` com `aria-labelledby` em cada painel correspondente.
- 🎯 Alternância dinâmica do estado `aria-selected="true|false"` em tempo real via JavaScript.

---

## 📌 Versão 4.5.3 — Operação Ergonômica de Caixa, Atalhos de Teclado e Descoberta Progressiva
**Data:** 16/11/2026  
**Status:** Concluído e Homologado (Detector Impeccable: 0 anti-patterns, 0 avisos)

### 1. Descoberta Progressiva no Cadastro de Produtos (`/impeccable clarify`):
- 🗂️ **Abas Dinâmicas de Nicho (`modalProduto`):** Eliminada a sobrecarga cognitiva do formulário monolítico (18+ campos simultâneos). Implementado seletor de abas ergonômico por segmento com alternância dinâmica:
  - **Varejo Geral:** Visualização limpa e focada em campos universais (código, descrição, preço de custo, markup, preço de venda e estoques);
  - **Moda & Brechó:** Exibição isolada de condição da peça, medidas reais em cm, flag de peça única e consignante com comissão de repasse;
  - **Perfumaria & Beleza:** Validade do lote com monitoramento visual de vencimento;
  - **Serviços & Salão:** Conversão automática para prestação de serviço com estoque virtual irrestrito.
- 🔄 **Ativação Inteligente de Abas:** Ao editar um produto existente (`editarProduto`), o sistema inspeciona os atributos do item e abre automaticamente na aba correspondente ao nicho do produto.

### 2. Acessibilidade de Teclado e Agilidade de Balcão (`/impeccable harden`):
- ⌨️ **Tecla `Escape` Global:** Adicionado ouvinte global para fechar imediatamente o modal ativo ou gaveta lateral mobile, evitando que operadores fiquem presos dentro de caixas de diálogo.
- ⚡ **Atalhos Rápidos de PDV:**
  - `/`: Foca e seleciona imediatamente o campo de busca de produtos (`#buscaPdv`);
  - `F2`: Limpa o carrinho de compras e reinicia uma nova venda;
  - `F4`: Dispara a finalização da venda (`finalizarVendaPdv`);
  - `1`, `2`, `3`, `4`: Seleção instantânea de forma de pagamento (Dinheiro, Pix, Crédito ou Débito) quando o foco não estiver em campos de texto.
- 🏷️ **Legenda Visual de Teclas:** Injetada barra de orientação na base do carrinho PDV com micro-badges (`kbd`) informando os atalhos disponíveis ao operador.

### 3. Blindagem de Risco Financeiro no PDV (`/impeccable layout`):
- ⚠️ **Visibilidade Imediata de Inadimplência:** O seletor de clientes do balcão PDV agora exibe indicador `⚠️ [Nome] (Deve R$ XX,XX)` para clientes com saldo devedor pendente.
- 🔔 **Alerta de Débito com Ação Direta:** Ao selecionar um cliente com pendências financeiras, um banner de alerta é exibido instantaneamente no carrinho com botão de atalho `Ver Contas`, permitindo abrir a ficha de histórico do cliente e negociar débitos antes de autorizar novas vendas a prazo.

### 4. Humanização de Textos e Remoção de Jargões Técnicos (`/impeccable quieter`):
- 🛡️ **Painel Administrativo Master e Nuvem:** Removidos jargões de desenvolvedor (`PostgreSQL + RLS + Storage`, `Transações ACID`) das telas principais.
- ✨ **Cópia Empática de Confiança:** Substituídos por títulos orientados a valor de negócio (*"Sincronização em Nuvem Segura"*, *"Backup automático em tempo real, proteção de dados e armazenamento seguro de fotos"*). Endpoints e detalhes de infraestrutura foram organizados dentro de blocos expansíveis `<details>` para técnicos avançados.

### 5. Guarda Dinâmica de Contraste por Luminância Relativa (`/impeccable colorize`):
- 🎨 **Cálculo Normativo de Luminância (WCAG 2.1):** Função `isCorClara` atualizada para calcular a luminância relativa $L = 0.2126 \cdot R + 0.7152 \cdot G + 0.0722 \cdot B$ no espaço sRGB linearizado, calibrada com ponto de virada normativo em **$L > 0.35$** (cobrindo com perfeição tons pastéis, azuis médios, laranjas, amarelos e verdes claros).
- 👁️ **Proteção Automática de Legibilidade:** Quando o lojista escolhe uma cor com $L > 0.35$, as variáveis `--cor-tema-texto` e `--cor-destaque-texto` são automaticamente configuradas para `#0F172A` (Slate 900) em vez de branco, garantindo conformidade matemática com o critério WCAG AA $\ge 4.5:1$ em todos os botões (`.btn-tema`), selos promocionais (`.badge-destaque`) e cabeçalho da vitrine (`#vitrineHeader`).
- ⚡ **Feedback em Tempo Real & Persistência Instantânea:** Adicionado evento `oninput` aos seletores livres de cor para renderização instantânea enquanto o usuário desliza o cursor na paleta, com gravação imediata no `localStorage` para evitar que navegações ou o botão "Visualizar Loja Online" resetem o tema selecionado.
- 🧹 **Eliminação de Estilos Inline Conflitantes:** Removidos estilos fixos `style="color: #ffffff;"` dos títulos da vitrine (`#vitrineNomeLoja` e `#vitrineSlogan`), permitindo que a cor dinâmica calculada flua livremente por herança CSS.

---

## 📌 Versão 4.5.2 — Especificação Canônica do Design System (DESIGN.md & design.json)
**Data:** 16/11/2026  
**Status:** Concluído e Homologado (Detector Impeccable: 0 anti-patterns, 0 avisos, Score 20/20)

### 1. Documentação Formal do Design System (`/impeccable document`):
- 📐 **Criação do `DESIGN.md`:** Especificação formal do sistema visual baseada na Creative North Star *"O Balcão Moderno"*, capturando:
  - Tokens de cores primárias, neutras, semânticas de perigo/alerta e acentos adaptativos;
  - Escala tipográfica completa (*Plus Jakarta Sans*, do Display 32px até o Label-nano 8px);
  - Escala de raios de curvatura (*rounded*) de 8px a 9999px e ritmo de espaçamento;
  - Regras canônicas nomeadas (*The High-Contrast Destaque Rule*, *The Multi-Tenant Scope Rule*, *The Tabular Currency Rule*, *The No-Skip Heading Rule* e *The Zero-Nested-Card Rule*);
  - Guardrails explícitos de "Do's & Don'ts" para futuras implementações.
- 🧩 **Sidecar `.impeccable/design.json`:** Gerado arquivo de extensões (schemaVersion 2) contendo rampas tonais em 8 passos, tokens de sombras, curvas de movimento exponencial (`cubic-bezier(0.16, 1, 0.3, 1)`), breakpoints responsivos e snippets HTML/CSS isolados com escopo `ds-` para renderização em Shadow DOM.
- 🖨️ **Harmonização do Recibo de Impressão Térmica:**
  - Padronizada a tipografia do comprovante para utilizar *Plus Jakarta Sans*;
  - Substituídas cores hexadecimais legadas (`#ddd`, `#e11d48`, `#059669`) pelos tokens oficiais do sistema (`#E2E8F0`, `#DC2626`, `#10B981`).

---

## 📌 Versão 4.5.1 — Polimento de Superfícies de Navegador, Estados Vazios e Micro-interações
**Data:** 16/11/2026  
**Status:** Concluído e Homologado (Detector Impeccable: 0 anti-patterns, Score 20/20)

### 1. Polimento de Superfícies de Navegador (Browser Surfaces):
- 🎯 **Seleção e Cursores:** Implementada estilização customizada de seleção de texto (`::selection`) e cor do cursor de digitação (`caret-color`) herdando dinamicamente a cor da marca da loja (`var(--cor-tema)`).
- 🔍 **Anéis de Foco Acessíveis:** Estabelecido anel de foco padronizado (`:focus-visible`) com contraste nítido (`2px solid var(--cor-tema)` com offset de 2px), garantindo conformidade para navegação por teclado.
- 🔢 **Numerais Tabulares:** Aplicado `font-variant-numeric: tabular-nums` e `font-feature-settings: 'tnum' 1` em tabelas, preços, subtotais e cartões métricos para eliminar oscilações horizontais na atualização de valores numéricos.
- 📜 **Scrollbars Elegantes:** Substituídas as barras de rolagem padrão cinzas por barras finas e arredondadas com trilho transparente integradas nativamente via CSS (`scrollbar-width: thin` e pseudo-elementos WebKit).

### 2. Estados Vazios Humanizados (*Empty States*):
- 📦 **Vitrine Pública:** Substituída a mensagem textual simples por um contêiner ilustrado com ícone Lucide (`package-search`), título empático e orientação de busca.
- 🛒 **PDV Balcão e Carrinho:** Implementados estados vazios visuais para o catálogo filtrado e para o carrinho de compras com ícones dedicados e orientações de clique.
- 📊 **Alertas de Estoque:** Implementado estado de sucesso positivo no dashboard com ícone de checagem verde (`check-circle-2`) quando todos os estoques estão saudáveis.

### 3. Iconografia Consistente e Micro-interações:
- ✨ **Eliminação de Emojis em Rótulos Estáticos:** Emojis decorativos em títulos, avisos e botões foram substituídos por ícones Lucide SVG desenhados (megafone, chama, estrela/brilho, etiqueta, lâmpada).
- 🖱️ **Feedback Tátil:** Adicionada transição suave com amortecimento exponencial (`cubic-bezier(0.16, 1, 0.3, 1)`) e efeito de compressão leve (`scale(0.98)`) no clique ativo de botões e ações, desativado respeitosamente quando `prefers-reduced-motion` está ativo.

---

## 📌 Versão 4.5.0 — Blindagem de UI/UX, Acessibilidade e Refatoração Impeccable
**Data:** 16/11/2026  
**Status:** Concluído e Homologado (Detector Impeccable: 0 anti-patterns, Score 20/20)

### 1. Diagnóstico e Auditoria Inicial (`/impeccable audit`):
- Auditoria de design estático e padrões de UI/UX detectou **34 anti-patterns** na interface (Score inicial 8/20), compreendendo:
  - Contrastes insuficientes (WCAG AA < 4.5:1) em badges de promoção e textos sobre fundo temático;
  - Ausência de semântica ARIA (`role="dialog"` e `aria-modal="true"`) em 16 modais e gavetas;
  - Tags `<img>` com `src=""` gerando requisições vazias desnecessárias;
  - Hierarquia tipográfica com saltos de nível (`h4` após `h2`) e estilos com cores de "IA Slop" (roxo/violeta);
  - Camadas excessivas de cartões aninhados (*nested cards*) em painéis métricos, vitrine e PDV;
  - Elementos colados às bordas (*cramped padding*) por falta de espaçamento estático em contêineres customizados.

### 2. Ações Implementadas & Melhorias de Interface:
- 🎨 **Acessibilidade e WCAG AA:**
  - Ajustada a cor de destaque promocional para `--cor-destaque: #DC2626` (garantindo contraste > 4.5:1 com branco).
  - Adicionado `color: inherit` e regras base tipográficas (`h1-h4`), garantindo herança correta em cabeçalhos de temas dinâmicos.
  - Implementado `role="dialog"` e `aria-modal="true"` em todos os modais e gavetas (`modalLogin`, `drawerMenuMobile`, `modalProduto`, `modalCheckoutCliente`, etc.).
  - Substituídos `src=""` vazios em 6 imagens estáticas por data URIs SVG transparentes inline.
- 📐 **Hierarquia e Eliminação de Cartões Aninhados (*Zero Nested Cards*):**
  - Achatada a estrutura visual em `tela-master` (`painelInfoSupabase`), `tela-dashboard` (`painelMetricasVitrine`), `tela-loja-online` (seletores de cores e `<details>`), `tela-pdv` (botão segmentado à vista/a prazo), `modalCheckoutCliente` e `modalProduto`.
  - Remoção de bordas secundárias redundantes em favor de espaçamentos limpos e fundos suaves (`bg-slate-50/80`).
- ⚡ **Semântica HTML5 e Responsividade:**
  - Convertido o drawer mobile de `<div>` para `<aside class="w-72 ...">` e o cabeçalho do catálogo de `<div>` para `<header id="vitrineHeader">`.
  - Adicionado suporte nativo a acessibilidade vestibular via `@media (prefers-reduced-motion: reduce)`.
  - Adicionados atributos `loading="lazy"` e `decoding="async"` em todas as imagens renderizadas dinamicamente nas vitrines e PDV.
- 🎯 **Resultado da Verificação:**
  - Scanner `impeccable detect index.html` aprovado com **0 anti-patterns**.
  - Nota de auditoria elevada de **8/20** para **20/20 (Flawless)**.

---

## 📌 Versão 4.4.0 — Blindagem Global de Segurança (OWASP Top 10 & Supabase Hardening)
**Data:** 15/11/2026  
**Status:** Concluído e Homologado (100% dos testes E2E aprovados via Microsoft Edge Headless CDP)

### 1. Auditoria de Segurança e Diagnóstico:
- Realizada auditoria profunda de conformidade com as diretrizes do **OWASP Top 10** e boas práticas de segurança em aplicações Client-Side e Cloud Backend (Supabase/PostgreSQL).
- Identificados e neutralizados 6 pontos de atenção (SEC-01 a SEC-06), englobando injeção de script (XSS), autorização em banco de dados (Row Level Security), integridade de cadeia de suprimentos e autenticação offline.

### 2. Melhorias e Blindagens Implementadas:
- 🛡️ **SEC-01 (Prevenção Total contra Stored XSS):**
  - Implementada função nativa de sanitização `escapeHtml(str)` no escopo global e integrada a `window.escapeHtml`.
  - Higienização sistemática aplicada em todos os pontos de injeção dinâmica no DOM (`innerHTML`), incluindo:
    - Vitrine pública online (`renderizarVitrineCliente`, `filtrarVitrineCliente`, `checkoutItensLista`);
    - Tabelas do painel administrativo (`renderizarCobranca`, `renderizarPedidos`, `renderizarClientes`, `renderizarProdutosTabela`, `renderizarDespesasTabela`);
    - Modais de auditoria e detalhes (`abrirModalDetalhesVenda`, `renderizarConteudoHistoricoCliente`, `renderizarPainelMaster`);
    - Telemetria de produtos e alertas (`renderizarRankingMaisVendidos`, `renderizarTelemetriaVitrineDashboard`, `renderizarAlertasValidadeDashboard`, `renderizarEstoqueCritico`, `filtrarPdv`, `renderizarCarrinhoPdv`).
- 🔒 **SEC-02 (Refinamento de Row Level Security no Supabase):**
  - Atualizado o script `sql/security_hardening.sql` eliminando políticas permissivas `FOR ALL USING (true)`.
  - Estabelecidas regras estritas de integridade de dados para `produtos`, `vendas`, `itens_venda`, `clientes`, `despesas`, `configuracoes_loja` e `metricas_eventos`.
  - Preservada a coluna `senha_hash` da tabela `lojas` com acesso estritamente revogado para usuários `anon` e `authenticated`, utilizando RPC `autenticar_usuario` com permissões `SECURITY DEFINER`.
- 🔑 **SEC-03 (Eliminação de Senhas Padrão em Modo Offline):**
  - Removido o array de senhas master fracas pré-programadas (`['123', 'admin123', 'admin']`) da função `autenticarCredenciais`.
  - O fallback offline agora exige estritamente a conferência contra o hash seguro SHA-256 armazenado previamente (`db.master.senha`), impedindo acesso indevido por bypass de rede.
- 💰 **SEC-04 (Proteção contra Adulteração de Preços no Checkout):**
  - Em `concluirPedidoOnlineWhatsApp`, adicionada rotina de auditoria canônica que revalida e recalcula compulsoriamente os preços unitários, subtotais e promoções de cada item contra o catálogo oficial `loja.produtos`.
  - Impede qualquer manipulação de preços em memória ou console pelo navegador do cliente antes do envio do pedido.
- 📦 **SEC-05 & SEC-06 (Integridade de Dependências e Cabeçalhos HTTP):**
  - Fixada versão canônica estrita para a biblioteca Lucide (`lucide@0.460.0`), prevenindo quebras e ataques por dependências dinâmicas `@latest`.
  - Adicionadas meta-tags de segurança no `<head>` do documento: `X-Content-Type-Options: nosniff` (prevenção de MIME-sniffing) e `Referrer-Policy: strict-origin-when-cross-origin` (proteção de privacidade de URLs e referrers).

---

## 📌 Versão 4.3.2 — Blindagem de Segurança e Persistência do Bot Central do Telegram
**Data:** 14/11/2026  
**Status:** Concluído e Homologado (100% dos testes E2E aprovados via Microsoft Edge Headless CDP)

### 1. Diagnóstico do Erro de Token Ausente:
- Ao testar a notificação na tela de configurações da loja (`tela-loja-online`), o sistema retornava: *"Não foi possível enviar a mensagem no Telegram. Detalhes: Nenhum token do Bot do Telegram configurado no sistema."*
- **Causa Raiz:** O bot recém-criado (`@GestaoNotificaBot`) ainda não possuía seu token gravado na base de dados do lojista ou do master. Além disso, o token não deve ser escrito de forma estática no arquivo `index.html` (para prevenir vazamentos de segurança e bloqueio automático pelo GitHub Secret Scanning).
- O sistema exigia que a configuração fosse propagada dinamicamente pela nuvem ou informada pelo operador.

### 2. Ações Implementadas & Segurança da Informação:
- **Zero Hardcode de Credenciais no HTML/GitHub:** O token do Bot NUNCA é inserido em texto plano dentro do repositório público, garantindo que terceiros não interceptem o bot, façam spam ou roubem dados de clientes.
- **Persistência Segura em Nuvem (`sql/configuracoes_plataforma.sql`):** Criado script SQL para provisionamento da tabela `configuracoes_plataforma` no Supabase com Row Level Security (RLS) para sincronizar o Bot Central (`@GestaoNotificaBot`) entre todos os lojistas e vitrines.
- **Sincronização Direta na Loja:** A loja ativa (`LOJA-1`) teve seu token sincronizado no Supabase (`configuracoes_loja.telegram_bot_token_custom`).
- **Melhoria da Experiência do Usuário (UX):**
  - Adicionado botão de alternar visibilidade de senha (ícone de olho 👁️) nos campos de token do Master e do Lojista.
  - Alerta guiado detalhado quando o usuário tenta testar uma notificação sem nenhum token configurado, orientando onde preencher.

---

## 📌 Versão 4.3.1 — Correção Emergencial do Sistema de Login (Sintaxe JavaScript)
**Data:** 14/11/2026  
**Status:** Concluído e Homologado (100% dos testes E2E aprovados via Microsoft Edge Headless CDP)

### 1. Diagnóstico do Problema:
- Foi identificado que a tela de login não respondia ao envio de formulário com credenciais corretas (`admin` ou `moda`), impedindo o acesso.
- A causa raiz foi um erro de sintaxe JavaScript (`SyntaxError: Unexpected token ';'`) ocorrido durante a substituição em lote na função de renderização de clientes (`renderizarClientesTabela`), onde um bloco de interpolação de template string `${totalDevedor > 0 ? ...}` havia sido parcialmente truncado.
- Por conta dessa falha sintática, a engine do navegador abortava a execução de todo o bloco `<script>` principal da aplicação, impedindo o registro das funções de autenticação (`fazerLoginSubmit` e `autenticarCredenciais`).

### 2. Ações Corretivas & Testes:
- Restauração integral da interpolação e das colunas da tabela de clientes em `index.html`.
- Execução de testes automatizados E2E ponta a ponta via Microsoft Edge Headless via protocolo Chrome DevTools (CDP):
  - ✅ Carregamento inicial do script e runtime sem erros (`hasAutenticarCredenciais: true`, `hasFazerLoginSubmit: true`).
  - ✅ Autenticação do Administrador Master (`admin` / `123`), transição imediata para a tela de gerenciamento de lojas (`tela-master`).
  - ✅ Autenticação do Lojista (`moda` / `123`), carregamento e transição direta para a dashboard da loja ativa (`tela-dashboard`).
  - ✅ Validação de credenciais incorretas com feedback visual e bloqueio de acesso.
  - ✅ Validação de clique físico no botão de submissão do formulário na interface.

---

## 📌 Versão 4.3.0 — Sistema Automatizado de Notificações de Vendas no Telegram (Bot Central da Plataforma e Bot do Lojista)
**Data:** 14/11/2026  
**Status:** Concluído e Homologado (100% dos testes E2E aprovados via Microsoft Edge Headless CDP)

### 1. Visão Geral da Funcionalidade:
- Integração nativa e 100% automatizada com a **Telegram Bot API** (`sendMessage`), notificando instantaneamente o lojista sobre eventos vitais do negócio.
- **Arquitetura Híbrida & Bot Central:**
  - O Super Administrador configura o Bot Central da plataforma no painel Master (`masterTelegramBotUsername` e `masterTelegramBotToken`).
  - O lojista precisa apenas iniciar o bot no Telegram e informar o seu número de **Chat ID** (obtido de forma guiada pelo `@userinfobot`).
  - Lojistas avançados também contam com a opção de conectar seu próprio token de bot do BotFather.
- **Coexistência Total (Zero Regressão):**
  - O fluxo existente de envio manual de pedidos via WhatsApp pelo cliente final permanece 100% preservado e inalterado.
  - As notificações do Telegram rodam de forma assíncrona e não-bloqueante (`fire-and-forget` resiliente), sem qualquer travamento da interface ou do checkout do cliente.

### 2. Eventos Notificados:
- 🛍️ **Novos Pedidos na Loja Online (Vitrine):** Alerta instantâneo contendo ID do pedido, nome e WhatsApp do cliente, modalidade de entrega (Retirada ou Delivery com endereço), lista detalhada de itens/variações com subtotais, taxa de entrega, total do pedido e forma/condição de pagamento.
- ⚡ **Vendas Concluídas no Balcão (PDV):** Notificação imediata contendo ID da venda, identificação do cliente, condição de pagamento (À Vista ou parcelado), eventuais descontos concedidos, valor líquido final, saldo devedor lançado em contas a receber e lista de produtos vendidos.
- ⚠️ **Cancelamento e Estorno de Vendas:** Notificação de auditoria disparada sempre que uma venda ou pedido for cancelado pelo lojista, informando ID da venda, nome do cliente, valor estornado, confirmação de retorno dos produtos ao estoque e motivo registrado pelo operador.

### 3. Interface e Configuração para o Lojista (`tela-loja-online`):
- **Nova Seção "2.1 Notificações Automáticas no Telegram":**
  - Toggle inteligente para Ativar / Desativar notificações a qualquer momento.
  - Passo a passo rápido e intuitivo com link direto para abrir a conversa com o bot central (`t.me/<bot_username>`) e bot de descoberta de ID (`@userinfobot`).
  - Campo com máscara e validação para inserção do **Chat ID**.
  - **Granularidade de Eventos:** Checkboxes independentes para escolher quais eventos notificar (Novos Pedidos Online, Vendas no Balcão e Cancelamento de Vendas).
  - **Botão "Testar Notificação Agora":** Realiza um disparo imediato de teste com feedback visual detalhado via SweetAlert2 (indicando sucesso ou diagnóstico preciso, como bot não iniciado via `/start` ou token incorreto).
  - Acordeão expansível para configuração opcional de Bot Próprio.

### 4. Gestão Global para o Administrador Master (`tela-master`):
- **Card "Bot Central de Notificações Telegram da Plataforma":**
  - Configuração do `@username` e `Token HTTP` do Bot Central.
  - Persistência híbrida no banco e `localStorage` (`clara_master_telegram_bot_username`, `clara_master_telegram_bot_token`).
  - Propagação dinâmica para os links de ajuda das lojas gerenciadas.

### 5. Motor JavaScript e Banco de Dados (`TelegramNotifier` & `DatabaseAdapter`):
- Implementação do objeto `TelegramNotifier` com formatação rica em HTML com emojis, escape de caracteres especiais (`escapeHtml`), timestamp humanizado em horário de Brasília e despacho via `fetch` assíncrono.
- Script de migração PostgreSQL criado em `sql/telegram_notifications.sql` adicionando colunas `telegram_ativo`, `telegram_chat_id`, `telegram_notif_online`, `telegram_notif_pdv`, `telegram_notif_cancelamento` e `telegram_bot_token_custom` na tabela `configuracoes_loja`.
- Implementação de fallback defensivo em `DatabaseAdapter.salvarConfiguracoesLoja`: se o lojista salvar as configurações antes de executar o script SQL no Supabase, a aplicação trata graciosamente a ausência das colunas e preserva os dados no armazenamento local sem emitir erros impeditivos.

---

## 📌 Versão 4.2.0 — Histórico Completo de Vendas por Cliente e Atribuição de Pedidos Online a Clientes Cadastrados
**Data:** 14/11/2026  
**Status:** Concluído e Homologado (100% dos testes E2E aprovados via Microsoft Edge Headless CDP)

### 1. Histórico de Vendas Completo para Clientes Cadastrados (Aba Clientes):
- **Aprimoramento da Tabela de Clientes (`tela-clientes`):**
  - Adição de barra de busca instantânea (`buscaClientesTabela`) para filtrar por nome, WhatsApp ou endereço em tempo real.
  - Inclusão das colunas **Total em Compras** (exibindo o montante total gasto pelo cliente e quantidade de pedidos) e **Saldo Devedor** (com alerta visual em destaque para clientes com débitos pendentes).
  - Adição do botão **Histórico** (`abrirHistoricoCliente`) na linha de cada cliente cadastrado, exibindo o total de vendas realizadas como um contador visual.
- **Novo Modal Exclusivo de Histórico do Cliente (`modalHistoricoCliente`):**
  - **Identificação Visual:** Avatar dinâmico com iniciais do cliente, nome completo, link direto para WhatsApp, endereço e badge de identificador (`CLI-XXXX`).
  - **Cards de Resumo Financeiro Consolidado:**
    - *Total Vendido:* Soma total do histórico de compras do cliente;
    - *Total Recebido:* Pagamentos liquidados e confirmados;
    - *Saldo Devedor:* Valor total a receber deste cliente em vendas pendentes;
    - *Total de Compras:* Contagem total de pedidos e vendas ativas.
  - **Sistema Completo de Filtros Dinâmicos:**
    - *Filtro de Período:* Alternância instantânea entre **Hoje**, **Últimos 7 dias**, **Este Mês** e **Todas**;
    - *Filtro Financeiro:* Segmentação por **Todas**, **Quitadas**, **Deve (Pendentes)** e **Canceladas**.
  - **Tabela Detalhada de Vendas:**
    - ID da venda com link clicável (`#VND-...`) que abre diretamente o modal com todos os itens, cálculos e recibo (`modalDetalhesVenda`);
    - Data e hora da compra;
    - Origem da venda (Balcão, Loja Online, PDV);
    - Forma e condição de pagamento (ex.: *Pix*, *Cartão 3x*, *Fiado*);
    - Valor líquido da venda e saldo devedor individual;
    - Badges de status: `QUITADA` (verde), `DEVE` (vermelho) ou `CANCELADA` (riscado);
    - Botão "Itens" para visualização rápida.
  - **Rodapé Totalizador:** Total vendido no período/filtro selecionado, saldo devedor do período e contador de registros.
  - **Empilhamento Perfeito de Modais:** Abrir os detalhes de uma venda dentro do histórico sobrepõe suavemente o modal (`z-[60]` sobre `z-50`) e, ao fechar os detalhes, o usuário permanece exatamente onde estava no histórico do cliente.

### 2. Atribuição de Vendas Online e de Balcão a Clientes Cadastrados (Aba Vendas & Cobranças):
- **Identificação de Vínculo na Tabela de Cobrança (`renderizarCobranca`):**
  - Se a venda já pertencer a um cliente cadastrado: exibe o nome do cliente, badge verde `Cadastrado` com atalho de 1 clique para abrir o histórico de compras do cliente e botão para editar/trocar o vínculo.
  - Se a venda for de cliente avulso ou pedido online não cadastrado: exibe o botão em destaque `+ Atribuir Cliente` (`abrirModalAtribuirClienteVenda`).
- **Novo Modal de Atribuição de Venda (`modalAtribuirCliente`):**
  - Exibe resumo da venda selecionada (ID, Origem, Nome informado pelo comprador e Valor Total Líquido).
  - Campo de busca em tempo real para localizar clientes por nome ou telefone.
  - Seletor de clientes exibindo o nome, WhatsApp e total histórico já comprado por cada um na loja.
  - Botão de atalho rápido `+ Novo Cliente` (`novoClienteDeAtribuicao`): caso o comprador online ainda não esteja cadastrado, abre a tela de cadastro com nome, telefone e endereço já preenchidos automaticamente a partir do pedido. Ao salvar o novo cliente, ele é automaticamente selecionado na modal de atribuição.
  - Opção para atualizar o nome e telefone da venda para os dados oficiais do cadastro.
- **Persistência Completa e Sincronização Supabase:**
  - Criação do método `DatabaseAdapter.atribuirClienteVenda(lojaId, vendaId, clienteId, novoNome, novoTelefone)`, atualizando o campo `cliente_id` diretamente no PostgreSQL / Supabase e garantindo a integridade referencial com a tabela `clientes`.
  - Atualização automática dos totais e saldos do cliente em todas as telas abertas.

---

## 📌 Versão 4.1.1 — Correção de Rotas Master, Compressão de Fotos Mobile e Filtros Dinâmicos de Período no Dashboard
**Data:** 14/11/2026  
**Status:** Concluído e Homologado (100% dos cenários validados via Microsoft Edge Headless CDP)

### 1. Correção de Roteamento no Login de Administrador Master (Bug 1):
- **Causa Raiz Identificada:**
  - Existia uma chamada residual à função `atualizarInterfaceSeletorBanco()` dentro de `configurarInterfaceMaster()`. Como essa função pertencia ao seletor legado do Google Drive (removido na v4.1.0), sua chamada disparava um erro em tempo de execução (`ReferenceError: atualizarInterfaceSeletorBanco is not defined`), abortando o fluxo de navegação antes de executar `navegar('master')`.
  - Além disso, a tag `<section id="tela-dashboard">` estava sem a classe utilitária `hidden` no HTML inicial, fazendo com que o dashboard vazio permanecesse visível na tela.
- **Solução Implementada:**
  - Remoção da chamada legada em `configurarInterfaceMaster()`.
  - Adição da classe `hidden` à seção `#tela-dashboard` na estrutura base do HTML, garantindo que nenhuma tela de loja seja exibida antes da resolução do perfil autenticado.
  - Ao fazer login como `admin`, a aplicação agora redireciona com precisão e imediatamente para o Painel de Gerenciamento de Lojas (`tela-master`).

### 2. Retorno Instantâneo ao Painel Master após Impersonação de Loja (Bug 2):
- **Causa Raiz Identificada:**
  - Ao entrar em uma loja pelo Painel Master e posteriormente clicar no banner fixo *"Voltar ao Painel Master"*, a função `retornarAoPainelMaster()` invocava `configurarInterfaceMaster()`, esbarrando no mesmo erro de referência e interrompendo o ciclo de renderização. O usuário ficava preso visualmente na loja até clicar manualmente no menu lateral.
- **Solução Implementada:**
  - Com a eliminação da chamada fantasma, `retornarAoPainelMaster()` agora redefine o estado da sessão no `localStorage` (`tipo: 'master'`), restaura o menu de navegação e chama diretamente `navegar('master')`.
  - A transição do ambiente de loja de volta para a lista de lojas gerenciadas ocorre de forma instantânea em um único clique.

### 3. Compressão de Imagens no Cliente e Correção no Salvamento de Produtos via Mobile (Bug 3):
- **Causa Raiz Identificada:**
  - Câmeras de celulares modernos capturam imagens de altíssima resolução (12 a 60 MP, pesando de 4MB a mais de 20MB). Ao carregar a foto no formulário, a string Base64 bruta excedia facilmente de 8MB a 25MB.
  - O fluxo síncrono anterior tentava salvar o objeto completo no `localStorage` (`saveDB(db)`), o que estourava a cota de 5MB imposta pelos navegadores móveis (`DOMException: QuotaExceededError`), quebrando silenciosamente o manipulador do formulário e impedindo o salvamento.
- **Solução Implementada:**
  - Implementação da função `comprimirImagemBase64(file, maxDim = 1200, qualidade = 0.82)` utilizando HTML5 Canvas. Qualquer foto capturada pelo celular é redimensionada proporcionalmente (largura/altura máxima de 1200px) e convertida para JPEG otimizado (~120KB a 180KB), preservando a nitidez com redução de mais de 95% do peso.
  - Envolvimento do método `saveDB(db)` em bloco `try/catch` defensivo, com aviso de fallback sem interromper o salvamento.
  - Transformação da função `salvarProdutoSubmit` em fluxo assíncrono com feedback visual (`mostrarCarregandoBanco`), aguardando o upload para o bucket `arquivos-lojas` do Supabase Storage e substituindo a imagem temporária pela URL pública permanente do CDN antes de concluir o fechamento da modal.

### 4. Filtros Dinâmicos de Período no Gráfico de Vendas e Métricas da Vitrine Online (Bug 4):
- **Gráfico de Vendas (`#tela-dashboard`):**
  - Adição de barra de botões de filtro com os períodos: **Hoje**, **Últimos 7 Dias**, **Este Mês** e **Todas**.
  - Criação da função `setFiltroGraficoDashboard(periodo)` com agrupamento inteligente de dados:
    - *Hoje:* Agrupamento hora a hora (ex.: 08h, 09h, 10h...) do dia corrente;
    - *Últimos 7 Dias:* Agrupamento diário retroativo aos últimos 7 dias;
    - *Este Mês:* Agrupamento dia a dia do primeiro ao último dia do mês corrente;
    - *Todas:* Agrupamento mensal histórico consolidado.
  - Atualização in-place do Chart.js, cálculo dinâmico do total faturado no badge superior (`#totalVendas7DiasBadge`) e do título da seção (`#tituloGraficoVendas`).
- **Métricas da Vitrine Online (`#painelMetricasVitrine`):**
  - Adição de barra de filtros de período sincronizada com o padrão visual da aba Vendas e Cobranças (**Hoje**, **Últimos 7 Dias**, **Este Mês** e **Todas**).
  - Criação da função `setFiltroVitrineDashboard(periodo)` e `aplicarFiltroMetricasVitrine()`, armazenando o histórico em cache (`ESTADO.metricasVitrineCache`) e filtrando as agregações da view `vw_metricas_vitrine_resumo` por `data_referencia` no cliente em tempo real, sem novas requisições de rede.

### 5. Homologação Automatizada E2E via Edge Headless CDP:
- Script de teste ponta-a-ponta (`scratch/test_all_fixes.ps1`) executado com sucesso:
  - **Teste 1:** Login como `admin` exibe exclusivamente a `tela-master`.
  - **Teste 2:** Ao assumir uma loja e clicar em "Voltar ao Painel Master", o sistema retorna instantaneamente para a `tela-master`.
  - **Teste 3:** Simulação de upload e compressão de foto de celular em produto: canvas gerou imagem compacta de 9KB, salvou o produto e sincronizou URL com o Supabase CDN.
  - **Teste 4:** Alternância de filtros no gráfico e nas métricas da vitrine validada para todos os 4 períodos com atualização correta dos rótulos e somatórios.

---

## 📌 Versão 4.1.0 — Descontinuação do Google Drive, Migração Total de Mídias para Supabase Storage e Blindagem de Segurança para Código Aberto
**Data:** 14/11/2026  
**Status:** Concluído e Homologado (100% Supabase Puro, Mídias no Supabase Storage e Testes E2E Aprovados)

### 1. Descontinuação Completa do Google Drive como Banco de Dados e Armazenamento de Imagens:
- **Migração de 100% das Imagens para o Supabase Storage:**
  - Todas as fotos de produtos (10 itens) e logotipos de lojas anteriormente hospedados no Google Drive (`lh3.googleusercontent.com`) foram baixados, convertidos e transferidos diretamente para o bucket público `arquivos-lojas` do Supabase Storage.
  - Atualização dos registros nas tabelas `produtos` (`foto_url`) e `configuracoes_loja` (`logo_url`) no Supabase, garantindo URLs permanentes, alta velocidade de entrega CDN e eliminação total de links quebrados ou expirados do Google Drive.
- **Arquivamento e Limpeza de Dependências Legadas:**
  - O script backend `google_apps_script.js` e o guia `COMO_CONFIGURAR_GOOGLE_DRIVE.md` foram movidos para a pasta de arquivo `legado_google_drive/`.
  - Remoção de variáveis legadas do frontend: `URL_GOOGLE_SCRIPT_PADRAO`, `modoDrive` e `urlGoogleScript` do objeto `ESTADO`.
  - Remoção de todos os fallbacks `else { fetch(ESTADO.urlGoogleScript) }` da camada `DatabaseAdapter`. O sistema opera agora como uma aplicação 100% nativa em nuvem PostgreSQL / Supabase.
  - Eliminação de campos obsoletos de inserção de URL do Google Script na tela de configurações (`tela-config`) e no Painel Master.

### 2. Blindagem de Segurança para Abertura Pública do Repositório (Open Source):
- **Criação do Script de Blindagem PostgreSQL (`sql/security_hardening.sql`):**
  - **Proteção da Coluna de Senhas (`senha_hash`):** Revogação de acesso irrestrito na tabela `lojas` para o perfil `anon` (usuários não autenticados da API pública). Concessão de `SELECT` apenas para colunas públicas seguras (`id, nome_loja, login, nome_responsavel, whatsapp, status, created_at`), impedindo que a chave pública anônima do Supabase exponha as senhas ou hashes das lojas.
  - **Autenticação Segura via RPC:** Garantia de execução da procedure `autenticar_usuario` com `SECURITY DEFINER`, autenticando lojistas e administradores no backend sem vazar dados confidenciais.
  - **Políticas RLS e Storage:** Criação de regras de Row Level Security (RLS) para as tabelas `produtos`, `vendas`, `itens_venda` e políticas de leitura pública e upload controlado no bucket `arquivos-lojas`.
- **Higienização do Frontend:**
  - Remoção de senhas estáticas preenchidas em `DADOS_INICIAIS` no arquivo `index.html`.
  - Inicialização automática com getter do cliente Supabase (`DatabaseAdapter.init()`) em tempo de execução.

### 3. Homologação Automatizada E2E via Edge Headless CDP:
- **Cenário 1 — Login do Lojista (`moda` / `123`):**
  - Autenticação validada via RPC `autenticar_usuario` no Supabase.
  - Carregamento de 9 produtos com 100% das fotos e logotipo apontando para URLs do Supabase Storage (`https://bqdudddefgzzqppzxrbw.supabase.co/storage/v1/object/public/arquivos-lojas/...`).
- **Cenário 2 — Login do Super Admin Master (`admin` / `123`):**
  - Acesso ao Painel Master com sincronização de lojas diretamente do Supabase.
- **Cenário 3 — Vitrine Pública do Cliente (`?loja=LOJA-1`):**
  - Carregamento instantâneo do catálogo digital público e imagens servidas pelo Supabase Storage sem qualquer dependência externa do Google Drive.

---

## 📌 Versão 4.0.2 — Eliminação do Ciclo Infinito de Renderização e Estabilização In-Place do Gráfico de Vendas
**Data:** 11/11/2026  
**Status:** Concluído e Homologado (Testes de Estabilidade e Atualização In-Place 100% Aprovados via Microsoft Edge Headless CDP)

### 1. Eliminação do Ciclo Infinito de Sincronização Assíncrona no Dashboard e Pedidos:
- **Causa Raiz Identificada:**
  - Na função de navegação SPA `renderizarTela(telaId)`, as cláusulas `case 'dashboard'` e `case 'pedidos'` continham chamadas assíncronas em segundo plano: `sincronizarDadosLojaAtivaDrive(true).then(...)`.
  - Ao resolver a busca no banco, a função `sincronizarDadosLojaAtivaDrive` invocava `renderizarTela(telaVisivel)` para atualizar o DOM com os dados mais recentes.
  - Como a tela visível continuava sendo o Dashboard (ou Pedidos), essa chamada disparava recursivamente `sincronizarDadosLojaAtivaDrive` a cada segundo, criando uma fila ininterrupta de requisições de rede e renderizações em loop contínuo.
- **Solução Implementada:**
  - Remoção dos disparos assíncronos recursivos dentro do `switch` de `renderizarTela`. A navegação entre abas agora apenas renderiza a interface com base nos dados locais em memória de forma instantânea.
  - Implementação de trava de concorrência (*mutex/lock*) `_sincronizandoLojaAtiva` na função `sincronizarDadosLojaAtivaDrive`, impedindo requisições simultâneas ou sobrepostas.
  - Sincronização de rede reservada para momentos intencionais: login, clique no botão "Sincronizar", troca de ambiente pelo Painel Master e após mutações de dados (vendas, produtos, despesas).

### 2. Otimização e Estabilização In-Place do Gráfico de Vendas dos Últimos 7 Dias (Chart.js):
- **Causa Raiz Identificada:**
  - A cada chamada da função `renderizarGraficoVendas7Dias`, o sistema destruía completamente a instância existente (`ESTADO.chartInstance.destroy()`) e criava um novo `new Chart(...)`.
  - Esse processo reiniciava a animação do canvas do zero, gerando um efeito visual de tremor constante (*flickering*) na tela a cada atualização.
- **Solução Implementada:**
  - Gerenciamento inteligente de ciclo de vida da instância do Chart.js:
    1. Se a instância já existe para a mesma loja ativa, os novos rótulos (`labels`) e valores calculados (`dataValores`) são comparados com os atuais.
    2. Se os dados forem idênticos (sem novas vendas), a função retorna imediatamente sem tocar no canvas (`return`), com zero consumo de CPU ou repintura desnecessária.
    3. Se houver novas vendas ou alterações, a instância existente é reaproveitada: os dados do dataset são atualizados e o gráfico executa um `.update('none')` suave, sem destruir o canvas e sem animações de entrada tremulantes.
  - Limpeza e liberação apropriada de memória da instância do gráfico em `fazerLogout()`.

### 3. Homologação Automatizada via Edge Headless CDP:
- **Teste de Estabilidade e Ciclo de Renderização:**
  - Monitoramento de contadores durante 5 segundos de inatividade: confirmada a estabilidade com exatamente 0 chamadas adicionais de sync ou recriação do gráfico (`chartRecreatedCount = 1`).
  - Navegação entre telas (Dashboard -> Pedidos -> Dashboard): a instância do gráfico permaneceu intacta e sem recriação (`chartRecreatedCount = 1`).
- **Teste de Atualização In-Place:**
  - Ao registrar uma nova venda em tempo real, o gráfico atualizou seu dataset de R$ 210,00 para R$ 460,00 in-place sem recriar o canvas (`chartRecreatedCount = 1`).

---

## 📌 Versão 4.0.1 — Correção no Registro de Pedidos Online da Vitrine e Filtro de Telemetria de Produtos na Sacola
**Data:** 11/11/2026  
**Status:** Concluído e Homologado (100% dos testes E2E aprovados via Microsoft Edge Headless)

### 1. Correção no Registro de Pedidos Online da Vitrine (`concluirPedidoOnlineWhatsApp`):
- **Causa Raiz Identificada:**
  - O status inicial de pedidos da vitrine era `'Aguardando Aprovação'`. O PostgreSQL aplicava uma restrição de verificação (`vendas_status_pedido_check`), exigindo que o valor fosse um dos seguintes: `'Pendente'`, `'Aprovado'`, `'Cancelada'`, `'Entregue'` ou `'Orçamento'`.
  - Como o status não estava mapeado para `'Pendente'`, o PostgreSQL rejeitava a inserção do pedido gerando erro 400 (`check constraint violation`).
  - O envio ocorria de forma assíncrona não aguardada (`.catch()`), permitindo o redirecionamento ao WhatsApp e o registro da telemetria, enquanto a venda em si falhava silenciosamente.
- **Solução Implementada:**
  - Mapeamento bidirecional rigoroso em `DatabaseAdapter.registrarVenda` e `DatabaseAdapter.getDadosLoja`:
    - No Supabase: armazena como `'Pendente'`.
    - No Painel do Lojista: exibe visualmente como `⏳ Aguardando Aprovação`.
  - Inserção de pedidos online em `vendas` e `itens_venda` sem decremento prematuro de estoque. O estoque físico só é baixado quando o lojista clica em **"Aprovar e Baixar"** na aba de Pedidos.
  - Função `concluirPedidoOnlineWhatsApp` convertida para assíncrona (`async/await`), garantindo a confirmação e gravação no banco antes de qualquer redirecionamento ao WhatsApp.
  - Inclusão do botão **"Atualizar Pedidos"** no cabeçalho da tela de Pedidos e sincronização automática em segundo plano ao navegar para a aba.

### 2. Eliminação de "Produto sem nome" no Ranking de Mais Desejados na Sacola:
- **Causa Raiz Identificada:**
  - O evento de telemetria `checkout_concluido_whatsapp` registra a conclusão do pedido no nível de sessão (sem `produto_id`), com valor nulo.
  - A view `vw_top_produtos_sacola` agrupava eventos incluindo linhas com `produto_id` nulo, computando o checkout como um item da sacola chamado `"Produto sem nome"`.
- **Solução Implementada:**
  - Filtro em `DatabaseAdapter.obterTopProdutosSacola` utilizando `.not('produto_id', 'is', null)` na API do Supabase e `.filter(p => p.produto_id && p.produto_nome)` no JavaScript.
  - Ajuste na renderização de `carregarMetricasVitrineDashboard` para descartar qualquer registro anônimo ou sem identificador de produto.
  - Homologado teste E2E garantindo que apenas produtos reais aparecem no ranking de intenção de compra.

---

## 📌 Versão 4.0.0 — Migração Completa para PostgreSQL / Supabase Multi-Tenant com Telemetria e Transações ACID
**Data:** 11/11/2026  
**Status:** Concluído e Homologado (Migração ETL 100%, Integridade Referencial, Transações Atômicas e Telemetria em Tempo Real)

### 1. Migração de Banco de Dados para Supabase (PostgreSQL Relacional Multi-Tenant):
- **Modelagem Relacional de Alta Performance:**
  - Criação das tabelas centrais: `public.lojas`, `public.configuracoes_loja`, `public.clientes`, `public.produtos`, `public.vendas`, `public.itens_venda`, `public.despesas`, `public.sugestoes` e `public.metricas_eventos`.
  - Chaves estrangeiras com integridade referencial (`ON DELETE CASCADE` para sub-itens e configurações, `ON DELETE SET NULL` para clientes).
  - Triggers automáticos de auditoria temporal (`atualizar_coluna_updated_at`) em todas as entidades.
- **Transações ACID Atômicas via Stored Procedures (Postgres RPC):**
  - `autenticar_usuario(p_login, p_senha, p_senha_hash)`: Autenticação segura sem expor hashes completos aos clientes.
  - `registrar_venda_completa(p_venda, p_itens)`: Inserção simultânea de venda e itens com decremento atômico de estoque (`estoque_atual = estoque_atual - it.quantidade`), garantindo consistência contra condições de corrida (*race conditions*).
  - `cancelar_venda_completa(p_loja_id, p_venda_id, p_motivo)`: Atualização atômica do status para 'Cancelada' e estorno automático de todos os itens de volta ao estoque físico dos produtos.
- **Storage de Alta Velocidade para Arquivos e Mídias:**
  - Bucket público `arquivos-lojas` configurado com políticas de acesso (SELECT público e uploads de imagens e logotipos).
  - Função no adaptador frontend para converter Base64 em `Blob` e realizar upload direto para o Supabase Storage.

### 2. Camada de Abstração Frontend (Adapter Pattern — `DatabaseAdapter`):
- **Compatibilidade Retroativa & Chaveador de Banco em Tempo Real:**
  - Criado o objeto `DatabaseAdapter` que encapsula 100% das chamadas a banco (autenticação, consultas, criação, edição, deleção e sincronização).
  - Novo card no **Painel Master** permitindo alternar instantaneamente entre **Supabase (Recomendado)** e **Google Drive (Planilhas)** com um clique.
  - Preservação total de funcionamento no modo offline ou legado sem quebras de compatibilidade.

### 3. Extração, Transformação e Carga (ETL) Concluída com Sucesso:
- Carga de dados legados das planilhas Google Sheets para o Supabase:
  - 2 Lojas migradas (`LOJA-1` - Mary Variedades e `LOJA-706299` - Brechó da Mary);
  - 2 Configurações de vitrine e parcelamento migradas;
  - Clientes, produtos e histórico completo de vendas e despesas normalizados.

### 4. Telemetria da Vitrine Online & Métricas em Tempo Real no Dashboard:
- **Rastreamento de Funil de Vendas na Vitrine Online:**
  - Eventos capturados automaticamente: `loja_aberta`, `produto_visualizado`, `produto_adicionado_sacola` e `checkout_concluido_whatsapp`.
- **Views Analíticas Criadas no Postgres:**
  - `vw_metricas_vitrine_resumo`: Agrega visitantes únicos diários, visualizações, adições à sacola e taxa de conversão percentual.
  - `vw_top_produtos_sacola`: Ranking dos produtos com maior intenção de compra pelos clientes.
- **Painel Analítico no Dashboard do Lojista:**
  - 4 cards métricos: Visitantes Únicos, Produtos Vistos, Itens na Sacola e Conversão no WhatsApp.
  - Funil visual de conversão com barras de progresso dinâmicas.
  - Lista de *Mais Desejados na Sacola* com contador de adições e conversão.

---

## 📌 Versão 3.8.2 — Discriminação Completa de Preço, Descontos e Preço Final em Vendas e Bloqueio de Estoque no Caixa
**Data:** 10/11/2026  
**Status:** Concluído e Homologado (100% dos 45 testes automatizados aprovados)

### 1. Seção de Vendas, Caixa (PDV), Recibo e Informações da Venda:
- **Detalhamento Transparente de Preços:**
  - Em todas as etapas da venda, cada item agora exibe de forma explícita:
    1. **Preço:** Valor de tabela do produto;
    2. **Desconto Concedido:** Valor do desconto aplicado (inclusive em itens promocionais ou desconto extra no caixa);
    3. **Preço Final:** Valor efetivo unitário e total da linha (`Subtotal - Descontos`).
- **Carrinho do Caixa / PDV (`#itensCarrinho`):**
  - Cada item exibe visualmente o Preço (com traço se houver desconto), o desconto em destaque verde (`Desc: -R$ ...`), o Preço Final unitário e o subtotal calculado.
  - Painel de totais do PDV com: *Subtotal*, *Desconto Promoções*, *Desconto Extra*, *Total Descontos* e *Preço Final (Subtotal - Descontos)*.
- **Tabela da Seção de Vendas & Cobrança (`tabelaCobranca`):**
  - Na coluna **Total**, vendas com desconto exibem o Subtotal riscado, o Desconto Total aplicado e o Preço Final em destaque.
- **Informações da Venda (`#modalDetalhesVenda`):**
  - Tabela de itens atualizada com colunas dedicadas: `Produto`, `Qtd`, `Preço`, `Desconto`, `Preço Final` e `Subtotal`.
  - Resumo financeiro detalhado apresentando o *Subtotal*, a discriminação de *Desconto em Promoções*, *Desconto Extra na Venda*, *Desconto Total Concedido* e *Preço Final (Total Líquido)*.
- **Recibo e Comprovante de Impressão (`imprimirComprovanteVenda()`):**
  - Tabela do comprovante formatada com colunas: `Produto`, `Qtd`, `Preço`, `Desconto`, `Preço Final` e `Subtotal`.
  - Seção de totais com *Subtotal*, *Desconto Total* e *Preço Final (Total Líquido)*.

### 2. Seção do Caixa (PDV) e Vitrine — Bloqueio Rigoroso de Itens Sem Estoque:
- **Travas no PDV / Caixa:**
  - Produtos físicos com `estoqueAtual <= 0` são exibidos com badge `SEM ESTOQUE`, opacidade reduzida e botão `✕`.
  - O clique no produto bloqueia a adição ao carrinho e dispara alerta SweetAlert: *"O item está esgotado no estoque e não pode ser adicionado à venda."*
  - Ao atingir o limite de estoque existente no carrinho, novas tentativas de adição ou incrementos no botão `+` são travadas com aviso informando a quantidade máxima disponível.
  - Serviços (`tipoItem === 'servico'`) permanecem sem trava de estoque físico, com identificação visual `✂️ Serviço`.
- **Vitrine Online do Cliente:**
  - Bloqueio preventivo na função `adicionarSacolaVitrine()` para itens sem estoque físico.

### 3. Backend Google Apps Script (`google_apps_script.js`):
- Atualização da aba `Itens_Venda` para persistir e recuperar `Preco_Cheio_Unitario` e `Desconto_Unitario`.
- Compatibilidade retroativa com planilhas antigas via provisionamento automático das novas colunas.

---

## 📌 Versão 3.8.1 — Correção de Layout Mobile em Modais, Homologação do Ícone de Olho Master e Tela de Carregamento de Banco de Dados
**Data:** 09/11/2026  
**Status:** Concluído e Homologado (100% dos 28 testes automatizados aprovados)

### 1. Correção de Exibição de Modais no Mobile (Topo Cortado)
- **Causa Raiz Identificada:** 
  - Os modais utilizavam `flex items-center justify-center overflow-y-auto`. Em telas verticais com altura inferior à altura total do formulário (smartphones), `align-items: center` centralizava o conteúdo empurrando o topo para coordenadas de rolagem negativas (`y < 0`), impossíveis de alcançar via scroll no navegador.
- **Solução Implementada em Todos os 13 Modais:**
  - Substituição nos containers para `items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto`.
  - Inclusão de `my-auto` nos cartões modais. Em telas grandes, o modal permanece perfeitamente centralizado; em smartphones, o topo alinha-se a `y >= 0` com padding seguro, tornando títulos, botões de fechar, fotos e campos superiores 100% visíveis e roláveis.
  - Modais corrigidos: `#modalProduto`, `#modalCheckoutCliente` (Sacola/Finalização), `#modalDetalhesProdutoVitrine`, `#modalCliente`, `#modalDespesa`, `#modalVerLojaMaster`, `#modalEditarLojaMaster`, `#modalCriarLojaMaster`, `#modalBaixaPagamento`, `#modalDetalhesVenda`, `#modalPoliticaPrivacidade`, `#modalScanner` e `#modalLogin`.

### 2. Painel Master — Correção e Homologação do Ícone de Olho (`#modalVerLojaMaster`)
- **Resolução de Incompatibilidade de Tipos & Formatação:**
  - O clique no ícone de olho no gerenciador master por vezes não abria o modal caso o ID da loja fosse numérico ou se o campo `whatsapp` viesse como número direto da planilha do Google Sheets (o que causava exceção silenciosa ao chamar `.trim()`).
  - Tratamento universal com `String(...)` e sanitização com `encodeURIComponent`/`decodeURIComponent` no disparo de eventos da tabela.
  - Adicionado bloco defensivo `try...catch` com mensagens de alerta claras caso ocorra qualquer inconsistência.
  - Função testada e aprovada para exibição de métricas da loja, dados do responsável, alternância de visibilidade da senha (olho aberto/fechado) e links diretos para planilha e WhatsApp.

### 3. Tela e Overlay de Carregamento de Banco de Dados (`#overlayCarregandoBanco`)
- **Novo Componente de Feedback Visual em Tempo Real:**
  - Adicionado overlay elegante com backdrop blur, ícone animado de banco de dados (`database`) e indicador de progresso pulsante.
  - Textos dinâmicos (`#txtCarregandoTitulo` e `#txtCarregandoSubtitulo`) para informar exatamente a operação em andamento (ex: *"Sincronizando Lojas..."*, *"Carregando Catálogo da Loja..."*, *"Testando Conexão com Google Drive..."*).
  - Funções globais utilitárias `mostrarCarregandoBanco(titulo, subtitulo)` e `esconderCarregandoBanco()` com trava de segurança de timeout.
  - Integrado ao login, sincronização manual, conexão com Google Apps Script e carregamento da vitrine pública.

---

## 📌 Versão 3.8.0 — Plataforma Nichada (Perfumaria, Brechó e Salões), Alertas de Validade, Cobrança Humanizada no WhatsApp, Módulo de Despesas e Ficha da Cliente
**Data:** 09/11/2026  
**Status:** Concluído e Homologado (100% dos 35 testes automatizados aprovados)

### 1. Painel Master — Busca Dinâmica e Filtro de Status
- **Pesquisa em Tempo Real e Filtro:**
  - Adicionado campo de busca instantânea (`#buscaLojaMaster`) por nome, ID ou responsável.
  - Adicionado seletor de filtro por status (`#filtroStatusMaster`): Todas, Apenas Ativas ou Apenas Bloqueadas.
  - Implementada função `filtrarLojasMaster()` com contador dinâmico e feedback imediato de resultados.

### 2. Módulo de Produtos Nichado (Perfumaria, Brechó & Salão de Beleza)
- **Tipo de Item:**
  - Alternância entre **Produto Físico** e **Serviço** (`prodTipoItem`).
  - Para Serviços (salão de beleza/estética): campos de estoque, custo de aquisição e medidas são ocultados/adaptados dinamicamente; badges de identificação `✂️ Serviço` nos cards e tabelas.
- **Perfumaria & Cosméticos:**
  - Campo de **Data de Validade do Lote** (`prodDataValidade`).
  - Banners e alertas visuais automáticos:
    - No Dashboard do Lojista (`#alertaValidadeDashboard`): contagem e listagem rápida de produtos vencidos ou a vencer em 30 dias.
    - No Estoque (`#alertaValidadeProdutosContainer`): card de destaque com contagem crítica e badges de aviso (`⚠️ Vencendo em Xd` e `🔴 Vencido`).
- **Brechó & Moda Circular:**
  - **Condição da Peça** (`prodCondicaoPeca`): Novo com etiqueta, Seminovo impecável, Usado bom estado, Vintage/Raridade ou Customizado/Upcycling.
  - **Medidas Reais da Peça (cm)** (`prodMedidas`): Busto, cintura, quadril, comprimento, ombro etc.
  - **Peça Única** (`prodPecaUnica`): Checkbox que fixa o estoque em 1 unidade e exibe badge exclusiva `💎 Peça Única` na vitrine e nos detalhes do item.
- **Consignação com Repasse Automático:**
  - Cadastro de **Nome da Consignante** (`prodConsignanteNome`) e **% de Repasse/Comissão** (`prodConsignanteComissao`).
  - Suporte à conferência e controle de produtos de terceiros em loja.

### 3. Vendas & Cobrança Humanizada no WhatsApp
- **Data de Vencimento de Parcela:**
  - Campo `#pdvDataVencimento` no PDV e gravação de prazo na venda (default de 30 dias para crediário/a prazo).
- **Módulo de Contas a Receber com Alertas:**
  - Badges dinâmicas de vencimento: `⚠️ Venceu há X dias`, `⏰ Vence HOJE!` ou `📅 Vence em X dias`.
- **Botão "Cobrar no WhatsApp" (`cobrarVendaWhatsApp`):**
  - Geração de mensagem humanizada e cordial, contendo:
    - Saudação personalizada com o nome da cliente;
    - Identificação da loja e do número do pedido;
    - Detalhamento do valor original, valor pago e saldo pendente em aberto;
    - Data do vencimento;
    - Chave Pix configurada da loja (com instruções para envio de comprovante);
    - Link direto para a API do WhatsApp web/mobile (`api.whatsapp.com/send`).

### 4. Módulo Completo de Despesas & Apuração do Lucro Líquido Real
- **Nova Tela de Despesas (`#tela-despesas`):**
  - Acesso no menu lateral e mobile para gestão financeira completa da loja.
  - **Cards de Métricas:** Total de Despesas do Mês, Faturamento Líquido, Lucro Bruto (Faturamento - CMV) e Lucro Líquido Real (Lucro Bruto - Despesas Operacionais).
  - **Tabela de Lançamentos:** Filtros por categoria (Aluguel, Energia/Água, Internet/Telefone, Embalagens, Marketing/Anúncios, Salários/Comissões, Outros) e seleção do mês/ano de apuração.
  - **Modal de Lançamento (`#modalDespesa`):** Cadastro de despesas com descrição, categoria, valor, data e observações.
  - Ação de exclusão rápida com confirmação de segurança.
- **Dashboard Integrado:**
  - O Dashboard inicial do lojista agora exibe 5 cartões vitais: *Vendas Hoje*, *Vendas no Mês*, *A Receber*, *Despesas do Mês* e *Lucro Líquido Real*.

### 5. Clientes — Ficha de Preferências e Histórico
- **Ficha Personalizada (`#cliHistoricoPreferencias`):**
  - Inclusão de campo de histórico e preferências no cadastro/edição de clientes (`#modalCliente`).
  - Ideal para perfumaria (famílias olfativas preferidas, tom de maquiagem, tipo de pele/cabelo), brechó (tamanhos de roupa/calçado, marcas favoritas, estilo) e salão (histórico de química, preferências de corte e atendimento).
  - Exibição de badge com resumo direto na tabela de clientes.

### 6. Backend Google Apps Script (`google_apps_script.js`) & Banco de Dados
- **Schema Dedicado Atualizado (`setupInicialPlanilhaDedicadaLoja`):**
  - Aba `Produtos`: Adicionadas colunas `Tipo_Item`, `Data_Validade`, `Condicao_Peca`, `Medidas`, `Peca_Unica`, `Consignante_Nome` e `Consignante_Comissao`.
  - Aba `Vendas`: Adicionadas colunas `Data_Vencimento` e `Profissional`.
  - Nova aba `Despesas`: Colunas `ID`, `Descricao`, `Categoria`, `Valor`, `Data` e `Observacoes`.
  - Aba `Clientes`: Suporte à coluna `Historico_Preferencias`.
- **Endpoints de API (`doPost`):**
  - Novos cases: `'salvarDespesa'` e `'excluirDespesa'`.
  - Atualizadas as funções `salvarProdutoLoja`, `registrarVendaLoja`, `obterDadosLojaPublica`, `obterDadosPainelLojista` e `salvarClienteLoja`.
  - Retrocompatibilidade total garantida para lojas pré-existentes.

---

## 📌 Versão 3.7.0 — Visualização Detalhada e Edição Completa de Lojas no Painel Master
**Data:** 09/11/2026  
**Status:** Concluído e Homologado  

### 1. Visualização Detalhada da Loja (`#modalVerLojaMaster`):
- **Painel de Informações Rápidas:**
  - Adicionado botão interativo de visualização (ícone de olho) na tabela de lojas e clique direto no nome da loja.
  - Exibe avatar com a cor tema da loja, nome oficial, ID e badge de status (*Ativa* / *Bloqueada*).
  - Resumo de métricas em tempo real: faturamento total líquido acumulado, valor pendente em haver (contas a receber) e contagem de produtos vs. total de vendas.
  - Dados de acesso: Nome do responsável, login e senha com recurso de alternar visibilidade (revelar/ocultar senha com ícone de olho).
  - Ação rápida de WhatsApp: Botão com link direto para iniciar conversa com o lojista no WhatsApp web/mobile.
  - Links técnicos e públicos: Link direto para abrir a planilha dedicada no Google Sheets e URL formatada da vitrine pública com botão de copiar link e botão para abrir a loja online.

### 2. Edição de Informações da Loja (`#modalEditarLojaMaster`):
- **Modal de Edição pelo Administrador Master:**
  - Botão de edição (ícone de lápis) na tabela de lojas e atalho direto dentro da visualização da loja.
  - Permite alterar: **Nome da Loja**, **Nome do Responsável**, **Senha de Acesso**, **WhatsApp** e **Status (Ativa/Bloqueada)**.
  - Login mantido bloqueado para edição com aviso explicativo, protegendo a integridade das referências do banco de dados.
- **Sincronização Bidirecional (Local e Nuvem):**
  - Ao salvar, atualiza imediatamente os dados no estado local (`db.lojas`) e na interface ativa.
  - Dispara requisição `POST` com `acao: 'atualizarLojaMaster'` para o Google Apps Script, atualizando a linha da loja na planilha Master (`Lojas_Usuarios`) e, caso a loja possua planilha dedicada, sincroniza também na aba `Configuracoes` da loja.

---

## 📌 Versão 3.6.0 — Faixas Editáveis, Trava À Vista em Promoções, Descrição e Visualização Detalhada do Produto
**Data:** 08/11/2026  
**Status:** Concluído e Homologado  

### 1. Modelo 2 de Parcelamento: Tabela de Faixas Fixas Totalmente Editável
- **Editor Dinâmico no Painel de Configurações da Loja:**
  - Substituído o painel estático anterior por um editor interativo (`#containerEditorFaixas`).
  - O lojista pode configurar faixas com valor limite (ex: até R$ 100, até R$ 300, etc.) e selecionar de 1x (à vista) até 12x para cada faixa.
  - Inclusão dos botões `"Adicionar Faixa"` e `"Remover Faixa"` para total flexibilidade na criação e exclusão de regras de crédito.
  - Suporte a faixas com valor `0` (sem limite superior), cobrindo compras acima das faixas estipuladas.
- **Sincronização & Persistência:**
  - As faixas são gravadas no estado local e enviadas como JSON (`Tabela_Faixas_JSON`) à aba `Configuracoes` da planilha do Google Drive.
  - No checkout da Loja Online (`atualizarParcelasCondicionaisCheckout`), o cálculo de parcelas liberadas passa a respeitar exatamente as faixas personalizadas da loja ativa.

### 2. Trava de Pagamento Somente À Vista para Itens em Promoção:
- **Opção no Cadastro/Edição de Produtos:**
  - Adicionado o checkbox `⚡ Trava: Aceitar SOMENTE pagamento à vista` dentro da caixa de ofertas/promoções (`#boxPrecoPromocional`).
- **Validação Automática no Checkout da Vitrine:**
  - Se o carrinho contiver qualquer item em promoção com a trava ativa, o sistema bloqueia as opções de parcelamento superior a 1x, liberando unicamente pagamento à vista.
  - Exibição de aviso explicativo (`#checkoutAvisoTravaAVista`) alertando o cliente com clareza.
- **Badge Visual na Vitrine:**
  - Inserida a badge `⚡ À Vista` nos cards de produtos em promoção e no modal de detalhes.
- **Persistência Retrocompatível:**
  - Salvo na coluna 18 (`Somente_A_Vista`) da aba `Produtos` da planilha dedicada da loja no Google Drive.

### 3. Descrição Detalhada do Item no Cadastro de Produtos:
- **Campo de Texto Multilinha (`#prodDescricao`):**
  - Adicionado campo `<textarea>` no formulário de produtos para inserção de detalhes de tecido, composição, caimento, tamanhos, especificações técnicas ou cuidados.
  - Integrado ao fluxo de `abrirModalProduto`, `editarProduto` e `salvarProdutoSubmit`.
- **Persistência na Planilha:**
  - Salvo na coluna 17 (`Descricao`) da aba `Produtos` com compatibilidade retroativa para planilhas criadas anteriormente.

### 4. Visualização Detalhada do Produto na Loja Online (Modal de Detalhes):
- **Novo Modal Interativo (`#modalDetalhesProdutoVitrine`):**
  - Ao clicar na foto ou título do produto em qualquer seção da vitrine (Destaques ou Catálogo Geral), abre-se a tela de detalhes com animação suave e design responsivo (mobile e desktop).
  - **Componentes do Modal:**
    - Foto em alta resolução expandida com tratamento para produtos sem imagem.
    - Badges dinâmicas de Oferta (`🔥 -X% OFF`), Destaque (`⭐ Destaque`) e Trava (`⚡ Somente À Vista`).
    - Categoria, Variação e Status de Estoque com indicador visual (`✅ Em estoque (X un)` ou `❌ Esgotado`).
    - Preço promocional em destaque com preço original riscado e economia calculada.
    - Simulação estimada de parcelamento conforme as regras da loja ou aviso de trava exclusiva à vista.
    - Área de texto para descrição detalhada formatada com quebra de linhas.
    - Seletor de quantidade (`-`, input numérico, `+`) com trava automática no limite de estoque disponível.
    - Botão `"Adicionar à Sacola"` com feedback imediato via toast e atualização do contador da barra flutuante.
- **Manutenção da Compra Rápida:**
  - O botão `+` rápido no card da vitrine segue permitindo adicionar itens com um clique sem necessidade de abrir os detalhes (`event.stopPropagation()`).

---

## 📌 Versão 3.5.0 — Edição de Clientes, Detalhamento de Vendas & Otimização da Vitrine Online
**Data:** 08/11/2026  
**Status:** Concluído e Homologado  

### 1. Edição Completa de Clientes na Aba de Clientes:
- **Novo Botão e Fluxo de Edição:**
  - Adicionado o botão `Editar` em cada linha da tabela de clientes (`renderizarClientes`).
  - Ao clicar, o modal é aberto em modo de edição com o título `"Editar Cliente"`, preenchendo automaticamente o ID, Nome Completo, WhatsApp/Telefone e Endereço.
- **Persistência Inteligente (Local & Nuvem):**
  - A função `salvarClienteSubmit` agora detecta a presença do `cliId`: se for uma edição, atualiza os dados do cliente existente sem duplicá-lo no array local.
  - Sincronização automática com a aba `Clientes` da planilha do Google Drive via backend (`salvarClienteLoja`), mantendo histórico e dados cadastrais alinhados.
  - Atualização automática dos seletores de cliente no PDV (`renderizarPdv`).

### 2. Visualização Completa de Detalhes da Venda e Contas a Receber:
- **Modal de Detalhes da Venda (`#modalDetalhesVenda`):**
  - Adicionado botão interativo `Itens` com ícone de visualização em cada linha das tabelas de **Vendas & Cobrança** e **Pedidos**.
  - O código/ID da venda (`#VND-...` ou `#PED-ON-...`) também se tornou um link direto clicável para abrir os detalhes.
  - **Informações Apresentadas no Modal:**
    - Identificação completa da venda com badge de status financeiro (`DEVE`, `QUITADO`, `CANCELADA`) e data/hora.
    - Dados do cliente (nome, telefone/WhatsApp e endereço).
    - Origem (Balcão ou Loja Online), modalidade de entrega (Retirada ou Delivery) e condição de pagamento.
    - **Grade de Itens Vendidos:** Tabela com nome de cada produto, variação, quantidade comprada, valor unitário e subtotal.
    - **Resumo Financeiro:** Subtotal bruto, descontos concedidos, taxa de entrega, total líquido, valor já pago e saldo devedor pendente.
    - Auditoria de cancelamento destacada caso a venda tenha sido cancelada (com motivo e data).
- **Recursos Adicionais:**
  - Botão `"Receber Pagamento"` diretamente no modal caso a venda possua saldo a receber.
  - Botão `"Imprimir / Recibo"` com layout térmico/fiscal limpo pronto para impressão ou envio ao cliente via WhatsApp.

### 3. Ocultação Dinâmica de Ofertas e Promoções na Loja Online:
- **Melhoria de Navegação na Vitrine:**
  - Na tela pública da Loja Online, a seção de *"🔥 Ofertas & Promoções da Semana"* agora é **automaticamente ocultada** sempre que o cliente:
    1. Digitar qualquer termo no campo de pesquisa (`#buscaVitrine`);
    2. Clicar em qualquer categoria de produtos diferente de `"Todas"`.
  - Ao limpar a pesquisa e retornar à categoria `"Todas"`, a seção de ofertas volta a ser exibida automaticamente caso a loja possua itens em promoção ou destaque cadastrados.

---

## 📌 Versão 3.4.2 — Reconciliação do Ciclo de Vida de Pedidos Quitados & Correção do Dashboard
**Data:** 07/11/2026  
**Status:** Concluído e Homologado  

### 1. Diagnóstico da Causa Raiz:
- **Origem do Problema:**
  - Quando um pedido era realizado na Loja Online (`tipo: 'PEDIDO_ONLINE'`), ele nascia com status `status: 'Aguardando Aprovação'` e `statusFinanceiro: 'Pendente'`.
  - Posteriormente, ao receber o pagamento na aba **Vendas & Cobrança** (`confirmarBaixaPagamento`), o sistema alterava `statusFinanceiro` para `'Pago'` e zerava o saldo devedor.
  - Contudo, `v.status` permanecia inalterado como `'Aguardando Aprovação'`.
  - No filtro de vendas válidas do Dashboard (`renderizarDashboard`), a condição era `isVendaValida = (v) => v.status === 'Finalizado' || (v.status !== 'Cancelada' && v.status !== 'Aguardando Aprovação' && v.status !== 'Orçamento')`. Como `v.status` continuava como `'Aguardando Aprovação'`, a condição retornava `false`.
  - Em decorrência disso, os pedidos quitados eram **100% descartados** das métricas de Vendas de Hoje, Vendas do Mês, Gráfico dos Últimos 7 Dias e Ranking de Top Mais Vendidos.
- **Falta de Abatimento de Estoque na Quitação via Cobrança:**
  - O abatimento de estoque para pedidos online ocorria unicamente se o lojista clicasse em "Aprovar e Baixar" na aba de Pedidos.
  - Ao quitar o pedido na aba de Cobrança, o pagamento era registrado, mas o estoque dos itens não era abatido.
- **Lucro Total Zerado para Pedidos Online:**
  - Ao fechar o checkout na vitrine pública, o objeto do pedido era registrado com `lucroTotal: 0`. Logo, ao ser finalizado/quitado, a métrica de "Lucro do Mês" e "Margem Média" não contabilizava os ganhos de pedidos da loja online.

### 2. Auditoria e Correção em Outros Cenários do Setor:
- **Cenário de Cancelamento com Inflação de Estoque:**
  - Identificado que se um pedido online pendente de aprovação (cujo estoque nunca havia sido debitado) fosse cancelado, o sistema executava a devolução de estoque incondicionalmente, inflando a contagem de produtos com unidades fantasmas.
  - **Correção:** Implementada verificação rigorosa `estoqueFoiBaixado`. Se a venda era um pedido pendente que nunca havia sido baixado, o cancelamento anula a cobrança sem duplicar unidades no estoque.
- **Auto-Reconciliação e Compatibilidade com Vendas Legadas:**
  - Implementada rotina automática `reconciliarVendasLoja(loja)` no carregamento e na sincronização com o Google Drive.
  - Pedidos que já estavam quitados na planilha ou no banco local foram automaticamente promovidos para status `Finalizado`, com cálculo de lucro reconstituído e estoque alinhado.

### 3. Melhorias e Ajustes Implementados no Código:
- **Função Unificada de Venda Válida (`isVendaValida`):**
  - Padronizada em todo o sistema (`Dashboard`, `Gráfico 7 Dias`, `Top Mais Vendidos`, `Painel Master` e `Exportação CSV`).
  - Vendas canceladas e orçamentos continuam estritamente excluídos do faturamento.
  - Vendas finalizadas, aprovadas, quitadas (`statusFinanceiro === 'Pago'` ou saldo devedor zerado) ou com entradas parciais são computadas de forma transparente e precisa.
- **Cálculo de Lucro Dinâmico (`calcularLucroVenda`):**
  - Calcula a margem real de cada item com base na diferença entre o preço de venda praticado e o preço de custo do produto.
  - Ativado no checkout da vitrine online, na baixa de pagamentos e no dashboard.
- **Backend no Google Apps Script (`google_apps_script.js`):**
  - `obterMetricasResumoLoja`: computa vendas quitadas mesmo que o status original fosse pedido online.
  - `registrarRecebimentoLoja`: se o recebimento quitar o saldo devedor de um pedido online pendente, promove automaticamente a coluna 19 para `Finalizado` e aciona `abaterEstoqueDeVendaLoja`.
  - `cancelarVendaLoja`: estorna estoque apenas se o estoque tiver sido previamente debitado.
  - `obterDadosPainelLojista`: auto-reconcilia pedidos quitados na planilha da loja.

---

## 📌 Versão 3.4.1 — Correção do Disparo de Pedidos via WhatsApp na Loja Online
**Data:** 07/11/2026  
**Status:** Concluído e Homologado  

### 1. Diagnóstico do Problema no Envio via WhatsApp:
- **Causa Raiz Identificada:**
  - O pedido era salvo localmente e enviado para o Google Drive antes da abertura do WhatsApp (o que explica o fato do pedido sempre constar em "Vendas").
  - Contudo, a chamada `window.open(linkWhatsApp, '_blank')` estava alocada dentro de um callback assíncrono de Promise (`Swal.fire().then(...)`).
  - Em navegadores modernos (Google Chrome, Microsoft Edge, Safari no iOS e Chrome no Android), qualquer `window.open()` acionado dentro de callbacks assíncronos ou Promises é **automaticamente bloqueado pelo motor de segurança contra popups (Popup Blocker)**.
  - Como resultado, o navegador bloqueava silenciosamente a abertura da nova aba/aplicativo do WhatsApp, embora a venda já estivesse devidamente gravada.

### 2. Melhorias e Ajustes Implementados:
- **Disparo Direto e Síncrono no Gesto do Usuário:**
  - O disparo do WhatsApp agora ocorre de forma síncrona no exato momento do clique do cliente no botão `Enviar Pedido no WhatsApp`, eliminando 100% dos bloqueios de popups.
  - **No Celular (Mobile):** Acionamento via `window.location.href = linkWhatsApp;`, disparando diretamente o aplicativo nativo do WhatsApp no Android e iOS.
  - **No Desktop:** Criação e clique síncrono em elemento `<a>` com `target="_blank"`, abrindo o WhatsApp Web em nova aba sem bloqueios.
- **Formatação e Sanitização do Número de WhatsApp (`formatarNumeroWhatsAppParaLink`):**
  - Implementada função robusta para higienizar qualquer formato digitado pelo lojista:
    - Previne duplicação de DDI (evita números como `5555...`).
    - Adiciona o código do país (`55`) automaticamente caso o número venha com DDD (`11` ou `91`).
    - Remove zeros à esquerda e caracteres especiais.
  - Validação defensiva: Se a loja não possuir WhatsApp cadastrado, o cliente é informado com clareza em vez de disparar uma URL quebrada.
- **Modal de Confirmação com Botão de Redundância:**
  - Exibição de tela de sucesso contendo o número do pedido (`#PED-ON-...`) e um botão de ação com link nativo direto (`<a href="..." target="_blank">`) caso o usuário deseje abrir a conversa novamente.
  - Inclusão do número do pedido no corpo da mensagem enviada à loja.

---

## 📌 Versão 3.4.0 — Reconciliação do Faturamento Master & Arquitetura Hierárquica no Google Drive
**Data:** 07/11/2026  
**Status:** Concluído e Homologado  

### 1. Reconciliação e Coerência do Faturamento Geral (Painel Master vs. Lojista):
- **Diagnóstico da Divergência:**
  - Identificado que na planilha da `LOJA-1` haviam 11 vendas de teste, todas com status `Cancelada` (totalizando exatamente R$ 1.040,00).
  - Enquanto o dashboard da loja filtrava apenas vendas ativas e finalizadas (exibindo R$ 0,00), o código anterior do Painel Master somava o `totalLiquido` de todo o array sem filtrar status, provocando a divergência visual.
- **Implementação da Regra de Vendas Válidas (`isVendaValida`):**
  - O cálculo do faturamento geral no Painel Master (`renderizarPainelMaster`) agora ignora terminantemente vendas com status `Cancelada` (tanto em `status` quanto em `statusFinanceiro`), `Aguardando Aprovação` e `Orçamento`.
  - O cálculo de "Contas a Receber" / Saldo Devedor Global (`devGlobal`) agora também desconsidera débitos de vendas canceladas.
- **Métricas Individuais por Loja na Tabela Master:**
  - Adicionada a coluna **Faturamento** na tabela de Lojas Gerenciadas do Painel Master, permitindo conferir na hora o faturamento ativo e a quantidade de produtos cadastrados em cada loja.
- **Métricas no Backend (`google_apps_script.js`):**
  - Implementada a função `obterMetricasResumoLoja(spreadsheetId)` que lê as métricas ativas diretamente das planilhas dedicadas de cada loja, alimentando o endpoint `acao=getDadosMaster`.

---

### 2. Nova Arquitetura e Organização de Pastas no Google Drive:
- **Estrutura Multi-Tenant Implementada:**
  ```text
  📁 APP_CLARA_SISTEMA (Pasta Raiz Geral do Projeto)
  ├── 📊 GESTÃO MASTER (Planilha Central do Banco de Dados Master)
  ├── 📁 [LOJA-1] Mary Variedades (Pasta Dedicada da Loja)
  │   ├── 📊 Banco de Dados - Mary Variedades (Planilha Exclusiva)
  │   └── 📁 Imagens (Fotos de Produtos e Logo da Loja)
  └── 📁 [LOJA-2] Outra Loja
      ├── 📊 Banco de Dados - Outra Loja
      └── 📁 Imagens
  ```
- **Vantagens Arquiteturais:**
  - Isolamento completo por loja (multi-tenant seguro).
  - Fotos de produtos e logos segregadas por loja, facilitando backup, auditoria e limpeza sem misturar com outras lojas.
  - Planilha Master protegida dentro da pasta do sistema, sem ficar solta na raiz do Google Drive do usuário.
  - Preservação total de IDs (`fileId` permanece inalterado ao mover pastas no Google Drive).
- **Funções de Organização Automatizada:**
  - Implementada `organizarEstruturaPastasDrive()` no Google Apps Script para criar subpastas e alocar automaticamente a Master, as planilhas dedicadas e as imagens.
  - Implementada `obterPastaRaizSistema()`, `obterOuCriarPastaDaLoja(lojaId, nomeLoja)` e `obterOuCriarSubpastaImagensDaLoja(pastaLoja)`.
  - Atualizadas as rotinas de criação de loja (`criarNovaLojaComBancoDedicado`) e upload de imagens (`salvarImagemNoDrive(nomeArquivo, base44Data, lojaId)`).
  - Adicionado menu nativo no Google Sheets (`📁 Gestão Multi-lojas e E-Commerce > Organizar Pastas no Drive`).
  - Adicionado botão interativo com confirmação no Painel Master da interface web (`Organizar Pastas no Drive`).

---

## 📌 Versão 3.3.0 — Ativação do Gráfico de Vendas (7 Dias), Ranking Top Mais Vendidos e Filtros por Período
**Data:** 06/11/2026  
**Status:** Concluído e Homologado  

### Melhorias e Funcionalidades Implementadas:
1. **Gráfico dos Últimos 7 Dias no Dashboard (`#chartVendas`):**
   - Implementada a função `renderizarGraficoVendas7Dias(vendas)` com integração completa à biblioteca Chart.js.
   - Cálculo retroativo exato dos últimos 7 dias civis (dia -6 até hoje), com conversão de fuso horário local brasileira (`extrairDataLocalIso`).
   - Visual moderno em área suave com preenchimento em gradiente translúcido, curva de Bézier (`tension: 0.35`) e alinhamento com a cor primária da loja (`--cor-tema`).
   - Tooltip customizado exibindo faturamento monetário formatado (`R$`) e quantidade de vendas finalizadas do dia.
   - Adicionada insígnia de totalizador (`#totalVendas7DiasBadge`) no topo do card com o total faturado na semana.
2. **Ranking de Top Mais Vendidos no Dashboard (`#listaMaisVendidos`):**
   - Implementada a função `renderizarTopMaisVendidos(vendas, produtos)` que agrupa todos os itens de pedidos e vendas finalizadas.
   - Cruzamento inteligente com o catálogo de produtos da loja para obter foto original, variação e categoria.
   - Ordenação decrescente por quantidade de unidades vendidas.
   - Medalhas de pódio temáticas (🥇 Dourada, 🥈 Prateada, 🥉 Bronzeada e 4º/5º) com miniaturas e barra de progresso proporcional ao campeão de vendas.
   - Estado vazio amigável com orientação quando a loja ainda não possuir vendas.
   - Adicionado contador de itens no topo (`#qtdMaisVendidosBadge`).
3. **Filtro de Período e Totais Dinâmicos na Aba "Vendas & Cobrança":**
   - Conectado o filtro de período (`setFiltroPeriodo`) na tela de vendas: suporte a **Hoje**, **Últimos 7 Dias**, **Este Mês** e **Todas**.
   - Atualização em tempo real dos 4 cartões de métrica no topo (Total no Filtro, Total Recebido, A Receber e Ticket Médio) conforme o período selecionado.
   - Destaque visual interativo no botão ativo de período e no botão de filtro financeiro (Quem Deve / Quitados).
4. **Cálculo da Margem de Lucro Média no Dashboard:**
   - Ativada a métrica `#metricMargemPercentual` com base no lucro real dividido pelo faturamento do mês (`Margem média: X%`).

---

## 📌 Versão 3.2.0 — Sistema de Promoções & Personalização Visual Estendida
**Data:** 05/11/2026  
**Status:** Concluído e Homologado  

### 1. Sistema de Promoção e Destaque de Itens
- **Cadastro e Edição de Produtos (`#modalProduto`):**
  - Adicionado interruptor dinâmico `[x] Ativar Preço Promocional / Oferta`.
  - Ao marcar, é aberta a caixa de diálogo com o campo `Preço Promocional (R$)`.
  - Implementado cálculo automático de desconto e percentual em tempo real: exibe economia em reais e porcentagem (ex: `-25% OFF`).
  - Validação inteligente: alerta caso o preço promocional informado seja igual ou superior ao preço normal de venda.
  - Adicionada opção `[x] Exibir na Seção de Destaques da Loja Online (Topo da Vitrine)`.
- **Loja Online / Catálogo Digital (`tela-vitrine-cliente`):**
  - **Seção de Ofertas no Topo (`#secaoDestaquesVitrine`):** Área dedicada no topo da vitrine (*"🔥 Ofertas & Promoções da Semana"*) destacando os produtos em oferta antes do catálogo completo.
  - **Visual De / Por:** Preço original riscado ($\text{De: R\$\ } 90,00$) e preço promocional em destaque ($\text{Por: R\$\ } 69,90$).
  - **Selo de Desconto Flutuante:** Badge com porcentagem de desconto sobre a foto do produto (ex: `🔥 -23% OFF`).
  - **Aba de Filtro Rápido:** Inclusão do botão `🔥 Promoções` junto ao seletor de categorias para filtrar promoções com 1 clique.
  - **Preço de Venda Efetivo:** Ao adicionar à sacola da vitrine, o item entra automaticamente pelo preço promocional.
- **Ponto de Venda / Balcão (`tela-pdv`):**
  - Cards do PDV exibem tag `🔥 PROMO` e valores De/Por.
  - Ao clicar no produto, o item é adicionado ao carrinho de compras pelo **preço promocional**, recalculando o lucro real daquele item com base no custo de aquisição.
  - Carrinho do PDV exibe a indicação `PROMO` para conferência do operador do caixa.
- **Tabela de Estoque (`renderizarProdutosEstoque`):**
  - Coluna de valor exibe o preço promocional destacado, valor normal riscado e etiqueta `PROMO`.
  - Produtos destacados recebem a insígnia `⭐ Destaque`.

---

### 2. Personalização Visual Estendida (Cores, Fundo e Menus)
- **Paleta de Cores e Temas:**
  - Criação de variáveis CSS no `:root`: `--cor-tema`, `--cor-destaque`, `--cor-menu-sidebar`, `--cor-menu-texto` e `--cor-fundo-app`.
  - Classes dinâmicas de estilização: `.badge-destaque`, `.text-destaque`, `.bg-menu-custom` e `.text-menu-custom`.
- **Seletores Livres de Cores (Color Pickers com Preview ao Vivo):**
  - **Cor Principal da Marca:** Botões de ação, cabeçalho da loja online e destaques primários.
  - **Cor de Destaque / Promoção:** Selos de oferta, porcentagens de desconto e badges chamativos.
  - **Cor dos Menus & Barras:** Personalização da barra lateral do desktop, cabeçalho mobile, drawer e bottom navigation bar.
  - **Cor de Fundo da Ferramenta:** Fundo de todo o sistema e telas administrativas.
  - **Detecção Inteligente de Contraste:** O sistema calcula a luminância da cor do menu para alternar automaticamente o texto entre branco e preto/escuro, mantendo sempre a legibilidade.
- **Paletas Pré-configuradas em 1 Clique (Presets):**
  - 💎 **Azul Real:** Estilo corporativo clássico (Azul Royal, Vermelho Oferta, Azul Noite e Fundo Gelo).
  - 🌸 **Boutique:** Moda e elegância (Rose Gold, Dourado Luxo, Bordô e Fundo Rosa Névoa).
  - 🌿 **Eco Verde:** Sustentabilidade e produtos naturais (Verde Esmeralda, Laranja Solar, Verde Floresta e Menta).
  - 🖤 **Dark Mode:** Minimalismo moderno (Preto Grafite, Vermelho Neon e Cinza Escuro).
  - 💜 **Glamour:** Roxo e Pink para cosméticos e estética.
  - ☀️ **Sunset:** Laranja Vibrante, Rubi e tons solares acolhedores.
- **Barra de Anúncio / Comunicado no Topo da Loja Online:**
  - Opção no painel da loja para habilitar/desabilitar barra de aviso.
  - Mensagem personalizada para clientes (ex: avisos de entrega, frete grátis, cupons ou novidades).

---

### 3. Backend e Banco de Dados (`google_apps_script.js`)
- **Aba `Produtos` da Planilha Dedicada:**
  - Adicionadas colunas `Em_Promocao`, `Preco_Promocional` e `Destaque`.
  - Atualizadas as funções `salvarProdutoLoja()`, `obterDadosPainelLojista()` e `obterDadosLojaPublica()`.
  - Retrocompatibilidade total preservada para planilhas que já estavam em uso.
- **Aba `Configuracoes` da Planilha Dedicada:**
  - Adicionados registros: `Cor_Destaque`, `Cor_Menu`, `Cor_Fundo`, `Banner_Ativo` e `Banner_Texto`.
  - Sincronização em tempo real das configurações visuais da loja.

---

## 📌 Versão 3.1.0 — Correção de Sincronização Multi-Dispositivo & Layout Mobile
**Data:** 05/11/2026  
**Status:** Concluído e Homologado  

### 1. Sincronização e Banco de Dados (Google Drive como Fonte Única da Verdade)
- Removidas lojas de demonstração estáticas do cache inicial (`CLARA_DB_V3`).
- Eliminação do merge cego: a lista de lojas no Painel Master agora deleta qualquer loja fantasma que não exista no Google Sheets.
- Reconciliação direta da loja **Mary Variedades** (`LOJA-1`, login: `moda`) na planilha `GESTÃO MASTER`.
- Remoção da trava `ESTADO.modoDrive &&`: todas as operações de escrita (produtos, fotos, clientes, vendas, baixas e cancelamentos) agora realizam upload automático para a nuvem via `fetch` POST.

### 2. Responsividade Mobile (Correção do Bloco Estreito e Espaço em Branco)
- **Causa Raiz Corrigida:** A barra de desktop (`#sidebarDesktop`) tinha sua classe `hidden` removida na navegação JS, travando em 256px e empurrando a tela no celular.
- **Novo Cabeçalho Mobile:** Barra superior limpa com nome da loja, status de conexão e botão de menu.
- **Gaveta Lateral Deslizante (Mobile Drawer):** Menu completo com fundo escurecido e navegação touch.
- **Barra Inferior Fixa (Bottom Navigation):** Acesso rápido aos módulos principais (Início, PDV, Vendas, Estoque, Menu).
- **Botão de Retorno ao Master:** Botão destacado `👑 Voltar ao Painel Master` quando o Super Admin estiver operando uma loja individual.

---

## 📁 Mapeamento de Arquivos do Repositório

| Arquivo | Função Principal |
| :--- | :--- |
| [`index.html`](./index.html) | Aplicação Single Page Application (SPA): Interface web completa, PDV, catálogo público e lógica de sincronização. |
| [`google_apps_script.js`](./google_apps_script.js) | Backend executado no Google Apps Script: Manipulação de planilhas Master e individuais no Google Drive. |
| [`HISTORICO_ALTERACOES.md`](./HISTORICO_ALTERACOES.md) | Arquivo oficial de registro, rastreamento de versões e auditoria de código. |
| [`COMO_CONFIGURAR_GOOGLE_DRIVE.md`](./COMO_CONFIGURAR_GOOGLE_DRIVE.md) | Guia passo a passo de como publicar e implantar o script no Google Drive. |

---

## 🚀 Como Publicar Novas Versões

1. **Netlify:**
   - Faça o commit e push dos arquivos [`index.html`](./index.html) e [`HISTORICO_ALTERACOES.md`](./HISTORICO_ALTERACOES.md) para o repositório GitHub. O Netlify publicará as mudanças em segundos automaticamente.
2. **Google Apps Script:**
   - Abra a planilha `GESTÃO MASTER` no Google Drive.
   - Acesse **Extensões > Apps Script**.
   - Substitua o código do editor pelo conteúdo atualizado de [`google_apps_script.js`](./google_apps_script.js).
   - Clique em **Implantar > Gerenciar Implantações > Editar > Nova Versão > Implantar**.
