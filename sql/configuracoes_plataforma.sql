-- ============================================================================
-- GESTÃO MULTI-LOJAS E E-COMMERCE — CONFIGURAÇÕES GLOBAIS DA PLATAFORMA
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- Versão: 5.0.0 (Blindagem de Segredos Server-Side / Zero Acesso Anônimo)
-- ============================================================================

-- 1. TABELA DE CONFIGURAÇÕES GLOBAIS (BOT CENTRAL & CREDENCIAIS DA PLATAFORMA)
CREATE TABLE IF NOT EXISTS public.configuracoes_plataforma (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) E BLOQUEIO TOTAL DE ACESSO DIRETO
ALTER TABLE public.configuracoes_plataforma ENABLE ROW LEVEL SECURITY;

-- Remove quaisquer políticas permissivas anteriores
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'configuracoes_plataforma'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.configuracoes_plataforma;', r.policyname);
  END LOOP;
END $$;

-- NENHUM acesso direto via REST/SDK para anon ou authenticated:
-- Somente Edge Functions (usando service_role) e funções SECURITY DEFINER autorizadas acessam esta tabela.
REVOKE ALL ON public.configuracoes_plataforma FROM PUBLIC, anon, authenticated;

CREATE POLICY "Bloqueio Total Acesso Direto Plataforma" ON public.configuracoes_plataforma
  FOR ALL USING (false) WITH CHECK (false);

-- 3. FUNÇÃO SEGURA PARA LER APENAS O USERNAME PÚBLICO DO BOT CENTRAL (SEM TOKEN!)
CREATE OR REPLACE FUNCTION public.obter_username_bot_central()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user TEXT;
BEGIN
  SELECT valor INTO v_user
  FROM public.configuracoes_plataforma
  WHERE chave = 'telegram_bot_username'
  LIMIT 1;
  RETURN COALESCE(NULLIF(TRIM(v_user), ''), 'GestaoNotificaBot');
END;
$$;

REVOKE ALL ON FUNCTION public.obter_username_bot_central() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obter_username_bot_central() TO anon, authenticated;

-- 4. INICIALIZAÇÃO SEGURA (SEM TOKENS REAIS VERSIONADOS NO GIT)
-- IMPORTANTE:
-- - Defina o novo token do Bot do Telegram pelo Painel Master (após login como admin)
--   ou via Secret TELEGRAM_CENTRAL_BOT_TOKEN nas Edge Functions do Supabase.
-- - Defina a senha do Administrador Master via Secret MASTER_PASSWORD no Supabase
--   ou atualizando a chave 'master_password_hash' diretamente no SQL Editor (com sha256).
INSERT INTO public.configuracoes_plataforma (chave, valor)
VALUES ('telegram_bot_username', 'GestaoNotificaBot')
ON CONFLICT (chave) DO NOTHING;

-- Caso tenha inserido o token antigo comprometido antes, remova-o imediatamente até cadastrar o novo:
-- DELETE FROM public.configuracoes_plataforma WHERE chave = 'telegram_bot_token' AND valor = 'TOKEN_ANTIGO_REVOGADO';
