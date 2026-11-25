-- ============================================================================
-- GESTÃO MULTI-LOJAS E E-COMMERCE — BLINDAGEM COMPLETA POSTGRESQL / SUPABASE
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- Versão: 5.0.0 (JWT Multi-Tenant RLS, RPCs Públicas Seguras & Storage Scoped)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. PRÉ-REQUISITOS DE COLUNA (CONTROLE ANTI-SPAM TELEGRAM)
-- ----------------------------------------------------------------------------
ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS telegram_notificado BOOLEAN DEFAULT FALSE;

-- ----------------------------------------------------------------------------
-- 1. PROTEÇÃO DE TABELAS E REMOÇÃO DE PRIVILÉGIOS ANÔNIMOS INDEVIDOS
-- ----------------------------------------------------------------------------

-- LOJAS: anon não possui NENHUM acesso direto; authenticated só lê sua própria loja (ou Master lê todas), sem senha_hash.
-- Criação, edição e exclusão de lojas são feitas exclusivamente pela Edge Function master-admin (service_role).
DO $$
DECLARE
  cols TEXT;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'lojas'
    AND column_name NOT IN ('senha_hash');

  REVOKE ALL ON public.lojas FROM PUBLIC, anon, authenticated;
  IF cols IS NOT NULL THEN
    EXECUTE 'GRANT SELECT (' || cols || ') ON public.lojas TO authenticated;';
  END IF;
END $$;

-- TABELAS MULTI-TENANT PRIVADAS: ZERO acesso direto para anon!
REVOKE ALL ON public.configuracoes_loja FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.configuracoes_loja TO authenticated;

REVOKE ALL ON public.produtos FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;

REVOKE ALL ON public.vendas FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas TO authenticated;

REVOKE ALL ON public.itens_venda FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_venda TO authenticated;

REVOKE ALL ON public.clientes FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;

REVOKE ALL ON public.despesas FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas TO authenticated;

-- MÉTRICAS DE TELEMETRIA: anon só pode inserir eventos válidos, jamais ler ou apagar
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'metricas_eventos') THEN
    REVOKE ALL ON public.metricas_eventos FROM PUBLIC, anon, authenticated;
    GRANT INSERT ON public.metricas_eventos TO anon, authenticated;
    GRANT SELECT ON public.metricas_eventos TO authenticated;
    IF EXISTS (SELECT FROM pg_class WHERE relkind = 'S' AND relname = 'metricas_eventos_id_seq') THEN
      GRANT USAGE, SELECT ON SEQUENCE public.metricas_eventos_id_seq TO anon, authenticated;
    END IF;
  END IF;
END $$;

-- VIEWS DE TELEMETRIA: forçar security_invoker para respeitar RLS de metricas_eventos
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'vw_metricas_vitrine_resumo') THEN
    EXECUTE 'ALTER VIEW public.vw_metricas_vitrine_resumo SET (security_invoker = true);';
  END IF;
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'vw_top_produtos_sacola') THEN
    EXECUTE 'ALTER VIEW public.vw_top_produtos_sacola SET (security_invoker = true);';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) E LIMPEZA DE POLÍTICAS ANTIGAS
-- ----------------------------------------------------------------------------
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'metricas_eventos') THEN
    ALTER TABLE public.metricas_eventos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('lojas', 'configuracoes_loja', 'produtos', 'vendas', 'itens_venda', 'clientes', 'despesas', 'metricas_eventos')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 3. POLÍTICAS RLS BASEADAS EM JWT VERIFICADO (app_metadata)
-- ----------------------------------------------------------------------------

-- LOJAS: Somente usuário autenticado da própria loja ou MASTER
CREATE POLICY "Lojas_Select_Auth" ON public.lojas
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  );

-- CONFIGURAÇÕES DA LOJA: Somente dono da loja ou MASTER (vitrine pública usa obter_vitrine_publica)
CREATE POLICY "ConfigLoja_Auth" ON public.configuracoes_loja
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  );

-- PRODUTOS: Somente dono da loja ou MASTER (vitrine pública usa obter_vitrine_publica sem preco_custo)
CREATE POLICY "Produtos_Auth" ON public.produtos
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  );

-- VENDAS: Somente dono da loja ou MASTER (pedidos online públicos usam criar_pedido_online)
CREATE POLICY "Vendas_Auth" ON public.vendas
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  );

