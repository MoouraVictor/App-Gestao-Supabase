-- ============================================================================
-- CLARA GESTÃO — BLINDAGEM DE SEGURANÇA POSTGRESQL / SUPABASE
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ============================================================================

-- 1. PROTEÇÃO CONTRA VAZAMENTO DA COLUNA DE SENHA (senha_hash)
-- Impede que consultas abertas (via chave anônima/pública do frontend)
-- tenham acesso à coluna senha_hash na tabela de lojas.
REVOKE ALL ON public.lojas FROM anon, authenticated;
GRANT SELECT (id, nome_loja, login, nome_responsavel, whatsapp, status, created_at, updated_at) ON public.lojas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lojas TO anon, authenticated;

-- 2. GARANTIA DE QUE A AUTENTICAÇÃO CONTINUA FUNCIONANDO
-- A função autenticar_usuario é SECURITY DEFINER, logo ela tem permissão interna
-- total para validar a senha sem expor a coluna publicamente.
GRANT EXECUTE ON FUNCTION public.autenticar_usuario(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 3. POLÍTICAS DE ROW LEVEL SECURITY (RLS) PARA PRODUTOS E VITRINE
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso Produtos" ON public.produtos;
CREATE POLICY "Acesso Leitura Produtos" ON public.produtos FOR SELECT USING (true);
CREATE POLICY "Acesso Escrita Produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);

-- 4. POLÍTICAS DE RLS PARA PEDIDOS E VENDAS
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso Vendas" ON public.vendas;
CREATE POLICY "Acesso Vendas Geral" ON public.vendas FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso Itens Venda" ON public.itens_venda;
CREATE POLICY "Acesso Itens Venda Geral" ON public.itens_venda FOR ALL USING (true) WITH CHECK (true);

-- 5. POLÍTICAS DO STORAGE DE ARQUIVOS (BUCKET: arquivos-lojas)
DROP POLICY IF EXISTS "Leitura Publica Midia" ON storage.objects;
CREATE POLICY "Leitura Publica Midia" ON storage.objects FOR SELECT USING (bucket_id = 'arquivos-lojas');

DROP POLICY IF EXISTS "Upload Midia" ON storage.objects;
CREATE POLICY "Upload Midia" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'arquivos-lojas');

DROP POLICY IF EXISTS "Gerenciamento Midia" ON storage.objects;
CREATE POLICY "Gerenciamento Midia" ON storage.objects FOR ALL USING (bucket_id = 'arquivos-lojas');
