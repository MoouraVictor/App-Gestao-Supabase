import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

async function deriveShadowPassword(serviceKey: string, accountKey: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(serviceKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`shadow-auth:${accountKey}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `S!${hex.slice(0, 40)}a9`;
}

async function ensureAuthSession(
  supabaseAdmin: SupabaseClient,
  supabaseAnon: SupabaseClient,
  serviceKey: string,
  email: string,
  appMetadata: { app_role: string; loja_id: string | null }
) {
  const password = await deriveShadowPassword(serviceKey, email);

  const signIn1 = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (!signIn1.error && signIn1.data.session && signIn1.data.user) {
    const curMeta = signIn1.data.user.app_metadata || {};
    if (curMeta.app_role === appMetadata.app_role && (curMeta.loja_id ?? null) === appMetadata.loja_id) {
      return signIn1.data.session;
    }
    await supabaseAdmin.auth.admin.updateUserById(signIn1.data.user.id, { app_metadata: appMetadata });
    const refreshed = await supabaseAnon.auth.signInWithPassword({ email, password });
    return refreshed.data.session;
  }

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
  });

  if (created.error) {
    let page = 1;
    let foundUserId: string | null = null;
    while (page <= 10 && !foundUserId) {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      const match = listData?.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
      if (match) {
        foundUserId = match.id;
        break;
      }
      if (!listData?.users || listData.users.length < 100) break;
      page++;
    }
    if (!foundUserId) throw created.error;
    await supabaseAdmin.auth.admin.updateUserById(foundUserId, {
      password,
      email_confirm: true,
      app_metadata: appMetadata,
    });
  }

  const signIn2 = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (signIn2.error || !signIn2.data.session) {
    throw signIn2.error || new Error('Falha ao emitir sessão JWT autenticada.');
  }
  return signIn2.data.session;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ status: 'erro', mensagem: 'Método não permitido.' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabaseAdmin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const supabaseAnon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const body = await req.json();
    const uNorm = String(body.usuario || '').trim().toLowerCase();
    const sRaw = String(body.senha || '').trim();
    const sHashIn = String(body.senhaHash || '').trim().toLowerCase();

    if (!uNorm || (!sRaw && !sHashIn)) {
      return jsonResponse({ status: 'erro', mensagem: 'Usuário e senha são obrigatórios.' }, 400);
    }

    const sHash = /^[a-f0-9]{64}$/.test(sHashIn) ? sHashIn : await sha256Hex(sRaw);

    // 1. Autenticação do Administrador Master (via Secret ou configuracoes_plataforma bloqueada)
    if (uNorm === 'admin') {
      let masterHashValid = '';
      const envHash = (Deno.env.get('MASTER_PASSWORD_HASH') || '').trim().toLowerCase();
      const envPlain = (Deno.env.get('MASTER_PASSWORD') || '').trim();

      if (envHash) {
        masterHashValid = envHash;
      } else if (envPlain) {
        masterHashValid = await sha256Hex(envPlain);
      } else {
        const { data: cfgRow } = await supabaseAdmin
          .from('configuracoes_plataforma')
          .select('valor')
          .eq('chave', 'master_password_hash')
          .maybeSingle();
        if (cfgRow?.valor) masterHashValid = String(cfgRow.valor).trim().toLowerCase();
      }

      if (!masterHashValid) {
        return jsonResponse({
          status: 'erro',
          mensagem: 'Senha Master ainda não configurada no servidor (Secret MASTER_PASSWORD ou configuracoes_plataforma).',
        }, 403);
      }

      const masterMatches =
        sHash === masterHashValid ||
        (sRaw !== '' && (await sha256Hex(sRaw)) === masterHashValid) ||
        (sRaw !== '' && sRaw === masterHashValid);

      if (masterMatches) {
        const session = await ensureAuthSession(supabaseAdmin, supabaseAnon, serviceKey, 'master@auth.internal', {
          app_role: 'MASTER',
          loja_id: null,
        });
        return jsonResponse({
          status: 'sucesso',
          perfil: 'MASTER',
          usuario: { login: 'admin', nome: 'Super Administrador' },
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          },
        });
      }

      return jsonResponse({ status: 'erro', mensagem: 'Usuário ou senha inválidos.' }, 401);
    }

    // 2. Autenticação de Lojista
    const { data: lojasList, error: errLojas } = await supabaseAdmin
      .from('lojas')
      .select('id, nome_loja, login, senha_hash, nome_responsavel, whatsapp, status')
      .ilike('login', uNorm);

    if (errLojas) throw errLojas;

    const loja = (lojasList || []).find((l) => String(l.login || '').trim().toLowerCase() === uNorm);
    if (!loja) {
      return jsonResponse({ status: 'erro', mensagem: 'Usuário ou senha inválidos.' }, 401);
    }
    if (loja.status === 'Bloqueada') {
      return jsonResponse({
        status: 'erro',
        mensagem: 'Esta loja está temporariamente bloqueada. Contate o administrador.',
      }, 403);
    }

    const storedPass = String(loja.senha_hash || '').trim();
    const storedIsSha256 = /^[a-f0-9]{64}$/i.test(storedPass);
    const storedAsSha256 = storedIsSha256 ? storedPass.toLowerCase() : await sha256Hex(storedPass);

    const passwordMatches =
      storedPass !== '' && (sHash === storedAsSha256 || (sRaw !== '' && sRaw === storedPass));

    if (!passwordMatches) {
      return jsonResponse({ status: 'erro', mensagem: 'Usuário ou senha inválidos.' }, 401);
    }

    // Upgrade transparente de senhas antigas em texto puro para SHA-256
    if (!storedIsSha256 && storedAsSha256) {
      await supabaseAdmin.from('lojas').update({ senha_hash: storedAsSha256 }).eq('id', loja.id);
    }

    const emailSlug = String(loja.id).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const session = await ensureAuthSession(
      supabaseAdmin,
      supabaseAnon,
      serviceKey,
      `loja-${emailSlug}@auth.internal`,
      { app_role: 'LOJISTA', loja_id: loja.id }
    );

    return jsonResponse({
      status: 'sucesso',
      perfil: 'LOJISTA',
      loja: {
        id: loja.id,
        nomeLoja: loja.nome_loja,
        login: loja.login,
        nomeResponsavel: loja.nome_responsavel,
        whatsapp: loja.whatsapp,
        status: loja.status,
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      },
    });
  } catch (err) {
    console.error('[auth-login] Erro:', err);
    return jsonResponse({ status: 'erro', mensagem: 'Erro interno na autenticação.' }, 500);
  }
});
