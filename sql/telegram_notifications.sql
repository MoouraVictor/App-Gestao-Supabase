-- ==============================================================================
-- MIGRAÇÃO SUPABASE: NOTIFICAÇÕES AUTOMÁTICAS VIA TELEGRAM
-- Execute este script no SQL Editor do painel do Supabase
-- ==============================================================================

-- 1. Adiciona as colunas de configuração do Telegram na tabela configuracoes_loja
ALTER TABLE public.configuracoes_loja 
ADD COLUMN IF NOT EXISTS telegram_ativo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS telegram_notif_online BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS telegram_notif_pdv BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS telegram_notif_cancelamento BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS telegram_bot_token_custom TEXT DEFAULT '';

-- 2. Atualiza comentários das colunas para documentação no banco
COMMENT ON COLUMN public.configuracoes_loja.telegram_ativo IS 'Habilita envio automático de notificações de vendas no Telegram';
COMMENT ON COLUMN public.configuracoes_loja.telegram_chat_id IS 'Chat ID numérico do lojista no Telegram (ex: 123456789)';
COMMENT ON COLUMN public.configuracoes_loja.telegram_notif_online IS 'Notifica novos pedidos da vitrine online no Telegram';
COMMENT ON COLUMN public.configuracoes_loja.telegram_notif_pdv IS 'Notifica novas vendas concluídas no PDV/balcão no Telegram';
COMMENT ON COLUMN public.configuracoes_loja.telegram_notif_cancelamento IS 'Notifica estornos e cancelamentos de vendas no Telegram';
COMMENT ON COLUMN public.configuracoes_loja.telegram_bot_token_custom IS 'Token customizado opcional do bot próprio do lojista (BotFather)';