-- ITENS DE VENDA: Somente dono da loja ou MASTER
CREATE POLICY "ItensVenda_Auth" ON public.itens_venda
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  );

-- CLIENTES: Somente dono da loja ou MASTER (proteção total LGPD contra vazamento de PII)
CREATE POLICY "Clientes_Auth" ON public.clientes
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  );

-- DESPESAS: Somente dono da loja ou MASTER
CREATE POLICY "Despesas_Auth" ON public.despesas
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
    OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
  );

-- MÉTRICAS DA VITRINE: Inserção anônima controlada; leitura restrita à loja ou MASTER
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'metricas_eventos') THEN
    CREATE POLICY "Metricas_Insert_Publico" ON public.metricas_eventos
      FOR INSERT TO anon, authenticated
      WITH CHECK (
        loja_id IS NOT NULL
        AND evento IN (
          'loja_aberta', 'produto_visualizado', 'produto_adicionado_sacola',
          'produto_removido_sacola', 'sacola_aberta', 'checkout_iniciado',
          'checkout_concluido_whatsapp'
        )
      );
    CREATE POLICY "Metricas_Select_Auth" ON public.metricas_eventos
      FOR SELECT TO authenticated
      USING (
        (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
        OR loja_id = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. BLINDAGEM DE FUNÇÕES SECURITY DEFINER EXISTENTES
-- ----------------------------------------------------------------------------

-- Revoga acesso direto à antiga autenticar_usuario (login agora usa Edge Function auth-login)
REVOKE ALL ON FUNCTION public.autenticar_usuario(text, text, text) FROM PUBLIC, anon, authenticated;

-- Protege registrar_venda_completa exigindo JWT válido da loja dona (ou MASTER)
CREATE OR REPLACE FUNCTION public.registrar_venda_completa(p_venda jsonb, p_itens jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_item JSONB;
    v_prod_id TEXT;
    v_qtd INTEGER;
    v_jwt_role TEXT := COALESCE(auth.jwt() -> 'app_metadata' ->> 'app_role', '');
    v_jwt_loja TEXT := COALESCE(auth.jwt() -> 'app_metadata' ->> 'loja_id', '');
    v_target_loja TEXT := COALESCE(p_venda->>'loja_id', '');
BEGIN
    IF v_jwt_role <> 'MASTER' AND (v_jwt_loja = '' OR v_jwt_loja <> v_target_loja) THEN
        RAISE EXCEPTION 'Acesso negado: token não autorizado para registrar vendas nesta loja.';
    END IF;

    INSERT INTO public.vendas (
        id, loja_id, tipo, origem, cliente_id, cliente_nome, cliente_telefone,
        total_bruto, taxa_entrega, desconto, total_liquido, lucro_total,
        forma_pagamento, condicao_pagamento, parcelas, valor_parcela,
        status_financeiro, valor_pago, saldo_devedor, status_pedido,
        modalidade_entrega, endereco_entrega, observacoes, motivo_cancelamento,
        data_vencimento, profissional
    ) VALUES (
        p_venda->>'id',
        v_target_loja,
        COALESCE(p_venda->>'tipo', 'Venda PDV'),
        COALESCE(p_venda->>'origem', 'PDV'),
        NULLIF(p_venda->>'cliente_id', ''),
        COALESCE(p_venda->>'cliente_nome', 'Cliente Balcão'),
        COALESCE(p_venda->>'cliente_telefone', ''),
        COALESCE((p_venda->>'total_bruto')::NUMERIC, 0.00),
        COALESCE((p_venda->>'taxa_entrega')::NUMERIC, 0.00),
        COALESCE((p_venda->>'desconto')::NUMERIC, 0.00),
        COALESCE((p_venda->>'total_liquido')::NUMERIC, 0.00),
        COALESCE((p_venda->>'lucro_total')::NUMERIC, 0.00),
        COALESCE(p_venda->>'forma_pagamento', 'Dinheiro'),
        COALESCE(p_venda->>'condicao_pagamento', 'A Vista'),
        COALESCE((p_venda->>'parcelas')::INTEGER, 1),
        COALESCE((p_venda->>'valor_parcela')::NUMERIC, 0.00),
        COALESCE(p_venda->>'status_financeiro', 'Pago'),
        COALESCE((p_venda->>'valor_pago')::NUMERIC, 0.00),
        COALESCE((p_venda->>'saldo_devedor')::NUMERIC, 0.00),
        COALESCE(p_venda->>'status_pedido', 'Aprovado'),
        COALESCE(p_venda->>'modalidade_entrega', 'Retirada'),
        COALESCE(p_venda->>'endereco_entrega', ''),
        COALESCE(p_venda->>'observacoes', ''),
        COALESCE(p_venda->>'motivo_cancelamento', ''),
        CASE WHEN p_venda->>'data_vencimento' IS NOT NULL AND p_venda->>'data_vencimento' <> '' THEN (p_venda->>'data_vencimento')::DATE ELSE NULL END,
        COALESCE(p_venda->>'profissional', '')
    )
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        INSERT INTO public.itens_venda (
            id_item, venda_id, loja_id, produto_id, produto_nome, variacao,
            quantidade, preco_custo_unitario, preco_original, desconto_unitario,
            preco_venda_unitario, subtotal, lucro_item
        ) VALUES (
            v_item->>'id_item',
            p_venda->>'id',
            v_target_loja,
            NULLIF(v_item->>'produto_id', ''),
            COALESCE(v_item->>'produto_nome', 'Item'),
            COALESCE(v_item->>'variacao', ''),
            COALESCE((v_item->>'quantidade')::INTEGER, 1),
            COALESCE((v_item->>'preco_custo_unitario')::NUMERIC, 0.00),
            COALESCE((v_item->>'preco_original')::NUMERIC, 0.00),
            COALESCE((v_item->>'desconto_unitario')::NUMERIC, 0.00),
            COALESCE((v_item->>'preco_venda_unitario')::NUMERIC, 0.00),
            COALESCE((v_item->>'subtotal')::NUMERIC, 0.00),
            COALESCE((v_item->>'lucro_item')::NUMERIC, 0.00)
        )
        ON CONFLICT (id_item) DO NOTHING;

        v_prod_id := NULLIF(v_item->>'produto_id', '');
        v_qtd := COALESCE((v_item->>'quantidade')::INTEGER, 1);
        IF v_prod_id IS NOT NULL THEN
            UPDATE public.produtos
            SET estoque_atual = GREATEST(0, estoque_atual - v_qtd)
            WHERE id = v_prod_id AND loja_id = v_target_loja;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('status', 'sucesso', 'id', p_venda->>'id');
END;
$function$;

REVOKE ALL ON FUNCTION public.registrar_venda_completa(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_venda_completa(jsonb, jsonb) TO authenticated;

-- Protege cancelar_venda_completa exigindo JWT válido da loja dona (ou MASTER)
CREATE OR REPLACE FUNCTION public.cancelar_venda_completa(p_loja_id text, p_venda_id text, p_motivo text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_item RECORD;
    v_jwt_role TEXT := COALESCE(auth.jwt() -> 'app_metadata' ->> 'app_role', '');
    v_jwt_loja TEXT := COALESCE(auth.jwt() -> 'app_metadata' ->> 'loja_id', '');
BEGIN
    IF v_jwt_role <> 'MASTER' AND (v_jwt_loja = '' OR v_jwt_loja <> COALESCE(p_loja_id, '')) THEN
        RAISE EXCEPTION 'Acesso negado: token não autorizado para cancelar vendas nesta loja.';
    END IF;

    UPDATE public.vendas
    SET status_pedido = 'Cancelada',
        status_financeiro = 'Cancelada',
        motivo_cancelamento = p_motivo,
        updated_at = NOW()
    WHERE id = p_venda_id AND loja_id = p_loja_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'erro', 'mensagem', 'Venda não encontrada');
    END IF;

    FOR v_item IN SELECT produto_id, quantidade FROM public.itens_venda WHERE venda_id = p_venda_id AND loja_id = p_loja_id
    LOOP
        IF v_item.produto_id IS NOT NULL THEN
            UPDATE public.produtos
            SET estoque_atual = estoque_atual + v_item.quantidade
            WHERE id = v_item.produto_id AND loja_id = p_loja_id;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('status', 'sucesso');
END;
$function$;

REVOKE ALL ON FUNCTION public.cancelar_venda_completa(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_venda_completa(text, text, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. RPCs SEGURAS PARA A VITRINE PÚBLICA (?loja=ID)
-- Expõem somente dados públicos da loja/catálogo e recalculam pedidos no servidor
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.obter_vitrine_publica(p_identificador text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_id_norm TEXT := LOWER(TRIM(COALESCE(p_identificador, '')));
    v_loja RECORD;
    v_conf RECORD;
    v_produtos JSONB;
BEGIN
    SELECT id, nome_loja, status, whatsapp
    INTO v_loja
    FROM public.lojas
    WHERE LOWER(TRIM(id)) = v_id_norm OR LOWER(TRIM(login)) = v_id_norm
    LIMIT 1;

    IF NOT FOUND OR v_loja.status = 'Bloqueada' THEN
        RETURN jsonb_build_object('status', 'erro', 'mensagem', 'Loja não encontrada ou inativa.');
    END IF;

    SELECT
        slogan, cor_primaria, cor_destaque, cor_menu, cor_fundo,
        banner_ativo, banner_texto, logo_url, chave_pix,
        permite_delivery, taxa_entrega, modelo_parcelamento,
        valor_minimo_parcela, max_parcelas_geral, tabela_faixas_json
    INTO v_conf
    FROM public.configuracoes_loja
    WHERE loja_id = v_loja.id
    LIMIT 1;

    -- Projeta estritamente campos públicos (omite preco_custo, margem_percentual, consignantes)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', p.id,
        'nome', p.nome,
        'variacao', COALESCE(p.variacao, ''),
        'categoria', COALESCE(p.categoria, 'Geral'),
        'precoVenda', COALESCE(p.preco_venda, 0),
        'estoqueAtual', COALESCE(p.estoque_atual, 0),
        'fotoUrl', COALESCE(p.foto_url, ''),
        'visivelOnline', true,
        'emPromocao', COALESCE(p.em_promocao, false),
        'precoPromocional', COALESCE(p.preco_promocional, 0),
        'destaque', COALESCE(p.destaque, false),
        'descricao', COALESCE(p.descricao, ''),
        'somenteAVista', COALESCE(p.somente_a_vista, false),
        'tipoItem', CASE WHEN p.tipo_item IN ('Serviço', 'SERVICO') THEN 'SERVICO' ELSE 'PRODUTO' END,
        'condicaoPeca', COALESCE(p.condicao_peca, ''),
        'medidas', COALESCE(p.medidas, ''),
        'pecaUnica', COALESCE(p.peca_unica, false)
    ) ORDER BY p.destaque DESC, p.nome ASC), '[]'::jsonb)
    INTO v_produtos
    FROM public.produtos p
    WHERE p.loja_id = v_loja.id AND p.visivel_online = true;

    RETURN jsonb_build_object(
        'status', 'sucesso',
        'loja', jsonb_build_object(
            'id', v_loja.id,
            'nomeLoja', v_loja.nome_loja,
            'whatsapp', COALESCE(v_loja.whatsapp, ''),
            'slogan', COALESCE(v_conf.slogan, ''),
            'corPrimaria', COALESCE(v_conf.cor_primaria, '#2563EB'),
            'corDestaque', COALESCE(v_conf.cor_destaque, '#EF4444'),
            'corMenu', COALESCE(v_conf.cor_menu, '#0F172A'),
            'corFundo', COALESCE(v_conf.cor_fundo, '#F8FAFC'),
            'bannerAtivo', COALESCE(v_conf.banner_ativo, false),
            'bannerTexto', COALESCE(v_conf.banner_texto, ''),
            'logoUrl', COALESCE(v_conf.logo_url, ''),
            'chavePix', COALESCE(v_conf.chave_pix, ''),
            'permiteDelivery', COALESCE(v_conf.permite_delivery, true),
            'taxaEntrega', COALESCE(v_conf.taxa_entrega, 0),
            'modeloParcelamento', COALESCE(v_conf.modelo_parcelamento, 'MODELO_1'),
            'valorMinimoParcela', COALESCE(v_conf.valor_minimo_parcela, 50),
            'maxParcelas', COALESCE(v_conf.max_parcelas_geral, 6),
            'faixas', COALESCE(v_conf.tabela_faixas_json, '[]'::jsonb),
            'produtos', v_produtos
        )
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.obter_vitrine_publica(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obter_vitrine_publica(text) TO anon, authenticated;

-- Criação de pedido online com validação canônica de preços no PostgreSQL (corrige DB-04)
CREATE OR REPLACE FUNCTION public.criar_pedido_online(p_loja_id text, p_dados jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_loja RECORD;
    v_conf RECORD;
    v_item JSONB;
    v_prod RECORD;
    v_qtd INTEGER;
    v_preco_cheio NUMERIC(10,2);
    v_preco_unit NUMERIC(10,2);
    v_desc_unit NUMERIC(10,2);
    v_subtotal NUMERIC(10,2);
    v_lucro_item NUMERIC(10,2);
    v_total_bruto NUMERIC(10,2) := 0;
    v_lucro_total NUMERIC(10,2) := 0;
    v_taxa NUMERIC(10,2) := 0;
    v_total_liquido NUMERIC(10,2) := 0;
    v_parcelas INTEGER := GREATEST(1, COALESCE((p_dados->>'parcelas')::INTEGER, 1));
    v_valor_parcela NUMERIC(10,2) := 0;
    v_modalidade TEXT := COALESCE(NULLIF(TRIM(p_dados->>'modalidadeEntrega'), ''), 'Retirada');
    v_venda_id TEXT := 'PED-ON-' || RIGHT(EXTRACT(EPOCH FROM clock_timestamp())::BIGINT::TEXT, 6) || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4);
    v_itens_validados JSONB := '[]'::jsonb;
BEGIN
    SELECT id, status INTO v_loja FROM public.lojas WHERE id = p_loja_id LIMIT 1;
    IF NOT FOUND OR v_loja.status = 'Bloqueada' THEN
        RETURN jsonb_build_object('status', 'erro', 'mensagem', 'Loja inativa ou não encontrada.');
    END IF;

    IF p_dados->'itens' IS NULL OR jsonb_typeof(p_dados->'itens') <> 'array' OR jsonb_array_length(p_dados->'itens') = 0 THEN
        RETURN jsonb_build_object('status', 'erro', 'mensagem', 'O pedido deve conter ao menos 1 item.');
    END IF;

    SELECT permite_delivery, taxa_entrega
    INTO v_conf
    FROM public.configuracoes_loja
    WHERE loja_id = p_loja_id
    LIMIT 1;

    IF v_modalidade = 'Delivery' AND COALESCE(v_conf.permite_delivery, true) THEN
        v_taxa := GREATEST(0, COALESCE(v_conf.taxa_entrega, 0));
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_dados->'itens')
    LOOP
        SELECT * INTO v_prod
        FROM public.produtos
        WHERE id = COALESCE(v_item->>'produtoId', v_item->>'produto_id')
          AND loja_id = p_loja_id
          AND visivel_online = true
        LIMIT 1;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produto inválido ou indisponível online.';
        END IF;

        v_qtd := GREATEST(1, COALESCE((v_item->>'quantidade')::INTEGER, 1));
        v_preco_cheio := GREATEST(0, COALESCE(v_prod.preco_venda, 0));
        v_preco_unit := CASE
            WHEN COALESCE(v_prod.em_promocao, false) AND COALESCE(v_prod.preco_promocional, 0) > 0
            THEN v_prod.preco_promocional
            ELSE v_preco_cheio
        END;
        v_desc_unit := GREATEST(0, v_preco_cheio - v_preco_unit);
        v_subtotal := ROUND(v_preco_unit * v_qtd, 2);
        v_lucro_item := GREATEST(0, ROUND((v_preco_unit - COALESCE(v_prod.preco_custo, 0)) * v_qtd, 2));

        v_total_bruto := v_total_bruto + v_subtotal;
        v_lucro_total := v_lucro_total + v_lucro_item;

        v_itens_validados := v_itens_validados || jsonb_build_object(
            'id_item', 'ITM-' || SUBSTRING(MD5(RANDOM()::TEXT || v_prod.id), 1, 10),
            'produto_id', v_prod.id,
            'produto_nome', v_prod.nome,
            'variacao', COALESCE(v_prod.variacao, ''),
            'quantidade', v_qtd,
            'preco_custo_unitario', COALESCE(v_prod.preco_custo, 0),
            'preco_original', v_preco_cheio,
            'desconto_unitario', v_desc_unit,
            'preco_venda_unitario', v_preco_unit,
            'subtotal', v_subtotal,
            'lucro_item', v_lucro_item
        );
    END LOOP;

    v_total_liquido := ROUND(v_total_bruto + v_taxa, 2);
    v_valor_parcela := ROUND(v_total_liquido / v_parcelas, 2);

    INSERT INTO public.vendas (
        id, loja_id, tipo, origem, cliente_id, cliente_nome, cliente_telefone,
        total_bruto, taxa_entrega, desconto, total_liquido, lucro_total,
        forma_pagamento, condicao_pagamento, parcelas, valor_parcela,
        status_financeiro, valor_pago, saldo_devedor, status_pedido,
        modalidade_entrega, endereco_entrega, observacoes, telegram_notificado
    ) VALUES (
        v_venda_id,
        p_loja_id,
        'PEDIDO_ONLINE',
        'Loja Online',
        NULL,
        COALESCE(NULLIF(TRIM(p_dados->>'clienteNome'), ''), 'Cliente Online'),
        COALESCE(TRIM(p_dados->>'clienteTelefone'), ''),
        v_total_bruto,
        v_taxa,
        0,
        v_total_liquido,
        v_lucro_total,
        COALESCE(NULLIF(TRIM(p_dados->>'formaPagamento'), ''), 'Pix'),
        CASE WHEN v_parcelas > 1 THEN 'A Prazo' ELSE 'A Vista' END,
        v_parcelas,
        v_valor_parcela,
        'Pendente',
        0,
        v_total_liquido,
        'Pendente',
        v_modalidade,
        COALESCE(TRIM(p_dados->>'enderecoEntrega'), ''),
        '',
        false
    );

    INSERT INTO public.itens_venda (
        id_item, venda_id, loja_id, produto_id, produto_nome, variacao,
        quantidade, preco_custo_unitario, preco_original, desconto_unitario,
        preco_venda_unitario, subtotal, lucro_item
    )
    SELECT
        it->>'id_item',
        v_venda_id,
        p_loja_id,
        it->>'produto_id',
        it->>'produto_nome',
        it->>'variacao',
        (it->>'quantidade')::INTEGER,
        (it->>'preco_custo_unitario')::NUMERIC,
        (it->>'preco_original')::NUMERIC,
        (it->>'desconto_unitario')::NUMERIC,
        (it->>'preco_venda_unitario')::NUMERIC,
        (it->>'subtotal')::NUMERIC,
        (it->>'lucro_item')::NUMERIC
    FROM jsonb_array_elements(v_itens_validados) AS it;

    RETURN jsonb_build_object(
        'status', 'sucesso',
        'id', v_venda_id,
        'totalBruto', v_total_bruto,
        'taxaEntrega', v_taxa,
        'totalLiquido', v_total_liquido,
        'valorParcela', v_valor_parcela,
        'itens', v_itens_validados
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.criar_pedido_online(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_pedido_online(text, jsonb) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS DO STORAGE DE ARQUIVOS (BUCKET: arquivos-lojas)
-- Leitura pública via CDN; escrita/exclusão SOMENTE autenticada na pasta da loja
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Leitura Publica Midia" ON storage.objects;
DROP POLICY IF EXISTS "Upload Midia" ON storage.objects;
DROP POLICY IF EXISTS "Gerenciamento Midia" ON storage.objects;
DROP POLICY IF EXISTS "Upload Midia Autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Atualizacao Midia Autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Exclusao Midia Autenticado" ON storage.objects;

CREATE POLICY "Leitura Publica Midia" ON storage.objects
  FOR SELECT USING (bucket_id = 'arquivos-lojas');

CREATE POLICY "Upload Midia Autenticado" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'arquivos-lojas'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
      OR (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
    )
  );

CREATE POLICY "Atualizacao Midia Autenticado" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'arquivos-lojas'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
      OR (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
    )
  )
  WITH CHECK (
    bucket_id = 'arquivos-lojas'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
      OR (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
    )
  );

CREATE POLICY "Exclusao Midia Autenticado" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'arquivos-lojas'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'MASTER'
      OR (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'loja_id')
    )
  );
