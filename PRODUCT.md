# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Público Primário:** Lojistas, gerentes de loja e pequenos varejistas em operação diária no balcão e no atendimento digital via WhatsApp.
- **Público Secundário:** Consumidores finais acessando a vitrine online pública (`?loja=ID`) através de smartphones para consultar catálogo, montar sacola e fechar pedidos via WhatsApp.
- **Público Administrativo:** Super Administrador (Painel Master) gerenciando múltiplas lojas, contas a receber consolidadas e métricas gerais do ecossistema.

## Product Purpose

Oferecer uma plataforma web completa, leve e resiliente para gestão operacional de lojas físicas e virtuais (PDV, controle de estoque com campos dinâmicos por nicho, fluxo financeiro, CRM de clientes e e-commerce direto via WhatsApp). O sucesso significa permitir que o lojista realize vendas em segundos no balcão e receba pedidos organizados no celular, sem atritos ou lentidão.

## Positioning

Solução de gestão e catálogo online multi-nicho (varejo geral, moda/brechós, perfumaria e serviços) que roda 100% no navegador (SPA estática) conectada ao backend Supabase (PostgreSQL ACID + Storage CDN), eliminando a necessidade de infraestrutura pesada, compilações ou servidores complexos, ao mesmo tempo em que oferece recursos adaptativos profundos (como peças únicas, medidas em cm, controle de lotes/validade e serviços).

## Operating Context

- **Ambiente de Balcão (PDV):** Atendimento rápido com leitor de código de barras por câmera/webcam, busca instantânea de produtos e impressão de cupons/recibos térmicos (58mm/80mm) ou A4.
- **Ambiente Mobile/WhatsApp:** Clientes navegando no celular em conexões móveis, montando sacolas e enviando pedidos estruturados diretamente para o WhatsApp do lojista; alertas instantâneos de vendas via Telegram Bot.
- **Execução Técnica:** SPA pura em arquivo único (`index.html`) usando Tailwind CSS, Lucide Icons, Chart.js e Supabase SDK via CDN.

## Capabilities and Constraints

- **Multi-Tenant Relacional:** Múltiplas lojas isoladas com segurança RLS e Stored Procedures ACID no PostgreSQL/Supabase.
- **Nichos Adaptativos:**
  - *Moda Circular/Brechós:* Medidas reais (busto, cintura, quadril), condição da peça, consignação com repasse e trava de Peça Única.
  - *Perfumaria/Cosméticos:* Controle de validade do lote com alertas preventivos visuais (30 dias) e histórico olfativo/estético do cliente.
  - *Serviços/Estética:* Itens sem controle físico de estoque com identificador visual específico e histórico de procedimentos.
  - *Varejo Geral:* Variações de cor/tamanho, controle de markup/margem e parcelamento configurável (mínimo por parcela ou tabela de faixas).
- **Sem Backend Customizado no Node:** A aplicação é estática e depende exclusivamente de chamadas diretas ao Supabase via REST/RPC e CDN.

## Brand Commitments

- **Identidade da Loja:** Cada lojista personaliza a cor tema (CSS variables `--cor-tema`, etc.), logotipo, banner de avisos e dados comerciais.
- **Tom de Voz:** Direto, profissional, focado em agilidade operacional e clareza para o lojista; amigável e desimpedido para o consumidor na vitrine.
- **Tipografia e Ícones:** Família tipográfica *Plus Jakarta Sans* e biblioteca de ícones *Lucide Icons*.

## Evidence on Hand

- Arquivo central de frontend: [index.html](file:///c:/Users/victo/OneDrive/Documentos/GitHub/App-Gestao-Supabase/index.html) (SPA funcional com Painel Master, Painel do Lojista, PDV e Vitrine Pública).
- Documentação de funcionalidades e arquitetura: [README.md](file:///c:/Users/victo/OneDrive/Documentos/GitHub/App-Gestao-Supabase/README.md).
- Registro detalhado de versões: [HISTORICO_ALTERACOES.md](file:///c:/Users/victo/OneDrive/Documentos/GitHub/App-Gestao-Supabase/HISTORICO_ALTERACOES.md).

## Product Principles

1. **Agilidade no Balcão:** Cada clique a menos no PDV e na consulta de estoque economiza tempo real do lojista e do cliente.
2. **Resiliência e Dados Atômicos:** Vendas, cancelamentos e movimentações de estoque devem ser atômicos e auditados (transações ACID sem inconsistências).
3. **Simplicidade de Implantação:** O sistema deve continuar funcionando diretamente no navegador sem exigir compilação complexa, pipelines de build ou servidores dedicados.
4. **Respeito à Identidade do Lojista:** A vitrine pública deve refletir as cores e a marca de cada lojista sem ruídos da plataforma central.

## Accessibility & Inclusion

- Design responsivo fluido e testado para telas touch de smartphones até monitores widescreen de balcão.
- Áreas de toque confortáveis (mínimo de 44x44px) para botões de ação e navegação móvel.
- Contraste visual legível e suporte a impressoras térmicas monocromáticas de 58mm e 80mm.
