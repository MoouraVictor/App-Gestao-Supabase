import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function sha256Hex(text: string): Promise<string> {
  if (!text) return '';
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ status: 'erro', mensagem: 'Método não permitido.' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!jwt) return jsonResponse({ status: 'erro', mensagem: 'Não autenticado.' }, 401);

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user || userData.user.app_metadata?.app_role !== 'MASTER') {
      return jsonResponse({ status: 'erro', mensagem: 'Acesso restrito ao Administrador Master.' }, 403);
    }

    const body = await req.json();
    const action = String(body.action || '');
    const payload = body.payload || {};

    if (action === 'getConfigPlataforma') {
      const { data, error } = await supabaseAdmin.from('configuracoes_plataforma').select('chave, valor');
      if (error) throw error;

      let username = Deno.env.get('TELEGRAM_CENTRAL_BOT_USERNAME') || 'GestaoNotificaBot';
      let hasToken = Boolean(Deno.env.get('TELEGRAM_CENTRAL_BOT_TOKEN'));

      (data || []).forEach((row) => {
        if (row.chave === 'telegram_bot_username' && row.valor) username = row.valor;
        if (row.chave === 'telegram_bot_token' && row.valor && row.valor.trim()) hasToken = true;
      });

      return jsonResponse({
        status: 'sucesso',
        telegramBotUsername: username,
        telegramTokenConfigured: hasToken,
      });
    }

    if (action === 'salvarConfigPlataforma') {
      const rows: { chave: string; valor: string }[] = [];
      if (typeof payload.username === 'string') {
        rows.push({
          chave: 'telegram_bot_username',
          valor: payload.username.trim().replace(/^@/, ''),
        });
      }
      if (typeof payload.token === 'string') {
        const cleanTok = payload.token.trim();
        if (cleanTok && !cleanTok.includes('••••')) {
          rows.push({ chave: 'telegram_bot_token', valor: cleanTok });
        }
      }
      if (typeof payload.novaSenhaMaster === 'string' && payload.novaSenhaMaster.trim()) {
        rows.push({ chave: 'master_password_hash', valor: await sha256Hex(payload.novaSenhaMaster.trim()) });
      }

      if (rows.length > 0) {
        const { error } = await supabaseAdmin.from('configuracoes_plataforma').upsert(rows);
        if (error) throw error;
      }
      return jsonResponse({ status: 'sucesso' });
    }

    if (action === 'criarLoja') {
      const dados = payload.dadosLoja || {};
      const lojaId = String(dados.id || '').trim() || `LOJA-${Math.floor(100000 + Math.random() * 900000)}`;
      const senhaLimpa = String(dados.senha || '').trim();
      if (!dados.nomeLoja || !dados.login || !senhaLimpa) {
        return jsonResponse({ status: 'erro', mensagem: 'Nome da loja, login e senha são obrigatórios.' }, 400);
      }

      const senhaHash = /^[a-f0-9]{64}$/i.test(senhaLimpa)
        ? senhaLimpa.toLowerCase()
        : await sha256Hex(senhaLimpa);

      const { error: errL } = await supabaseAdmin.from('lojas').insert({
        id: lojaId,
        nome_loja: dados.nomeLoja,
        login: String(dados.login).trim().toLowerCase(),
        senha_hash: senhaHash,
        nome_responsavel: dados.nomeResponsavel || '',
        whatsapp: dados.whatsapp || '',
        status: dados.status || 'Ativa',
      });
      if (errL) throw errL;

      const { error: errC } = await supabaseAdmin.from('configuracoes_loja').insert({
        loja_id: lojaId,
        slogan: dados.slogan || 'Os melhores produtos com as melhores condições',
        cor_primaria: dados.corPrimaria || '#2563EB',
        cor_destaque: dados.corDestaque || '#EF4444',
        cor_menu: dados.corMenu || '#0F172A',
        cor_fundo: dados.corFundo || '#F8FAFC',
      });
      if (errC) throw errC;

      return jsonResponse({ status: 'sucesso', lojaId });
    }

    if (action === 'atualizarLojaMaster') {
      const lojaId = String(payload.lojaId || '').trim();
      const dados = payload.dados || {};
      if (!lojaId) return jsonResponse({ status: 'erro', mensagem: 'lojaId obrigatório.' }, 400);

      const updatePayload: Record<string, unknown> = {};
      if (dados.nomeLoja !== undefined) updatePayload.nome_loja = dados.nomeLoja;
      if (dados.login !== undefined) updatePayload.login = String(dados.login).trim().toLowerCase();
      if (dados.nomeResponsavel !== undefined) updatePayload.nome_responsavel = dados.nomeResponsavel;
      if (dados.whatsapp !== undefined) updatePayload.whatsapp = dados.whatsapp;
      if (dados.status !== undefined) updatePayload.status = dados.status;
      if (typeof dados.senha === 'string' && dados.senha.trim() && !dados.senha.includes('••••')) {
        const s = dados.senha.trim();
        updatePayload.senha_hash = /^[a-f0-9]{64}$/i.test(s) ? s.toLowerCase() : await sha256Hex(s);
      }

      const { error } = await supabaseAdmin.from('lojas').update(updatePayload).eq('id', lojaId);
      if (error) throw error;
      return jsonResponse({ status: 'sucesso' });
    }

    if (action === 'excluirLoja') {
      const lojaId = String(payload.lojaId || '').trim();
      if (!lojaId) return jsonResponse({ status: 'erro', mensagem: 'lojaId obrigatório.' }, 400);

      const { error } = await supabaseAdmin.from('lojas').delete().eq('id', lojaId);
      if (error) throw error;

      const emailSlug = lojaId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const targetEmail = `loja-${emailSlug}@auth.internal`;
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const userObj = listData?.users?.find((u) => (u.email || '').toLowerCase() === targetEmail);
      if (userObj) await supabaseAdmin.auth.admin.deleteUser(userObj.id);

      return jsonResponse({ status: 'sucesso' });
    }

    return jsonResponse({ status: 'erro', mensagem: 'Ação inválida.' }, 400);
  } catch (err) {
    console.error('[master-admin] Erro:', err);
    return jsonResponse({
      status: 'erro',
      mensagem: err instanceof Error ? err.message : 'Erro interno administrativo.',
    }, 500);
  }
});
