-- ============================================================================
-- GESTÃO MULTI-LOJAS E E-COMMERCE — CONFIGURAÇÕES GLOBAIS DA PLATAFORMA
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ============================================================================

-- 1. TABELA DE CONFIGURAÇÕES GLOBAIS (BOT CENTRAL, PREFERÊNCIAS DA PLATAFORMA)
CREATE TABLE IF NOT EXISTS public.configuracoes_plataforma (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS)
ALTER TABLE public.configuracoes_plataforma ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACESSO
DROP POLICY IF EXISTS "Leitura Publica Configuracoes Plataforma" ON public.configuracoes_plataforma;
CREATE POLICY "Leitura Publica Configuracoes Plataforma" ON public.configuracoes_plataforma 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gerenciamento Configuracoes Plataforma" ON public.configuracoes_plataforma;
CREATE POLICY "Gerenciamento Configuracoes Plataforma" ON public.configuracoes_plataforma 
  FOR ALL USING (true) WITH CHECK (true);

-- 4. INICIALIZAÇÃO DO BOT CENTRAL DA PLATAFORMA (@GestaoNotificaBot)
INSERT INTO public.configuracoes_plataforma (chave, valor)
VALUES 
  ('telegram_bot_username', 'GestaoNotificaBot'),
  ('telegram_bot_token', '9175360809:AAHI0erCLxCck2OCA15jPdG71SRZ8CDTPco')
ON CONFLICT (chave) DO UPDATE SET 
  valor = EXCLUDED.valor, 
  updated_at = NOW();
