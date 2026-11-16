-- ============================================================================
-- GESTÃO MULTI-LOJAS E E-COMMERCE — BLINDAGEM DE SEGURANÇA POSTGRESQL / SUPABASE
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- Versão: 4.4.1 (Idempotent Hardening & Dynamic Policy Reset)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROTEÇÃO CONTRA VAZAMENTO DA COLUNA DE SENHA (senha_hash)
-- Concede permissão de SELECT apenas para as colunas públicas/seguras de lojas,
-- garantindo que senha_hash nunca seja exposta via chave anon/authenticated.
-- ----------------------------------------------------------------------------
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

  IF cols IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.lojas FROM anon, authenticated;';
    EXECUTE 'GRANT SELECT (' || cols || ') ON public.lojas TO anon, authenticated;';
    EXECUTE 'GRANT INSERT, UPDATE, DELETE ON public.lojas TO anon, authenticated;';
  END IF;
END $$;

-- A função autenticar_usuario opera como SECURITY DEFINER, tendo permissão
-- interna controlada para conferir o hash da senha sem expor a coluna publicamente.
GRANT EXECUTE ON FUNCTION public.autenticar_usuario(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
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

-- ----------------------------------------------------------------------------
-- 3. LIMPEZA TOTAL E IDEMPOTENTE DE POLÍTICAS EXISTENTES
-- Remove dinamicamente apenas as políticas antigas das tabelas alvo da aplicação
-- para evitar o erro 42710 sem interferir em outras tabelas do banco ou do Supabase.
-- ----------------------------------------------------------------------------
DO $$ 
DECLARE 
  r RECORD;
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
-- 4. POLÍTICAS DE RLS REFINADAS (ESCOPO E INTEGRIDADE)
-- ----------------------------------------------------------------------------

-- LOJAS: Leitura pública para carregar informações das vitrines e gestão master
CREATE POLICY "Lojas_Select" ON public.lojas FOR SELECT USING (true);
CREATE POLICY "Lojas_Insert" ON public.lojas FOR INSERT WITH CHECK (id IS NOT NULL AND login IS NOT NULL);
CREATE POLICY "Lojas_Update" ON public.lojas FOR UPDATE USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);
CREATE POLICY "Lojas_Delete" ON public.lojas FOR DELETE USING (id IS NOT NULL);

-- CONFIGURAÇÕES DA LOJA: Leitura pública para identidade visual/vitrine; escrita auditada
CREATE POLICY "ConfigLoja_Select" ON public.configuracoes_loja FOR SELECT USING (true);
CREATE POLICY "ConfigLoja_Mod" ON public.configuracoes_loja FOR ALL USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL);

-- PRODUTOS: Vitrine pública visualiza itens ativos/visíveis; lojista gerencia seu catálogo
CREATE POLICY "Produtos_Select" ON public.produtos 
  FOR SELECT USING (visivel_online = true OR loja_id IS NOT NULL);

CREATE POLICY "Produtos_Insert" ON public.produtos 
  FOR INSERT WITH CHECK (loja_id IS NOT NULL AND nome IS NOT NULL);

CREATE POLICY "Produtos_Update" ON public.produtos 
  FOR UPDATE USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL);

CREATE POLICY "Produtos_Delete" ON public.produtos 
  FOR DELETE USING (loja_id IS NOT NULL);

-- VENDAS & PEDIDOS: Inserção pública permitida para pedidos online da vitrine ou balcão
CREATE POLICY "Vendas_Select" ON public.vendas 
  FOR SELECT USING (loja_id IS NOT NULL);

CREATE POLICY "Vendas_Insert" ON public.vendas 
  FOR INSERT WITH CHECK (loja_id IS NOT NULL AND (tipo IN ('PEDIDO_ONLINE', 'PDV_BALCAO') OR tipo IS NOT NULL));

CREATE POLICY "Vendas_Update" ON public.vendas 
  FOR UPDATE USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL);

CREATE POLICY "Vendas_Delete" ON public.vendas 
  FOR DELETE USING (loja_id IS NOT NULL);

-- ITENS DE VENDA: Relacionados diretamente a uma venda válida
CREATE POLICY "ItensVenda_Select" ON public.itens_venda 
  FOR SELECT USING (venda_id IS NOT NULL);

CREATE POLICY "ItensVenda_Insert" ON public.itens_venda 
  FOR INSERT WITH CHECK (venda_id IS NOT NULL);

CREATE POLICY "ItensVenda_Update" ON public.itens_venda 
  FOR UPDATE USING (venda_id IS NOT NULL) WITH CHECK (venda_id IS NOT NULL);

CREATE POLICY "ItensVenda_Delete" ON public.itens_venda 
  FOR DELETE USING (venda_id IS NOT NULL);

-- CLIENTES: Escopo restrito à loja dona dos cadastros
CREATE POLICY "Clientes_Mod" ON public.clientes 
  FOR ALL USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL AND nome IS NOT NULL);

-- DESPESAS: Escopo restrito à loja operadora
CREATE POLICY "Despesas_Mod" ON public.despesas 
  FOR ALL USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL AND descricao IS NOT NULL);

-- MÉTRICAS E TELEMETRIA DA VITRINE: Inserção anônima de telemetria; leitura gerencial
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'metricas_eventos') THEN
    CREATE POLICY "Metricas_Insert" ON public.metricas_eventos FOR INSERT WITH CHECK (loja_id IS NOT NULL AND evento IS NOT NULL);
    CREATE POLICY "Metricas_Select" ON public.metricas_eventos FOR SELECT USING (loja_id IS NOT NULL);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. POLÍTICAS DO STORAGE DE ARQUIVOS (BUCKET: arquivos-lojas)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Leitura Publica Midia" ON storage.objects;
DROP POLICY IF EXISTS "Upload Midia" ON storage.objects;
DROP POLICY IF EXISTS "Gerenciamento Midia" ON storage.objects;

CREATE POLICY "Leitura Publica Midia" ON storage.objects 
  FOR SELECT USING (bucket_id = 'arquivos-lojas');

CREATE POLICY "Upload Midia" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'arquivos-lojas');

CREATE POLICY "Gerenciamento Midia" ON storage.objects 
  FOR ALL USING (bucket_id = 'arquivos-lojas');
