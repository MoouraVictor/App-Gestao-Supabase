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

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatarMoeda(valor: unknown): string {
  const num = Number(valor) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataHora(iso?: string | null): string {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return new Date().toLocaleString('pt-BR');
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ status: 'erro', mensagem: 'Método não permitido.' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const body = await req.json();
    const evento = String(body.evento || '').toUpperCase();
    const lojaId = String(body.lojaId || '').trim();

    if (!lojaId || !evento) {
      return jsonResponse({ status: 'erro', mensagem: 'Parâmetros lojaId e evento são obrigatórios.' }, 400);
    }

    // Ações internas da loja exigem JWT autenticado da respectiva loja (ou Master)
    if (evento !== 'PEDIDO_ONLINE') {
      const authHeader = req.headers.get('Authorization') || '';
      const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!jwt) return jsonResponse({ status: 'erro', mensagem: 'Não autorizado.' }, 401);

      const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
      const role = String(userData?.user?.app_metadata?.app_role || '');
      const userLojaId = String(userData?.user?.app_metadata?.loja_id || '');
      if (userErr || !userData?.user || (role !== 'MASTER' && userLojaId !== lojaId)) {
        return jsonResponse({ status: 'erro', mensagem: 'Não autorizado para esta loja.' }, 403);
      }
    }

    const [{ data: loja }, { data: conf }] = await Promise.all([
      supabaseAdmin.from('lojas').select('id, nome_loja').eq('id', lojaId).maybeSingle(),
      supabaseAdmin.from('configuracoes_loja').select('*').eq('loja_id', lojaId).maybeSingle(),
    ]);

    if (!loja) return jsonResponse({ status: 'erro', mensagem: 'Loja não encontrada.' }, 404);

    const nomeLoja = escapeHtml(loja.nome_loja || 'Minha Loja');
    const chatIdEfetivo =
      evento === 'TESTE_CONEXAO' && body.chatId
        ? String(body.chatId).trim()
        : String(conf?.telegram_chat_id || '').trim();

    if (evento !== 'TESTE_CONEXAO') {
      if (!conf?.telegram_ativo || !chatIdEfetivo) {
        return jsonResponse({ status: 'ignorado', mensagem: 'Telegram desativado ou sem Chat ID.' });
      }
      if (evento === 'PEDIDO_ONLINE' && conf.telegram_notif_online === false) {
        return jsonResponse({ status: 'ignorado', mensagem: 'Notificação de pedido online desativada.' });
      }
      if (evento === 'VENDA_PDV' && conf.telegram_notif_pdv === false) {
        return jsonResponse({ status: 'ignorado', mensagem: 'Notificação de venda PDV desativada.' });
      }
      if (evento === 'CANCELAMENTO' && conf.telegram_notif_cancelamento === false) {
        return jsonResponse({ status: 'ignorado', mensagem: 'Notificação de cancelamento desativada.' });
      }
    } else if (!chatIdEfetivo) {
      return jsonResponse({ status: 'erro', mensagem: 'Chat ID não informado.' }, 400);
    }

    // Resolve o token estritamente no servidor (nunca retornado ao cliente)
    let tokenFinal = '';
    if (evento === 'TESTE_CONEXAO' && typeof body.tokenCustom === 'string') {
      const cand = body.tokenCustom.trim();
      if (cand && !cand.includes('••••')) tokenFinal = cand;
    }
    if (!tokenFinal && conf?.telegram_bot_token_custom) {
      tokenFinal = String(conf.telegram_bot_token_custom).trim();
    }
    if (!tokenFinal) {
      tokenFinal = (Deno.env.get('TELEGRAM_CENTRAL_BOT_TOKEN') || '').trim();
    }
    if (!tokenFinal) {
      const { data: plat } = await supabaseAdmin
        .from('configuracoes_plataforma')
        .select('valor')
        .eq('chave', 'telegram_bot_token')
        .maybeSingle();
      if (plat?.valor) tokenFinal = String(plat.valor).trim();
    }

    if (!tokenFinal) {
      return jsonResponse({ status: 'erro', mensagem: 'Nenhum token do Bot do Telegram configurado no servidor.' }, 400);
    }

    let textoHtml = '';

    if (evento === 'PEDIDO_ONLINE') {
      const pedidoId = String(body.pedidoId || '').trim();
      if (!pedidoId) return jsonResponse({ status: 'erro', mensagem: 'pedidoId obrigatório.' }, 400);

      // Bloqueia reenvio repetido (anti-spam): marca telegram_notificado = true atomicamente
      const { data: pedidoDb, error: errPed } = await supabaseAdmin
        .from('vendas')
        .update({ telegram_notificado: true })
        .eq('id', pedidoId)
        .eq('loja_id', lojaId)
        .eq('tipo', 'PEDIDO_ONLINE')
        .eq('telegram_notificado', false)
        .select('*')
        .maybeSingle();

      if (errPed || !pedidoDb) {
        return jsonResponse({ status: 'ignorado', mensagem: 'Pedido já notificado ou inválido.' });
      }

      const criadoEm = new Date(pedidoDb.created_at).getTime();
      if (Number.isFinite(criadoEm) && Date.now() - criadoEm > 15 * 60 * 1000) {
        return jsonResponse({ status: 'ignorado', mensagem: 'Janela de notificação expirada.' });
      }

      const { data: itensDb } = await supabaseAdmin
        .from('itens_venda')
        .select('*')
        .eq('venda_id', pedidoId)
        .eq('loja_id', lojaId);

      const taxa = Number(pedidoDb.taxa_entrega) || 0;
      const total = Number(pedidoDb.total_liquido) || 0;
      const parcelas = Number(pedidoDb.parcelas) || 1;
      const condicao = parcelas > 1 ? `${parcelas}x de ${formatarMoeda(total / parcelas)}` : 'À Vista';
      const modalidade = escapeHtml(pedidoDb.modalidade_entrega || 'Retirada');
      const endereco = escapeHtml(pedidoDb.endereco_entrega || '');

      textoHtml = `🛍️ <b>NOVO PEDIDO ONLINE - ${nomeLoja.toUpperCase()}</b>\n`;
      textoHtml += `🆔 <b>Pedido:</b> #${escapeHtml(pedidoDb.id)}\n`;
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      textoHtml += `👤 <b>Cliente:</b> ${escapeHtml(pedidoDb.cliente_nome || 'Cliente')}\n`;
      textoHtml += `📱 <b>WhatsApp:</b> ${escapeHtml(pedidoDb.cliente_telefone || '')}\n`;
      textoHtml += `🛵 <b>Modalidade:</b> ${modalidade}\n`;
      if (modalidade === 'Delivery' && endereco) textoHtml += `📍 <b>Endereço:</b> ${endereco}\n`;
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      textoHtml += `📦 <b>ITENS DO PEDIDO:</b>\n`;
      (itensDb || []).forEach((it) => {
        const varTxt = it.variacao ? ` (${escapeHtml(it.variacao)})` : '';
        textoHtml += `• ${Number(it.quantidade) || 1}x ${escapeHtml(it.produto_nome || 'Item')}${varTxt} - ${formatarMoeda(it.subtotal)}\n`;
      });
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      if (taxa > 0) textoHtml += `🛵 <b>Taxa de Entrega:</b> ${formatarMoeda(taxa)}\n`;
      textoHtml += `💰 <b>TOTAL:</b> ${formatarMoeda(total)}\n`;
      textoHtml += `💳 <b>Pagamento:</b> ${escapeHtml(pedidoDb.forma_pagamento || 'Pix')} (${condicao})\n`;
      textoHtml += `⏰ <i>${formatarDataHora(pedidoDb.created_at)}</i>\n\n`;
      textoHtml += `👉 <i>Gerado pelo Catálogo Gestão Multi-lojas e E-Commerce</i>`;
    } else if (evento === 'VENDA_PDV') {
      const venda = body.venda || {};
      const condicao = escapeHtml(venda.condicaoPagamento || 'À Vista');
      const parcelas = Number(venda.parcelas) || 1;
      const totalBruto = Number(venda.totalBruto) || 0;
      const desconto = Number(venda.desconto) || 0;
      const totalLiq = Number(venda.totalLiquido) || 0;
      const saldoDev = Number(venda.saldoDevedor) || 0;

      textoHtml = `⚡ <b>NOVA VENDA NO BALCÃO (PDV) - ${nomeLoja.toUpperCase()}</b>\n`;
      textoHtml += `🆔 <b>Venda:</b> #${escapeHtml(venda.id || '')}\n`;
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      textoHtml += `👤 <b>Cliente:</b> ${escapeHtml(venda.clienteNome || 'Consumidor Final')}\n`;
      textoHtml += `💳 <b>Condição:</b> ${condicao}${condicao === 'A Prazo' && parcelas > 1 ? ` (${parcelas}x)` : ''}\n`;
      if (desconto > 0) {
        textoHtml += `🏷️ <b>Subtotal:</b> ${formatarMoeda(totalBruto)}\n`;
        textoHtml += `✂️ <b>Desconto:</b> -${formatarMoeda(desconto)}\n`;
      }
      textoHtml += `💰 <b>VALOR FINAL:</b> ${formatarMoeda(totalLiq)}\n`;
      if (saldoDev > 0) textoHtml += `⏳ <b>Saldo Devedor (A Receber):</b> ${formatarMoeda(saldoDev)}\n`;
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      textoHtml += `📦 <b>ITENS VENDIDOS:</b>\n`;
      (venda.itens || []).forEach((it: Record<string, unknown>) => {
        const qtd = Number(it.quantidade) || 1;
        const sub = Number(it.subtotal ?? (Number(it.precoVendaUnitario) || 0) * qtd) || 0;
        const varTxt = it.variacao ? ` (${escapeHtml(it.variacao)})` : '';
        textoHtml += `• ${qtd}x ${escapeHtml(it.nome || 'Item')}${varTxt} - ${formatarMoeda(sub)}\n`;
      });
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      textoHtml += `⏰ <i>${formatarDataHora(venda.dataHora)}</i>\n\n`;
      textoHtml += `👉 <i>Registrado no PDV Gestão Multi-lojas e E-Commerce</i>`;
    } else if (evento === 'CANCELAMENTO') {
      const venda = body.venda || {};
      const motivo = escapeHtml(body.motivo || 'Cancelamento solicitado pelo lojista');
      textoHtml = `⚠️ <b>VENDA CANCELADA - ${nomeLoja.toUpperCase()}</b>\n`;
      textoHtml += `🆔 <b>Venda/Pedido:</b> #${escapeHtml(venda.id || '')}\n`;
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      textoHtml += `👤 <b>Cliente:</b> ${escapeHtml(venda.clienteNome || 'Consumidor')}\n`;
      textoHtml += `💰 <b>Valor Estornado:</b> ${formatarMoeda(venda.totalLiquido)}\n`;
      textoHtml += `📦 <b>Itens Devolvidos ao Estoque:</b> Sim\n`;
      textoHtml += `📝 <b>Motivo:</b> ${motivo}\n`;
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      textoHtml += `⏰ <i>${formatarDataHora(venda.dataCancelamento)}</i>`;
    } else if (evento === 'TESTE_CONEXAO') {
      textoHtml = `🔔 <b>TESTE DE CONEXÃO - GESTÃO MULTI-LOJAS E E-COMMERCE</b>\n`;
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      textoHtml += `Olá! Esta é uma notificação de teste da sua loja <b>${nomeLoja}</b>.\n\n`;
      textoHtml += `✅ <b>Status:</b> O sistema de notificações automáticas via Telegram está configurado e pronto para o envio instantâneo!\n`;
      textoHtml += `━━━━━━━━━━━━━━━━━━━━━\n`;
      textoHtml += `⏰ <i>${formatarDataHora()}</i>`;
    } else {
      return jsonResponse({ status: 'erro', mensagem: 'Evento desconhecido.' }, 400);
    }

    const resp = await fetch(`https://api.telegram.org/bot${tokenFinal}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatIdEfetivo,
        text: textoHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const tgData = await resp.json();
    if (tgData && tgData.ok) return jsonResponse({ status: 'sucesso' });

    return jsonResponse({
      status: 'erro',
      mensagem: tgData?.description || 'Erro retornado pela API do Telegram.',
      errorCode: tgData?.error_code,
    }, 400);
  } catch (err) {
    console.error('[telegram-notify] Erro:', err);
    return jsonResponse({ status: 'erro', mensagem: 'Erro interno ao enviar notificação.' }, 500);
  }
});
