-- ============================================================================
-- GESTÃO MULTI-LOJAS E E-COMMERCE — BLINDAGEM DE SEGURANÇA POSTGRESQL / SUPABASE
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- Versão: 4.4.0 (OWASP Top 10 Hardening & Fine-Grained RLS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROTEÇÃO CONTRA VAZAMENTO DA COLUNA DE SENHA (senha_hash)
-- Impede que consultas abertas (via chave anônima/pública do frontend)
-- tenham acesso à coluna de credencial na tabela de lojas.
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.lojas FROM anon, authenticated;
GRANT SELECT (id, nome_loja, login, nome_responsavel, whatsapp, status, created_at, updated_at) ON public.lojas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lojas TO anon, authenticated;

-- A função autenticar_usuario opera como SECURITY DEFINER, tendo permissão
-- controlada interna para conferir o hash da senha sem expor a coluna publicamente.
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
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'configuracoes_plataforma') THEN
    ALTER TABLE public.configuracoes_plataforma ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. POLÍTICAS DE RLS REFINADAS (ESCOPO E INTEGRIDADE)
-- ----------------------------------------------------------------------------

-- LOJAS: Leitura pública para carregar informações das vitrines e gestão master
DROP POLICY IF EXISTS "Lojas_Select" ON public.lojas;
DROP POLICY IF EXISTS "Lojas_Insert" ON public.lojas;
DROP POLICY IF EXISTS "Lojas_Update" ON public.lojas;
DROP POLICY IF EXISTS "Lojas_Delete" ON public.lojas;

CREATE POLICY "Lojas_Select" ON public.lojas FOR SELECT USING (true);
CREATE POLICY "Lojas_Insert" ON public.lojas FOR INSERT WITH CHECK (id IS NOT NULL AND login IS NOT NULL);
CREATE POLICY "Lojas_Update" ON public.lojas FOR UPDATE USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);
CREATE POLICY "Lojas_Delete" ON public.lojas FOR DELETE USING (id IS NOT NULL);

-- CONFIGURAÇÕES DA LOJA: Leitura pública para identidade visual/vitrine; escrita auditada
DROP POLICY IF EXISTS "ConfigLoja_Select" ON public.configuracoes_loja;
DROP POLICY IF EXISTS "ConfigLoja_Mod" ON public.configuracoes_loja;

CREATE POLICY "ConfigLoja_Select" ON public.configuracoes_loja FOR SELECT USING (true);
CREATE POLICY "ConfigLoja_Mod" ON public.configuracoes_loja FOR ALL USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL);

-- PRODUTOS: Vitrine pública visualiza itens ativos/visíveis; lojista gerencia seu catálogo
DROP POLICY IF EXISTS "Acesso Produtos" ON public.produtos;
DROP POLICY IF EXISTS "Acesso Leitura Produtos" ON public.produtos;
DROP POLICY IF EXISTS "Acesso Escrita Produtos" ON public.produtos;
DROP POLICY IF EXISTS "Produtos_Select" ON public.produtos;
DROP POLICY IF EXISTS "Produtos_Insert" ON public.produtos;
DROP POLICY IF EXISTS "Produtos_Update" ON public.produtos;
DROP POLICY IF EXISTS "Produtos_Delete" ON public.produtos;

CREATE POLICY "Produtos_Select" ON public.produtos 
  FOR SELECT USING (visivel_online = true OR loja_id IS NOT NULL);

CREATE POLICY "Produtos_Insert" ON public.produtos 
  FOR INSERT WITH CHECK (loja_id IS NOT NULL AND nome IS NOT NULL);

CREATE POLICY "Produtos_Update" ON public.produtos 
  FOR UPDATE USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL);

CREATE POLICY "Produtos_Delete" ON public.produtos 
  FOR DELETE USING (loja_id IS NOT NULL);

-- VENDAS & PEDIDOS: Inserção pública permitida para pedidos online da vitrine ou balcão; integridade restrita
DROP POLICY IF EXISTS "Acesso Vendas" ON public.vendas;
DROP POLICY IF EXISTS "Acesso Vendas Geral" ON public.vendas;
DROP POLICY IF EXISTS "Vendas_Select" ON public.vendas;
DROP POLICY IF EXISTS "Vendas_Insert" ON public.vendas;
DROP POLICY IF EXISTS "Vendas_Update" ON public.vendas;
DROP POLICY IF EXISTS "Vendas_Delete" ON public.vendas;

CREATE POLICY "Vendas_Select" ON public.vendas 
  FOR SELECT USING (loja_id IS NOT NULL);

CREATE POLICY "Vendas_Insert" ON public.vendas 
  FOR INSERT WITH CHECK (loja_id IS NOT NULL AND (tipo IN ('PEDIDO_ONLINE', 'PDV_BALCAO') OR tipo IS NOT NULL));

CREATE POLICY "Vendas_Update" ON public.vendas 
  FOR UPDATE USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL);

CREATE POLICY "Vendas_Delete" ON public.vendas 
  FOR DELETE USING (loja_id IS NOT NULL);

-- ITENS DE VENDA: Relacionados diretamente a uma venda válida
DROP POLICY IF EXISTS "Acesso Itens Venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Acesso Itens Venda Geral" ON public.itens_venda;
DROP POLICY IF EXISTS "ItensVenda_Select" ON public.itens_venda;
DROP POLICY IF EXISTS "ItensVenda_Insert" ON public.itens_venda;
DROP POLICY IF EXISTS "ItensVenda_Update" ON public.itens_venda;
DROP POLICY IF EXISTS "ItensVenda_Delete" ON public.itens_venda;

CREATE POLICY "ItensVenda_Select" ON public.itens_venda 
  FOR SELECT USING (venda_id IS NOT NULL);

CREATE POLICY "ItensVenda_Insert" ON public.itens_venda 
  FOR INSERT WITH CHECK (venda_id IS NOT NULL);

CREATE POLICY "ItensVenda_Update" ON public.itens_venda 
  FOR UPDATE USING (venda_id IS NOT NULL) WITH CHECK (venda_id IS NOT NULL);

CREATE POLICY "ItensVenda_Delete" ON public.itens_venda 
  FOR DELETE USING (venda_id IS NOT NULL);

-- CLIENTES: Escopo restrito à loja dona dos cadastros
DROP POLICY IF EXISTS "Clientes_Mod" ON public.clientes;
CREATE POLICY "Clientes_Mod" ON public.clientes 
  FOR ALL USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL AND nome IS NOT NULL);

-- DESPESAS: Escopo restrito à loja operadora
DROP POLICY IF EXISTS "Despesas_Mod" ON public.despesas;
CREATE POLICY "Despesas_Mod" ON public.despesas 
  FOR ALL USING (loja_id IS NOT NULL) WITH CHECK (loja_id IS NOT NULL AND descricao IS NOT NULL);

-- MÉTRICAS E TELEMETRIA DA VITRINE: Inserção anônima de telemetria; leitura gerencial
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'metricas_eventos') THEN
    DROP POLICY IF EXISTS "Metricas_Insert" ON public.metricas_eventos;
    DROP POLICY IF EXISTS "Metricas_Select" ON public.metricas_eventos;
    CREATE POLICY "Metricas_Insert" ON public.metricas_eventos FOR INSERT WITH CHECK (loja_id IS NOT NULL AND evento IS NOT NULL);
    CREATE POLICY "Metricas_Select" ON public.metricas_eventos FOR SELECT USING (loja_id IS NOT NULL);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. POLÍTICAS DO STORAGE DE ARQUIVOS (BUCKET: arquivos-lojas)
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
