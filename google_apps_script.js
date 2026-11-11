/**
 * ==============================================================================
 * CLARA GESTÃO - BACKEND MULTI-LOJAS (SAAS & E-COMMERCE) NO GOOGLE DRIVE
 * ==============================================================================
 * Arquitetura com Banco de Dados Individual por Loja:
 * 1. Planilha Master: Gerencia Lojas, Usuários, Senhas e IDs das Planilhas de cada loja.
 * 2. Planilhas Dedicadas: Cada loja criada ganha automaticamente um arquivo de
 *    planilha exclusivo no Google Drive com suas próprias abas de Estoque e Vendas.
 * 3. Loja Online Pública: Endpoint público para clientes finais consultarem catálogo,
 *    regras de parcelamento, taxa de entrega e realizarem pedidos via WhatsApp.
 * ==============================================================================
 */

const NOME_PASTA_SISTEMA = "APP_CLARA_SISTEMA";
const LOGIN_MASTER_PADRAO = "admin";
const SENHAS_MASTER_VALIDAS = ["admin123", "123", "admin"];

/**
 * Menu personalizado ao abrir a Planilha Master no Google Sheets
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📁 Clara Gestão")
    .addItem("Organizar Pastas no Drive", "menuOrganizarPastasDrive")
    .addItem("Executar Setup Inicial", "setupInicial")
    .addToUi();
}

function menuOrganizarPastasDrive() {
  const ui = SpreadsheetApp.getUi();
  try {
    const res = organizarEstruturaPastasDrive();
    ui.alert("✅ Organização Concluída!\n\n" + res.mensagem);
  } catch (err) {
    ui.alert("❌ Erro ao organizar pastas: " + err.toString());
  }
}

/**
 * Garante que a planilha Master esteja inicializada antes de processar requisições
 */
function garantirSetupMaster() {
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
  let abaLojas = ssMaster.getSheetByName("Lojas_Usuarios");
  if (!abaLojas) {
    setupInicial();
  }
}

/**
 * Endpoint GET: Teste de conexão, dados do Master, dados da Loja e Catálogo Público
 */
function doGet(e) {
  try {
    garantirSetupMaster();

    const params = e ? e.parameter : {};
    const acao = params.acao || "ping";

    if (acao === "ping") {
      const lojas = listarLojasMaster();
      return jsonResponse({
        status: "sucesso",
        mensagem: "Conexão com Google Drive ativa com sucesso!",
        timestamp: new Date().toISOString(),
        masterPronto: true,
        qtdLojas: lojas.length,
        nomePlanilhaMaster: SpreadsheetApp.getActiveSpreadsheet().getName()
      });
    }

    // Inicialização manual forçada via URL
    if (acao === "setup") {
      setupInicial();
      return jsonResponse({ status: "sucesso", mensagem: "Setup inicial executado com sucesso!" });
    }

    // Retorna dados públicos para a Loja Online do Cliente
    if (acao === "getLojaPublica") {
      const lojaId = params.lojaId || "";
      if (!lojaId) throw new Error("ID da loja não informado.");
      return jsonResponse(obterDadosLojaPublica(lojaId));
    }

    // Retorna dados privados do Painel do Lojista
    if (acao === "getDadosLoja") {
      const lojaId = params.lojaId || "";
      if (!lojaId) throw new Error("ID da loja não informado.");
      return jsonResponse(obterDadosPainelLojista(lojaId));
    }

    // Retorna lista de lojas para o Painel Master (com métricas consolidadas por loja)
    if (acao === "getDadosMaster") {
      return jsonResponse({
        status: "sucesso",
        dados: listarLojasMaster(true),
        timestamp: new Date().toISOString()
      });
    }

    // Organização de pastas do Google Drive
    if (acao === "organizarPastasDrive") {
      return jsonResponse(organizarEstruturaPastasDrive());
    }

    return jsonResponse({ status: "erro", mensagem: "Ação GET não reconhecida: " + acao });
  } catch (erro) {
    return jsonResponse({ status: "erro", mensagem: erro.toString() });
  }
}

/**
 * Endpoint POST: Login, criação de lojas (planilhas dedicadas), produtos e pedidos
 */
function doPost(e) {
  try {
    garantirSetupMaster();

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      throw new Error("Nenhum dado enviado no corpo da requisição.");
    }

    const acao = payload.acao;

    switch (acao) {
      // Autenticação (Master ou Lojista)
      case "login":
        return jsonResponse(autenticarUsuario(payload.usuario, payload.senha, payload.senhaHash));

      // Ações do Usuário Master
      case "criarLoja":
        return jsonResponse(criarNovaLojaComBancoDedicado(payload.dadosLoja));

      case "atualizarLojaMaster":
        return jsonResponse(atualizarLojaMaster(payload.lojaId, payload.dados));

      case "excluirLoja":
        return jsonResponse(excluirLojaMaster(payload.lojaId));

      case "organizarPastasDrive":
        return jsonResponse(organizarEstruturaPastasDrive());

      // Ações do Lojista (Customização da Marca)
      case "salvarConfiguracaoLoja":
        return jsonResponse(salvarConfiguracoesLoja(payload.lojaId, payload.config));

      // Ações de Produtos e Estoque (na planilha individual da loja)
      case "salvarProduto":
        return jsonResponse(salvarProdutoLoja(payload.lojaId, payload.produto));

      case "excluirProduto":
        return jsonResponse(excluirProdutoLoja(payload.lojaId, payload.id));

      // Ações de Clientes
      case "salvarCliente":
        return jsonResponse(salvarClienteLoja(payload.lojaId, payload.cliente));

      case "excluirCliente":
        return jsonResponse(excluirClienteLoja(payload.lojaId, payload.id));

      // Ações de Vendas / PDV e Baixas
      case "registrarVenda":
        return jsonResponse(registrarVendaLoja(payload.lojaId, payload.venda));

      case "registrarRecebimento":
        return jsonResponse(registrarRecebimentoLoja(payload.lojaId, payload.vendaId, payload.valorRecebido, payload.formaPagamento));

      case "atualizarStatusPedido":
        return jsonResponse(atualizarStatusPedidoLoja(payload.lojaId, payload.pedidoId, payload.novoStatus));

      case "cancelarVenda":
        return jsonResponse(cancelarVendaLoja(payload.lojaId, payload.vendaId, payload.motivo));

      // Ações de Despesas / Fluxo de Caixa Real
      case "salvarDespesa":
        return jsonResponse(salvarDespesaLoja(payload.lojaId, payload.despesa));

      case "excluirDespesa":
        return jsonResponse(excluirDespesaLoja(payload.lojaId, payload.id));

      // Caixa de Sugestões
      case "salvarSugestao":
        return jsonResponse(salvarSugestaoGlobal(payload.lojaId, payload.sugestao));

      default:
        return jsonResponse({ status: "erro", mensagem: "Ação POST desconhecida: " + acao });
    }
  } catch (erro) {
    return jsonResponse({ status: "erro", mensagem: erro.toString() });
  }
}

function jsonResponse(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// CONFIGURAÇÃO INICIAL (SETUP DO BANCO MASTER)
// ==============================================================================

function setupInicial() {
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Aba Lojas_Usuarios no Master
  criarAbaSeNaoExistir(ssMaster, "Lojas_Usuarios", [
    "ID", "Nome_Loja", "Login", "Senha", "Nome_Responsavel", "WhatsApp",
    "Spreadsheet_ID_Loja", "Status", "Data_Criacao"
  ]);

  // Se a aba estiver vazia (só com cabeçalho), insere a loja principal
  const abaLojas = ssMaster.getSheetByName("Lojas_Usuarios");
  if (abaLojas && abaLojas.getLastRow() <= 1) {
    abaLojas.appendRow([
      "LOJA-1", "Mary Variedades", "moda", "123", "Clara Designer",
      "(11) 98888-7777", "", "Ativa", new Date().toISOString()
    ]);
  }

  // 2. Aba Sugestoes_Globais
  criarAbaSeNaoExistir(ssMaster, "Sugestoes_Globais", [
    "ID", "Loja_ID", "Titulo", "Categoria", "Descricao", "Autor", "Data_Envio", "Status"
  ]);

  // 3. Pastas do Sistema no Google Drive e Estrutura Hierárquica
  try {
    obterPastaRaizSistema();
    organizarEstruturaPastasDrive();
  } catch (errDrive) {
    Logger.log("Aviso ao inicializar estrutura de pastas: " + errDrive);
  }

  // Alerta seguro (funciona no editor e não quebra em Web App)
  try {
    SpreadsheetApp.getUi().alert("✅ Banco de Dados Master configurado com sucesso! Estrutura de pastas organizada no Google Drive.");
  } catch (e) {
    Logger.log("Setup inicial concluído em modo sem UI.");
  }
}

function criarAbaSeNaoExistir(ss, nome, colunas) {
  let aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
    aba.appendRow(colunas);
    const cabecalho = aba.getRange(1, 1, 1, colunas.length);
    cabecalho.setBackground("#1E3A8A").setFontColor("#FFFFFF").setFontWeight("bold");
    aba.setFrozenRows(1);
  }
}

function obterOuCriarPasta(nome) {
  const pastas = DriveApp.getFoldersByName(nome);
  if (pastas.hasNext()) return pastas.next();
  return DriveApp.createFolder(nome);
}

// ==============================================================================
// GESTÃO HIERÁRQUICA DE PASTAS NO GOOGLE DRIVE (MULTI-TENANT ISOLADO)
// ==============================================================================

/**
 * Retorna (ou cria na raiz do Drive) a pasta principal do sistema APP_CLARA_SISTEMA
 * e assegura que a Planilha Master ativa esteja organizada dentro dela.
 */
function obterPastaRaizSistema() {
  let pastaRaiz;
  const pastas = DriveApp.getFoldersByName(NOME_PASTA_SISTEMA);
  if (pastas.hasNext()) {
    pastaRaiz = pastas.next();
  } else {
    pastaRaiz = DriveApp.createFolder(NOME_PASTA_SISTEMA);
  }

  // Garante que a planilha Master ativa fique dentro da pasta principal do sistema
  try {
    const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
    if (ssMaster) {
      const arqMaster = DriveApp.getFileById(ssMaster.getId());
      const pais = arqMaster.getParents();
      let jaEsta = false;
      while (pais.hasNext()) {
        if (pais.next().getId() === pastaRaiz.getId()) {
          jaEsta = true;
          break;
        }
      }
      if (!jaEsta) {
        arqMaster.moveTo(pastaRaiz);
      }
    }
  } catch (eMove) {
    Logger.log("Aviso ao mover Master para pasta raiz: " + eMove);
  }

  return pastaRaiz;
}

/**
 * Retorna (ou cria) a pasta dedicada de uma loja dentro de APP_CLARA_SISTEMA.
 * Formato padrão: "[LOJA-ID] Nome da Loja"
 */
function obterOuCriarPastaDaLoja(lojaId, nomeLoja) {
  const pastaRaiz = obterPastaRaizSistema();
  const idStr = String(lojaId || "").trim();
  const prefixo = "[" + idStr + "]";
  const nomePadrao = prefixo + " " + (nomeLoja || "Loja");

  // Procura subpasta existente com o prefixo da loja
  const subpastas = pastaRaiz.getFolders();
  while (subpastas.hasNext()) {
    const p = subpastas.next();
    const pNome = p.getName();
    if (pNome.indexOf(prefixo) === 0 || pNome === nomePadrao) {
      if (nomeLoja && pNome !== nomePadrao) {
        try { p.setName(nomePadrao); } catch (eRen) { }
      }
      return p;
    }
  }

  return pastaRaiz.createFolder(nomePadrao);
}

/**
 * Retorna (ou cria) a subpasta "Imagens" dentro da pasta da loja
 */
function obterOuCriarSubpastaImagensDaLoja(pastaLoja) {
  const subpastas = pastaLoja.getFoldersByName("Imagens");
  if (subpastas.hasNext()) {
    return subpastas.next();
  }
  return pastaLoja.createFolder("Imagens");
}

/**
 * Organiza e padroniza a arquitetura de pastas de todo o ecossistema no Drive:
 * 1. APP_CLARA_SISTEMA (Raiz Geral do Projeto)
 *    ├── GESTÃO MASTER (Planilha Central)
 *    ├── [LOJA-1] Mary Variedades
 *    │   ├── Banco de Dados - Mary Variedades (Planilha Dedicada)
 *    │   └── Imagens (Fotos de Produtos e Logo da Loja)
 */
function organizarEstruturaPastasDrive() {
  const pastaRaiz = obterPastaRaizSistema();
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
  const relatorio = {
    pastaRaizNome: pastaRaiz.getName(),
    pastaRaizId: pastaRaiz.getId(),
    masterMovida: false,
    lojas: []
  };

  // 1. Move Planilha Master para a pasta raiz se necessário
  try {
    const arqMaster = DriveApp.getFileById(ssMaster.getId());
    arqMaster.moveTo(pastaRaiz);
    relatorio.masterMovida = true;
  } catch (eM) {
    Logger.log("Master já organizada ou aviso: " + eM);
  }

  // 2. Itera sobre todas as lojas da aba Lojas_Usuarios
  const abaLojas = ssMaster.getSheetByName("Lojas_Usuarios");
  if (!abaLojas) {
    return { status: "erro", mensagem: "Aba Lojas_Usuarios não encontrada." };
  }

  const dados = abaLojas.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    const lojaId = String(dados[i][0] || "").trim();
    const nomeLoja = String(dados[i][1] || "").trim();
    const sheetId = String(dados[i][6] || "").trim();

    if (lojaId) {
      const pastaLoja = obterOuCriarPastaDaLoja(lojaId, nomeLoja);
      const pastaImagens = obterOuCriarSubpastaImagensDaLoja(pastaLoja);
      let planilhaMovida = false;

      if (sheetId && sheetId.indexOf("PLANILHA") === -1 && sheetId.indexOf("DEDICADA") === -1) {
        try {
          const arqPlanilha = DriveApp.getFileById(sheetId);
          arqPlanilha.moveTo(pastaLoja);
          planilhaMovida = true;
        } catch (eSheet) {
          Logger.log("Aviso ao mover planilha da loja " + lojaId + ": " + eSheet);
        }
      }

      relatorio.lojas.push({
        lojaId: lojaId,
        nomeLoja: nomeLoja,
        pastaLojaNome: pastaLoja.getName(),
        pastaLojaId: pastaLoja.getId(),
        pastaImagensId: pastaImagens.getId(),
        planilhaMovida: planilhaMovida
      });
    }
  }

  return {
    status: "sucesso",
    mensagem: "Estrutura do Google Drive organizada com sucesso! Pastas individuais e pasta de imagens configuradas por loja.",
    dados: relatorio
  };
}

// ==============================================================================
// GESTÃO MASTER: MÉTRICAS REAIS E BANCO DEDICADO POR LOJA
// ==============================================================================

/**
 * Calcula métricas em tempo real diretamente da planilha dedicada da loja,
 * DESCONSIDERANDO expressamente vendas canceladas, orçamentos e pedidos pendentes de aprovação.
 */
function obterMetricasResumoLoja(spreadsheetId) {
  const resumo = {
    faturamentoTotal: 0,
    totalDevedor: 0,
    totalProdutos: 0,
    totalVendasValidas: 0
  };

  if (!spreadsheetId || spreadsheetId.indexOf("PLANILHA") !== -1 || spreadsheetId.indexOf("DEDICADA") !== -1) {
    return resumo;
  }

  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);

    // 1. Processa vendas válidas
    const abaVendas = ss.getSheetByName("Vendas");
    if (abaVendas && abaVendas.getLastRow() > 1) {
      const dV = abaVendas.getDataRange().getValues();
      for (let i = 1; i < dV.length; i++) {
        const statusFin = String(dV[i][15] || "").trim();
        const statusPed = String(dV[i][18] || "").trim();
        const totLiq = Number(dV[i][9]) || 0;
        const valorPago = Number(dV[i][16]) || 0;
        const saldoDev = Number(dV[i][17]) || 0;

        const isCancelada = (statusPed === "Cancelada" || statusFin === "Cancelada");
        const isOrcamento = (statusPed === "Orçamento");

        // Venda é válida para faturamento se não for cancelada, não for orçamento e:
        // (1) Já foi Finalizada/Aprovada/Entregue, OU
        // (2) Foi Quitada (statusFin === "Pago" ou saldoDev <= 0.01 com totLiq > 0), OU
        // (3) Teve entrada financeira / recebimento realizado (valorPago > 0), OU
        // (4) Não está pendente de aprovação
        const isVendaValida = !isCancelada && !isOrcamento && (
          statusPed === "Finalizado" ||
          statusPed === "Aprovado" ||
          statusPed === "Entregue" ||
          statusFin === "Pago" ||
          (saldoDev <= 0.01 && totLiq > 0) ||
          valorPago > 0 ||
          (statusPed !== "Aguardando Aprovação" && statusPed !== "Pendente")
        );

        if (isVendaValida) {
          resumo.faturamentoTotal += totLiq;
          resumo.totalVendasValidas += 1;
        }

        // Saldo a receber apenas de vendas ativas (vendas canceladas não possuem débitos a cobrar)
        if (!isCancelada) {
          resumo.totalDevedor += saldoDev;
        }
      }
    }

    // 2. Contagem de produtos cadastrados na loja
    const abaProd = ss.getSheetByName("Produtos");
    if (abaProd && abaProd.getLastRow() > 1) {
      const dP = abaProd.getDataRange().getValues();
      let cont = 0;
      for (let p = 1; p < dP.length; p++) {
        if (dP[p][0] || dP[p][1]) cont++;
      }
      resumo.totalProdutos = cont;
    }
  } catch (e) {
    Logger.log("Aviso ao ler métricas de " + spreadsheetId + ": " + e);
  }

  return resumo;
}

function listarLojasMaster(incluirMetricas) {
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ssMaster.getSheetByName("Lojas_Usuarios");
  if (!aba) return [];
  const dados = aba.getDataRange().getValues();
  const lojas = [];

  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0]) {
      const lojaId = dados[i][0];
      const sheetId = dados[i][6];
      let metricas = {
        faturamentoTotal: 0,
        totalDevedor: 0,
        totalProdutos: 0,
        totalVendasValidas: 0
      };

      if (incluirMetricas && sheetId) {
        metricas = obterMetricasResumoLoja(sheetId);
      }

      lojas.push({
        id: lojaId,
        nomeLoja: dados[i][1],
        login: dados[i][2],
        senha: dados[i][3],
        nomeResponsavel: dados[i][4],
        whatsapp: dados[i][5],
        spreadsheetId: sheetId,
        status: dados[i][7] || "Ativa",
        dataCriacao: dados[i][8],
        ...metricas
      });
    }
  }
  return lojas;
}

/**
 * Cria uma planilha EXCLUSIVA no Google Drive para a nova loja,
 * alocando-a dentro de sua pasta dedicada: "[LOJA-ID] Nome da Loja"
 */
function criarNovaLojaComBancoDedicado(dadosLoja) {
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
  const abaMaster = ssMaster.getSheetByName("Lojas_Usuarios");

  const lojaId = dadosLoja.id || "LOJA-" + Utilities.getUuid().substring(0, 6).toUpperCase();
  const nomeLoja = dadosLoja.nomeLoja || "Nova Loja";
  const login = (dadosLoja.login || "").toLowerCase().trim();
  const senha = dadosLoja.senha || "123";

  // Verifica se o login já existe
  const dados = abaMaster.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][2]).toLowerCase().trim() === login) {
      return { status: "erro", mensagem: "O login informado já está em uso por outra loja." };
    }
  }

  // 1. Cria a pasta da loja, subpasta de Imagens e a planilha dedicada no Drive
  let novaPlanilhaId = "";
  try {
    const pastaLoja = obterOuCriarPastaDaLoja(lojaId, nomeLoja);
    obterOuCriarSubpastaImagensDaLoja(pastaLoja);

    const novaPlanilha = SpreadsheetApp.create("Banco de Dados - " + nomeLoja);
    novaPlanilhaId = novaPlanilha.getId();

    try {
      const arquivoDrive = DriveApp.getFileById(novaPlanilhaId);
      arquivoDrive.moveTo(pastaLoja);
    } catch (eMove) {
      Logger.log("Aviso ao mover arquivo para pasta da loja: " + eMove);
    }

    // 2. Cria as abas padrão da loja dedicada
    configurarPlanilhaDedicadaDaLoja(novaPlanilha, dadosLoja);
  } catch (errCreate) {
    Logger.log("Erro ao criar planilha dedicada: " + errCreate);
    // Prossegue com ID temporário caso não tenha permissão de criar arquivos
    novaPlanilhaId = "PLANILHA-" + lojaId;
  }

  // 3. Registra na planilha Master
  abaMaster.appendRow([
    lojaId,
    nomeLoja,
    login,
    senha,
    dadosLoja.nomeResponsavel || "",
    dadosLoja.whatsapp || "",
    novaPlanilhaId,
    "Ativa",
    new Date().toISOString()
  ]);

  return {
    status: "sucesso",
    lojaId: lojaId,
    nomeLoja: nomeLoja,
    spreadsheetId: novaPlanilhaId,
    mensagem: "Loja e banco de dados exclusivo criados com sucesso no Google Drive!"
  };
}

function configurarPlanilhaDedicadaDaLoja(ssLoja, dadosIniciais) {
  // Aba 1: Configurações & Identidade da Loja
  criarAbaSeNaoExistir(ssLoja, "Configuracoes", ["Chave", "Valor"]);
  const abaConf = ssLoja.getSheetByName("Configuracoes");
  abaConf.appendRow(["Nome_Loja", dadosIniciais.nomeLoja || "Minha Loja"]);
  abaConf.appendRow(["Slogan", dadosIniciais.slogan || "Os melhores produtos com as melhores condições"]);
  abaConf.appendRow(["Cor_Primaria", dadosIniciais.corPrimaria || "#2563EB"]);
  abaConf.appendRow(["Cor_Destaque", dadosIniciais.corDestaque || "#EF4444"]);
  abaConf.appendRow(["Cor_Menu", dadosIniciais.corMenu || "#0F172A"]);
  abaConf.appendRow(["Cor_Fundo", dadosIniciais.corFundo || "#F8FAFC"]);
  abaConf.appendRow(["Banner_Ativo", dadosIniciais.bannerAtivo ? "SIM" : "NAO"]);
  abaConf.appendRow(["Banner_Texto", dadosIniciais.bannerTexto || "🎉 Super Ofertas da Semana! Aproveite enquanto durar o estoque."]);
  abaConf.appendRow(["Logo_URL", dadosIniciais.logoUrl || ""]);
  abaConf.appendRow(["WhatsApp", dadosIniciais.whatsapp || ""]);
  abaConf.appendRow(["Chave_Pix", dadosIniciais.chavePix || ""]);
  abaConf.appendRow(["Permite_Delivery", "SIM"]);
  abaConf.appendRow(["Taxa_Entrega", Number(dadosIniciais.taxaEntrega) || 0]);
  abaConf.appendRow(["Modelo_Parcelamento", dadosIniciais.modeloParcelamento || "MODELO_1"]);
  abaConf.appendRow(["Valor_Minimo_Parcela", Number(dadosIniciais.valorMinimoParcela) || 50]);
  abaConf.appendRow(["Max_Parcelas_Geral", Number(dadosIniciais.maxParcelas) || 6]);
  abaConf.appendRow(["Tabela_Faixas_JSON", JSON.stringify(dadosIniciais.faixas || [
    { ateValor: 100, maxParcelas: 1 },
    { ateValor: 300, maxParcelas: 3 },
    { ateValor: 99999, maxParcelas: 6 }
  ])]);

  // Aba 2: Produtos da Loja (com suporte a Promoção, Destaques, Validade, Brechó e Serviços)
  criarAbaSeNaoExistir(ssLoja, "Produtos", [
    "ID", "Nome", "Variacao", "Codigo_Barras", "Categoria", "Preco_Custo",
    "Margem_Percentual", "Preco_Venda", "Estoque_Atual", "Estoque_Minimo",
    "Foto_URL", "Visivel_Online", "Data_Atualizacao",
    "Em_Promocao", "Preco_Promocional", "Destaque",
    "Descricao", "Somente_A_Vista",
    "Tipo_Item", "Data_Validade", "Condicao_Peca", "Medidas", "Peca_Unica",
    "Consignante_Nome", "Consignante_Comissao"
  ]);

  // Aba 3: Clientes da Loja
  criarAbaSeNaoExistir(ssLoja, "Clientes", [
    "ID", "Nome", "Telefone", "Endereco", "Documento", "Observacoes", "Data_Cadastro"
  ]);

  // Aba 4: Vendas e Pedidos da Loja (com Vencimento e Profissional)
  criarAbaSeNaoExistir(ssLoja, "Vendas", [
    "ID", "Tipo", "Origem", "Cliente_ID", "Cliente_Nome", "Cliente_Telefone",
    "Total_Bruto", "Taxa_Entrega", "Desconto", "Total_Liquido", "Lucro_Total",
    "Forma_Pagamento", "Condicao_Pagamento", "Parcelas", "Valor_Parcela",
    "Status_Financeiro", "Valor_Pago", "Saldo_Devedor", "Status_Pedido",
    "Modalidade_Entrega", "Endereco_Entrega", "Data_Hora", "Observacoes",
    "Data_Vencimento", "Profissional"
  ]);

  // Aba 5: Detalhe dos Itens da Venda
  criarAbaSeNaoExistir(ssLoja, "Itens_Venda", [
    "ID_Item", "Venda_ID", "Produto_ID", "Produto_Nome", "Variacao",
    "Quantidade", "Preco_Custo_Unitario", "Preco_Venda_Unitario", "Subtotal", "Lucro_Item",
    "Preco_Original", "Desconto_Unitario"
  ]);

  // Aba 6: Despesas e Custos Operacionais da Loja
  criarAbaSeNaoExistir(ssLoja, "Despesas", [
    "ID", "Descricao", "Categoria", "Valor", "Data", "Observacoes"
  ]);
}

function atualizarLojaMaster(lojaId, dados) {
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ssMaster.getSheetByName("Lojas_Usuarios");
  const rows = aba.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(lojaId)) {
      if (dados.nomeLoja) aba.getRange(i + 1, 2).setValue(dados.nomeLoja);
      if (dados.senha) aba.getRange(i + 1, 4).setValue(dados.senha);
      if (dados.nomeResponsavel) aba.getRange(i + 1, 5).setValue(dados.nomeResponsavel);
      if (dados.whatsapp !== undefined) aba.getRange(i + 1, 6).setValue(dados.whatsapp);
      if (dados.status) aba.getRange(i + 1, 8).setValue(dados.status);

      // Sincroniza também na aba Configuracoes da planilha dedicada da loja se existir
      try {
        const sheetIdLoja = rows[i][6]; // Coluna Spreadsheet_ID
        if (sheetIdLoja) {
          const ssLoja = SpreadsheetApp.openById(sheetIdLoja);
          const abaConf = ssLoja.getSheetByName("Configuracoes");
          if (abaConf) {
            const dadosConf = abaConf.getDataRange().getValues();
            for (let c = 1; c < dadosConf.length; c++) {
              if (dadosConf[c][0] === "Nome_Loja" && dados.nomeLoja) {
                abaConf.getRange(c + 1, 2).setValue(dados.nomeLoja);
              }
              if (dadosConf[c][0] === "WhatsApp" && dados.whatsapp !== undefined) {
                abaConf.getRange(c + 1, 2).setValue(dados.whatsapp);
              }
            }
          }
        }
      } catch (eConf) {
        Logger.log("Aviso ao sincronizar config da loja dedicada: " + eConf);
      }

      return { status: "sucesso", lojaId: lojaId, dados: dados };
    }
  }
  return { status: "erro", mensagem: "Loja não localizada no Master." };
}

function excluirLojaMaster(lojaId) {
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ssMaster.getSheetByName("Lojas_Usuarios");
  const rows = aba.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(lojaId)) {
      aba.deleteRow(i + 1);
      return { status: "sucesso" };
    }
  }
  return { status: "erro", mensagem: "Loja não encontrada." };
}

// ==============================================================================
// AUTENTICAÇÃO E ROTEAMENTO
// ==============================================================================

function gerarHashSha256(texto) {
  if (!texto) return "";
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(texto), Utilities.Charset.UTF_8);
  let txtHash = "";
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    let byteString = hashVal.toString(16);
    if (byteString.length === 1) byteString = "0" + byteString;
    txtHash += byteString;
  }
  return txtHash;
}

function autenticarUsuario(usuario, senha, senhaHash) {
  const u = (usuario || "").trim().toLowerCase();
  const s = String(senha || "").trim();
  const hashRecebido = String(senhaHash || "").trim() || (s ? gerarHashSha256(s) : "");

  // 1. Checa Master (Aceita senhas válidas em texto puro ou hash SHA-256)
  if (u === LOGIN_MASTER_PADRAO) {
    const confereTexto = (SENHAS_MASTER_VALIDAS.indexOf(s) !== -1);
    const confereHash = SENHAS_MASTER_VALIDAS.some(sm => gerarHashSha256(sm) === hashRecebido);
    if (confereTexto || confereHash) {
      return {
        status: "sucesso",
        perfil: "MASTER",
        usuario: { login: u, nome: "Super Administrador" }
      };
    }
  }

  // 2. Checa Lojista na planilha Master
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ssMaster.getSheetByName("Lojas_Usuarios");
  if (!aba) return { status: "erro", mensagem: "Base de usuários não inicializada." };

  const dados = aba.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    const loginSalvo = String(dados[i][2]).toLowerCase().trim();
    const senhaSalva = String(dados[i][3]).trim();
    const statusLoja = String(dados[i][7] || "Ativa");

    // Valida contra texto puro legado ou hash SHA-256
    const senhaValida = (senhaSalva === s || senhaSalva === hashRecebido || gerarHashSha256(senhaSalva) === hashRecebido);

    if (loginSalvo === u && senhaValida) {
      if (statusLoja === "Bloqueada") {
        return { status: "erro", mensagem: "Esta loja está temporariamente bloqueada. Contate o administrador." };
      }

      return {
        status: "sucesso",
        perfil: "LOJISTA",
        loja: {
          id: dados[i][0],
          nomeLoja: dados[i][1],
          login: dados[i][2],
          nomeResponsavel: dados[i][4],
          whatsapp: dados[i][5],
          spreadsheetId: dados[i][6]
        }
      };
    }
  }

  return { status: "erro", mensagem: "Usuário ou senha incorretos." };
}

function abrirPlanilhaDaLoja(lojaId) {
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ssMaster.getSheetByName("Lojas_Usuarios");
  if (!aba) return ssMaster;
  const dados = aba.getDataRange().getValues();

  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(lojaId)) {
      const nomeLoja = dados[i][1] || "Minha Loja";
      const sheetId = dados[i][6];
      if (sheetId && sheetId.indexOf("DEDICADA") === -1 && sheetId.indexOf("PLANILHA") === -1) {
        try {
          return SpreadsheetApp.openById(sheetId);
        } catch (eOpen) {
          Logger.log("Erro ao abrir planilha dedicada " + sheetId + ": " + eOpen);
        }
      }

      // Se não tiver ID válido ou falhou, tenta criar automaticamente a planilha dedicada da loja
      try {
        const pastaLoja = obterOuCriarPastaDaLoja(lojaId, nomeLoja);
        obterOuCriarSubpastaImagensDaLoja(pastaLoja);
        const novaPlanilha = SpreadsheetApp.create("Banco de Dados - " + nomeLoja);
        const novaPlanilhaId = novaPlanilha.getId();
        try {
          const arquivoDrive = DriveApp.getFileById(novaPlanilhaId);
          arquivoDrive.moveTo(pastaLoja);
        } catch (eMove) { }

        configurarPlanilhaDedicadaDaLoja(novaPlanilha, {
          nomeLoja: nomeLoja,
          nomeResponsavel: dados[i][4] || "",
          whatsapp: dados[i][5] || ""
        });

        if (lojaId === "LOJA-1") {
          const abaProd = novaPlanilha.getSheetByName("Produtos");
          if (abaProd && abaProd.getLastRow() <= 1) {
            abaProd.appendRow(["P-101", "Vestido Midi Floral", "Tam M / Rosa", "78910001", "Vestuário", 45, 100, 90, 12, 4, "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&auto=format&fit=crop&q=60", "SIM"]);
            abaProd.appendRow(["P-102", "Camiseta Básica Algodão", "Tam G / Off White", "78910002", "Vestuário", 20, 75, 35, 20, 5, "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=60", "SIM"]);
            abaProd.appendRow(["P-103", "Bolsa Tiracolo Couro", "Caramelo", "78910003", "Acessórios", 70, 85.7, 130, 3, 4, "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&auto=format&fit=crop&q=60", "SIM"]);
          }
        }

        aba.getRange(i + 1, 7).setValue(novaPlanilhaId);
        return novaPlanilha;
      } catch (eCriar) {
        Logger.log("Aviso: usando planilha master como fallback (" + eCriar + ")");
      }

      return ssMaster;
    }
  }
  return ssMaster;
}

// ==============================================================================
// OPERAÇÕES DO LOJISTA E CATÁLOGO PÚBLICO
// ==============================================================================

function obterConfiguracoesLoja(ssLoja, lojaId) {
  let nomeFallback = "Minha Loja";
  let whatsappFallback = "";
  try {
    const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
    const abaLojas = ssMaster.getSheetByName("Lojas_Usuarios");
    if (abaLojas && lojaId) {
      const dadosL = abaLojas.getDataRange().getValues();
      for (let j = 1; j < dadosL.length; j++) {
        if (String(dadosL[j][0]) === String(lojaId)) {
          if (dadosL[j][1]) nomeFallback = dadosL[j][1];
          if (dadosL[j][5]) whatsappFallback = dadosL[j][5];
          break;
        }
      }
    }
  } catch (e) { }

  const aba = ssLoja ? ssLoja.getSheetByName("Configuracoes") : null;
  const conf = {
    nomeLoja: nomeFallback,
    slogan: "Catálogo Digital Oficial",
    corPrimaria: "#2563EB",
    corDestaque: "#EF4444",
    corMenu: "#0F172A",
    corFundo: "#F8FAFC",
    bannerAtivo: false,
    bannerTexto: "🎉 Super Ofertas da Semana! Aproveite enquanto durar o estoque.",
    logoUrl: "",
    whatsapp: whatsappFallback,
    chavePix: "",
    permiteDelivery: true,
    taxaEntrega: 0,
    modeloParcelamento: "MODELO_1",
    valorMinimoParcela: 50,
    maxParcelas: 6,
    faixas: []
  };

  if (!aba) return conf;
  const dados = aba.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    const chave = dados[i][0];
    const val = dados[i][1];
    if (chave === "Nome_Loja" && val) conf.nomeLoja = val;
    if (chave === "Slogan") conf.slogan = val;
    if (chave === "Cor_Primaria") conf.corPrimaria = val;
    if (chave === "Cor_Destaque") conf.corDestaque = val;
    if (chave === "Cor_Menu") conf.corMenu = val;
    if (chave === "Cor_Fundo") conf.corFundo = val;
    if (chave === "Banner_Ativo") conf.bannerAtivo = (val === "SIM" || val === true);
    if (chave === "Banner_Texto") conf.bannerTexto = val;
    if (chave === "Logo_URL") conf.logoUrl = val;
    if (chave === "WhatsApp") conf.whatsapp = val;
    if (chave === "Chave_Pix") conf.chavePix = val;
    if (chave === "Permite_Delivery") conf.permiteDelivery = (val === "SIM");
    if (chave === "Taxa_Entrega") conf.taxaEntrega = Number(val) || 0;
    if (chave === "Modelo_Parcelamento") conf.modeloParcelamento = val;
    if (chave === "Valor_Minimo_Parcela") conf.valorMinimoParcela = Number(val) || 50;
    if (chave === "Max_Parcelas_Geral") conf.maxParcelas = Number(val) || 6;
    if (chave === "Tabela_Faixas_JSON") {
      try { conf.faixas = JSON.parse(val); } catch (e) { conf.faixas = []; }
    }
  }
  return conf;
}

function salvarConfiguracoesLoja(lojaId, novaConf) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  let aba = ssLoja.getSheetByName("Configuracoes");
  if (!aba) {
    criarAbaSeNaoExistir(ssLoja, "Configuracoes", ["Chave", "Valor"]);
    aba = ssLoja.getSheetByName("Configuracoes");
  }

  const dados = aba.getDataRange().getValues();
  const mapaLinhas = {};
  for (let i = 1; i < dados.length; i++) {
    mapaLinhas[dados[i][0]] = i + 1;
  }

  function setValor(chave, valor) {
    if (mapaLinhas[chave]) {
      aba.getRange(mapaLinhas[chave], 2).setValue(valor);
    } else {
      aba.appendRow([chave, valor]);
    }
  }

  if (novaConf.nomeLoja !== undefined) setValor("Nome_Loja", novaConf.nomeLoja);
  if (novaConf.slogan !== undefined) setValor("Slogan", novaConf.slogan);
  if (novaConf.corPrimaria !== undefined) setValor("Cor_Primaria", novaConf.corPrimaria);
  if (novaConf.corDestaque !== undefined) setValor("Cor_Destaque", novaConf.corDestaque);
  if (novaConf.corMenu !== undefined) setValor("Cor_Menu", novaConf.corMenu);
  if (novaConf.corFundo !== undefined) setValor("Cor_Fundo", novaConf.corFundo);
  if (novaConf.bannerAtivo !== undefined) setValor("Banner_Ativo", novaConf.bannerAtivo ? "SIM" : "NAO");
  if (novaConf.bannerTexto !== undefined) setValor("Banner_Texto", novaConf.bannerTexto);
  if (novaConf.logoUrl !== undefined) {
    let logoUrl = novaConf.logoUrl;
    if (logoUrl && String(logoUrl).indexOf("base64,") !== -1) {
      logoUrl = salvarImagemNoDrive("logo_" + lojaId + ".jpg", logoUrl, lojaId);
    }
    setValor("Logo_URL", logoUrl);
  }
  if (novaConf.whatsapp !== undefined) setValor("WhatsApp", novaConf.whatsapp);
  if (novaConf.chavePix !== undefined) setValor("Chave_Pix", novaConf.chavePix);
  if (novaConf.permiteDelivery !== undefined) setValor("Permite_Delivery", novaConf.permiteDelivery ? "SIM" : "NAO");
  if (novaConf.taxaEntrega !== undefined) setValor("Taxa_Entrega", Number(novaConf.taxaEntrega) || 0);
  if (novaConf.modeloParcelamento !== undefined) setValor("Modelo_Parcelamento", novaConf.modeloParcelamento);
  if (novaConf.valorMinimoParcela !== undefined) setValor("Valor_Minimo_Parcela", Number(novaConf.valorMinimoParcela) || 50);
  if (novaConf.maxParcelas !== undefined) setValor("Max_Parcelas_Geral", Number(novaConf.maxParcelas) || 6);
  if (novaConf.faixas !== undefined) setValor("Tabela_Faixas_JSON", JSON.stringify(novaConf.faixas));

  // Sincroniza imediatamente o Nome da Loja e WhatsApp na aba Lojas_Usuarios da planilha Master
  try {
    const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
    const abaMaster = ssMaster.getSheetByName("Lojas_Usuarios");
    if (abaMaster) {
      const rowsM = abaMaster.getDataRange().getValues();
      for (let m = 1; m < rowsM.length; m++) {
        if (String(rowsM[m][0]) === String(lojaId)) {
          if (novaConf.nomeLoja !== undefined && String(novaConf.nomeLoja).trim() !== "") {
            abaMaster.getRange(m + 1, 2).setValue(String(novaConf.nomeLoja).trim());
          }
          if (novaConf.whatsapp !== undefined) {
            abaMaster.getRange(m + 1, 6).setValue(String(novaConf.whatsapp).trim());
          }
          break;
        }
      }
    }
  } catch (eM) {
    Logger.log("Aviso ao atualizar Master com config da loja: " + eM);
  }

  return { status: "sucesso" };
}

function obterDadosLojaPublica(lojaId) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  const config = obterConfiguracoesLoja(ssLoja, lojaId);
  const abaProd = ssLoja.getSheetByName("Produtos");

  const produtos = [];
  if (abaProd) {
    const dados = abaProd.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
      const visivel = dados[i][11];
      const estoque = Number(dados[i][8]) || 0;
      if (visivel !== "NAO" && dados[i][1]) {
        const emPromocao = (dados[i][13] === "SIM" || dados[i][13] === true);
        const precoPromo = Number(dados[i][14]) || 0;
        const destaque = (dados[i][15] === "SIM" || dados[i][15] === true);
        const descricao = dados[i][16] ? String(dados[i][16]) : "";
        const somenteAVista = (dados[i][17] === "SIM" || dados[i][17] === true);
        const tipoItem = dados[i][18] || "PRODUTO";
        const dataValidade = dados[i][19] ? (dados[i][19] instanceof Date ? dados[i][19].toISOString().split('T')[0] : String(dados[i][19])) : "";
        const condicaoPeca = dados[i][20] || "";
        const medidas = dados[i][21] || "";
        const pecaUnica = (dados[i][22] === "SIM" || dados[i][22] === true);

        produtos.push({
          id: dados[i][0],
          nome: dados[i][1],
          variacao: dados[i][2],
          codigoBarras: dados[i][3],
          categoria: dados[i][4] || "Geral",
          precoVenda: Number(dados[i][7]) || 0,
          estoqueAtual: estoque,
          fotoUrl: dados[i][10] || "",
          emPromocao: emPromocao,
          precoPromocional: precoPromo,
          destaque: destaque,
          descricao: descricao,
          somenteAVista: somenteAVista,
          tipoItem: tipoItem,
          dataValidade: dataValidade,
          condicaoPeca: condicaoPeca,
          medidas: medidas,
          pecaUnica: pecaUnica
        });
      }
    }
  }

  // Fallback de demonstração caso a planilha de produtos ainda não esteja preenchida
  if (produtos.length === 0 && (lojaId === "LOJA-1" || lojaId === "moda")) {
    produtos.push(
      { id: "P-101", nome: "Vestido Midi Floral", variacao: "Tam M / Rosa", categoria: "Vestuário", precoVenda: 90, estoqueAtual: 12, fotoUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&auto=format&fit=crop&q=60" },
      { id: "P-102", nome: "Camiseta Básica Algodão", variacao: "Tam G / Off White", categoria: "Vestuário", precoVenda: 35, estoqueAtual: 20, fotoUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=60" },
      { id: "P-103", nome: "Bolsa Tiracolo Couro", variacao: "Caramelo", categoria: "Acessórios", precoVenda: 130, estoqueAtual: 3, fotoUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&auto=format&fit=crop&q=60" }
    );
  }

  return {
    status: "sucesso",
    loja: {
      id: lojaId,
      ...config,
      produtos: produtos
    }
  };
}

function obterDadosPainelLojista(lojaId) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  const config = obterConfiguracoesLoja(ssLoja);

  const abaProd = ssLoja.getSheetByName("Produtos");
  const produtos = [];
  if (abaProd) {
    const dP = abaProd.getDataRange().getValues();
    for (let i = 1; i < dP.length; i++) {
      const emPromocao = (dP[i][13] === "SIM" || dP[i][13] === true);
      const precoPromo = Number(dP[i][14]) || 0;
      const destaque = (dP[i][15] === "SIM" || dP[i][15] === true);
      const descricao = dP[i][16] ? String(dP[i][16]) : "";
      const somenteAVista = (dP[i][17] === "SIM" || dP[i][17] === true);
      const tipoItem = dP[i][18] || "PRODUTO";
      const dataValidade = dP[i][19] ? (dP[i][19] instanceof Date ? dP[i][19].toISOString().split('T')[0] : String(dP[i][19])) : "";
      const condicaoPeca = dP[i][20] || "";
      const medidas = dP[i][21] || "";
      const pecaUnica = (dP[i][22] === "SIM" || dP[i][22] === true);
      const consignanteNome = dP[i][23] || "";
      const consignanteComissao = Number(dP[i][24]) || 0;

      produtos.push({
        id: dP[i][0],
        nome: dP[i][1],
        variacao: dP[i][2],
        codigoBarras: dP[i][3],
        categoria: dP[i][4],
        precoCusto: Number(dP[i][5]) || 0,
        margemPercentual: Number(dP[i][6]) || 0,
        precoVenda: Number(dP[i][7]) || 0,
        estoqueAtual: Number(dP[i][8]) || 0,
        estoqueMinimo: Number(dP[i][9]) || 0,
        fotoUrl: dP[i][10] || "",
        visivelOnline: dP[i][11] !== "NAO",
        emPromocao: emPromocao,
        precoPromocional: precoPromo,
        destaque: destaque,
        descricao: descricao,
        somenteAVista: somenteAVista,
        tipoItem: tipoItem,
        dataValidade: dataValidade,
        condicaoPeca: condicaoPeca,
        medidas: medidas,
        pecaUnica: pecaUnica,
        consignanteNome: consignanteNome,
        consignanteComissao: consignanteComissao
      });
    }
  }

  const abaCli = ssLoja.getSheetByName("Clientes");
  const clientes = [];
  if (abaCli) {
    const dC = abaCli.getDataRange().getValues();
    for (let i = 1; i < dC.length; i++) {
      clientes.push({
        id: dC[i][0],
        nome: dC[i][1],
        telefone: dC[i][2],
        endereco: dC[i][3],
        documento: dC[i][4] || "",
        observacoes: dC[i][5] || "",
        historicoPreferencias: dC[i][5] || ""
      });
    }
  }

  const abaVnd = ssLoja.getSheetByName("Vendas");
  const abaItn = ssLoja.getSheetByName("Itens_Venda");
  const vendas = [];

  if (abaVnd) {
    const dV = abaVnd.getDataRange().getValues();
    const dI = abaItn ? abaItn.getDataRange().getValues() : [];

    for (let i = 1; i < dV.length; i++) {
      const vId = dV[i][0];
      const itens = [];
      for (let j = 1; j < dI.length; j++) {
        if (String(dI[j][1]) === String(vId)) {
          const pFinal = Number(dI[j][7]);
          const pCheio = Number(dI[j][10]) || pFinal;
          const dUnit = (dI[j][11] !== undefined && dI[j][11] !== "") ? Number(dI[j][11]) : Math.max(0, pCheio - pFinal);
          itens.push({
            id: dI[j][0],
            produtoId: dI[j][2],
            nome: dI[j][3],
            variacao: dI[j][4],
            quantidade: Number(dI[j][5]),
            precoCustoUnitario: Number(dI[j][6]),
            precoVendaUnitario: pFinal,
            subtotal: Number(dI[j][8]),
            lucroItem: Number(dI[j][9]),
            precoCheioUnitario: pCheio,
            precoOriginal: pCheio,
            descontoUnitario: dUnit,
            subtotalCheio: pCheio * Number(dI[j][5]),
            descontoTotal: dUnit * Number(dI[j][5])
          });
        }
      }

      const totLiq = Number(dV[i][9]) || 0;
      const statusFin = dV[i][15];
      const saldoDev = Number(dV[i][17]) || 0;
      let statusPed = dV[i][18];

      // Auto-reconciliação: se a venda foi quitada e ainda constava como Aguardando Aprovação, promove para Finalizado
      if (statusPed === "Aguardando Aprovação" && (statusFin === "Pago" || (saldoDev <= 0.01 && totLiq > 0))) {
        statusPed = "Finalizado";
        try {
          abaVnd.getRange(i + 1, 19).setValue("Finalizado");
        } catch (eR) { }
      }

      vendas.push({
        id: vId,
        tipo: dV[i][1],
        origem: dV[i][2],
        clienteId: dV[i][3],
        clienteNome: dV[i][4],
        clienteTelefone: dV[i][5],
        totalBruto: Number(dV[i][6]) || 0,
        taxaEntrega: Number(dV[i][7]) || 0,
        desconto: Number(dV[i][8]) || 0,
        totalLiquido: totLiq,
        lucroTotal: Number(dV[i][10]) || 0,
        formaPagamento: dV[i][11],
        condicaoPagamento: dV[i][12],
        parcelas: Number(dV[i][13]) || 1,
        valorParcela: Number(dV[i][14]) || 0,
        statusFinanceiro: statusFin,
        valorPago: Number(dV[i][16]) || 0,
        saldoDevedor: saldoDev,
        status: statusPed,
        modalidadeEntrega: dV[i][19],
        enderecoEntrega: dV[i][20],
        dataHora: dV[i][21],
        observacoes: dV[i][22],
        dataVencimento: dV[i][23] ? (dV[i][23] instanceof Date ? dV[i][23].toISOString().split('T')[0] : String(dV[i][23])) : "",
        profissional: dV[i][24] || "",
        itens: itens
      });
    }
  }

  // Leitura das Despesas da Loja
  const abaDesp = ssLoja.getSheetByName("Despesas");
  const despesas = [];
  if (abaDesp) {
    const dD = abaDesp.getDataRange().getValues();
    for (let i = 1; i < dD.length; i++) {
      if (dD[i][0]) {
        despesas.push({
          id: String(dD[i][0]),
          descricao: String(dD[i][1] || "Despesa"),
          categoria: String(dD[i][2] || "Geral"),
          valor: Number(dD[i][3]) || 0,
          data: dD[i][4] ? (dD[i][4] instanceof Date ? dD[i][4].toISOString().split('T')[0] : String(dD[i][4])) : "",
          observacoes: String(dD[i][5] || "")
        });
      }
    }
  }

  return {
    status: "sucesso",
    config: config,
    produtos: produtos,
    clientes: clientes,
    vendas: vendas,
    despesas: despesas
  };
}

function salvarProdutoLoja(lojaId, p) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  let aba = ssLoja.getSheetByName("Produtos");
  if (!aba) {
    criarAbaSeNaoExistir(ssLoja, "Produtos", [
      "ID", "Nome", "Variacao", "Codigo_Barras", "Categoria", "Preco_Custo",
      "Margem_Percentual", "Preco_Venda", "Estoque_Atual", "Estoque_Minimo",
      "Foto_URL", "Visivel_Online", "Data_Atualizacao",
      "Em_Promocao", "Preco_Promocional", "Destaque",
      "Descricao", "Somente_A_Vista",
      "Tipo_Item", "Data_Validade", "Condicao_Peca", "Medidas", "Peca_Unica",
      "Consignante_Nome", "Consignante_Comissao"
    ]);
    aba = ssLoja.getSheetByName("Produtos");
  } else {
    // Garante compatibilidade adicionando os novos cabeçalhos caso a planilha seja antiga
    if (aba.getLastColumn() < 17) aba.getRange(1, 17).setValue("Descricao");
    if (aba.getLastColumn() < 18) aba.getRange(1, 18).setValue("Somente_A_Vista");
    if (aba.getLastColumn() < 19) aba.getRange(1, 19).setValue("Tipo_Item");
    if (aba.getLastColumn() < 20) aba.getRange(1, 20).setValue("Data_Validade");
    if (aba.getLastColumn() < 21) aba.getRange(1, 21).setValue("Condicao_Peca");
    if (aba.getLastColumn() < 22) aba.getRange(1, 22).setValue("Medidas");
    if (aba.getLastColumn() < 23) aba.getRange(1, 23).setValue("Peca_Unica");
    if (aba.getLastColumn() < 24) aba.getRange(1, 24).setValue("Consignante_Nome");
    if (aba.getLastColumn() < 25) aba.getRange(1, 25).setValue("Consignante_Comissao");
  }

  const dados = aba.getDataRange().getValues();
  const id = p.id || "PROD-" + Utilities.getUuid().substring(0, 8).toUpperCase();

  let fotoUrl = p.fotoUrl || "";
  if (p.fotoBase64) {
    fotoUrl = salvarImagemNoDrive("prod_" + id + ".jpg", p.fotoBase64, lojaId);
  }

  let linhaIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(id)) {
      linhaIndex = i + 1;
      break;
    }
  }

  const emPromo = (p.emPromocao === true || p.emPromocao === "SIM" || String(p.emPromocao).toLowerCase() === "true");
  const precoPromo = Number(p.precoPromocional) || 0;
  const destaque = (p.destaque === true || p.destaque === "SIM" || String(p.destaque).toLowerCase() === "true");
  const descricao = p.descricao ? String(p.descricao) : "";
  const somenteAVista = (p.somenteAVista === true || p.somenteAVista === "SIM" || String(p.somenteAVista).toLowerCase() === "true");
  const tipoItem = p.tipoItem || "PRODUTO";
  const dataValidade = p.dataValidade || "";
  const condicaoPeca = p.condicaoPeca || "";
  const medidas = p.medidas || "";
  const pecaUnica = (p.pecaUnica === true || p.pecaUnica === "SIM" || String(p.pecaUnica).toLowerCase() === "true");
  const consignanteNome = p.consignanteNome || "";
  const consignanteComissao = Number(p.consignanteComissao) || 0;

  const linhaDados = [
    id, p.nome, p.variacao || "", p.codigoBarras || "", p.categoria || "Geral",
    Number(p.precoCusto) || 0, Number(p.margemPercentual) || 0, Number(p.precoVenda) || 0,
    Number(p.estoqueAtual) || 0, Number(p.estoqueMinimo) || 0, fotoUrl,
    p.visivelOnline !== false ? "SIM" : "NAO", new Date().toISOString(),
    emPromo ? "SIM" : "NAO", precoPromo, destaque ? "SIM" : "NAO",
    descricao, somenteAVista ? "SIM" : "NAO",
    tipoItem, dataValidade, condicaoPeca, medidas, pecaUnica ? "SIM" : "NAO",
    consignanteNome, consignanteComissao
  ];

  if (linhaIndex > 0) {
    aba.getRange(linhaIndex, 1, 1, linhaDados.length).setValues([linhaDados]);
  } else {
    aba.appendRow(linhaDados);
  }

  return { status: "sucesso", id: id, fotoUrl: fotoUrl };
}

function excluirProdutoLoja(lojaId, id) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  const aba = ssLoja.getSheetByName("Produtos");
  if (!aba) return { status: "erro", mensagem: "Aba não encontrada." };
  const dados = aba.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(id)) {
      aba.deleteRow(i + 1);
      return { status: "sucesso" };
    }
  }
  return { status: "erro", mensagem: "Produto não encontrado na loja." };
}

function salvarClienteLoja(lojaId, c) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  let aba = ssLoja.getSheetByName("Clientes");
  if (!aba) {
    criarAbaSeNaoExistir(ssLoja, "Clientes", [
      "ID", "Nome", "Telefone", "Endereco", "Documento", "Observacoes", "Data_Cadastro"
    ]);
    aba = ssLoja.getSheetByName("Clientes");
  }

  const dados = aba.getDataRange().getValues();
  const id = c.id || "CLI-" + Utilities.getUuid().substring(0, 8).toUpperCase();

  let linhaIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(id)) {
      linhaIndex = i + 1;
      break;
    }
  }

  const linhaDados = [
    id, c.nome, c.telefone || "", c.endereco || "",
    c.documento || "", c.historicoPreferencias || c.observacoes || "", new Date().toISOString()
  ];

  if (linhaIndex > 0) {
    aba.getRange(linhaIndex, 1, 1, linhaDados.length).setValues([linhaDados]);
  } else {
    aba.appendRow(linhaDados);
  }

  return { status: "sucesso", id: id };
}

function excluirClienteLoja(lojaId, id) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  const aba = ssLoja.getSheetByName("Clientes");
  if (!aba) return { status: "erro", mensagem: "Aba não encontrada." };
  const dados = aba.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(id)) {
      aba.deleteRow(i + 1);
      return { status: "sucesso" };
    }
  }
  return { status: "erro", mensagem: "Cliente não localizado." };
}

function registrarVendaLoja(lojaId, v) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  let abaVendas = ssLoja.getSheetByName("Vendas");
  let abaItens = ssLoja.getSheetByName("Itens_Venda");
  let abaProdutos = ssLoja.getSheetByName("Produtos");

  if (!abaVendas) {
    configurarPlanilhaDedicadaDaLoja(ssLoja, {});
    abaVendas = ssLoja.getSheetByName("Vendas");
    abaItens = ssLoja.getSheetByName("Itens_Venda");
    abaProdutos = ssLoja.getSheetByName("Produtos");
  }

  const vendaId = v.id || (v.tipo === "PEDIDO_ONLINE" ? "PED-ON-" : "VND-") + Utilities.getUuid().substring(0, 8).toUpperCase();
  const dataHora = v.dataHora || new Date().toISOString();

  const totalLiquido = Number(v.totalLiquido) || 0;
  const taxaEntrega = Number(v.taxaEntrega) || 0;
  const condicao = v.condicaoPagamento || "A Vista";
  const parcelas = Number(v.parcelas) || 1;
  const valorParcela = Number(v.valorParcela) || (totalLiquido / parcelas);
  const statusFin = v.statusFinanceiro || (condicao === "A Prazo" ? "Pendente" : "Pago");
  const valorPago = Number(v.valorPago) || (statusFin === "Pago" ? totalLiquido : 0);
  const saldoDevedor = Number(v.saldoDevedor) !== undefined ? Number(v.saldoDevedor) : Math.max(0, totalLiquido - valorPago);
  const statusPedido = v.status || (v.tipo === "PEDIDO_ONLINE" ? "Aguardando Aprovação" : "Finalizado");

  // Garante colunas de Vencimento e Profissional se a planilha for antiga
  if (abaVendas.getLastColumn() < 24) abaVendas.getRange(1, 24).setValue("Data_Vencimento");
  if (abaVendas.getLastColumn() < 25) abaVendas.getRange(1, 25).setValue("Profissional");

  abaVendas.appendRow([
    vendaId,
    v.tipo || "PDV",
    v.origem || "Balcao",
    v.clienteId || "",
    v.clienteNome || "Cliente Balcão",
    v.clienteTelefone || "",
    Number(v.totalBruto) || 0,
    taxaEntrega,
    Number(v.desconto) || 0,
    totalLiquido,
    Number(v.lucroTotal) || 0,
    v.formaPagamento || "Pix",
    condicao,
    parcelas,
    valorParcela,
    statusFin,
    valorPago,
    saldoDevedor,
    statusPedido,
    v.modalidadeEntrega || "Retirada",
    v.enderecoEntrega || "",
    dataHora,
    v.observacoes || "",
    v.dataVencimento || "",
    v.profissional || ""
  ]);

  const deveAbaterEstoque = (v.tipo === "PDV" || statusPedido === "Finalizado");
  const produtosMap = {};

  if (deveAbaterEstoque && abaProdutos) {
    const dadosP = abaProdutos.getDataRange().getValues();
    for (let p = 1; p < dadosP.length; p++) {
      produtosMap[String(dadosP[p][0])] = { linha: p + 1, estoqueAtual: Number(dadosP[p][8]) || 0 };
    }
  }

  if (v.itens && v.itens.length > 0 && abaItens) {
    if (abaItens.getLastColumn() < 11) abaItens.getRange(1, 11).setValue("Preco_Original");
    if (abaItens.getLastColumn() < 12) abaItens.getRange(1, 12).setValue("Desconto_Unitario");

    v.itens.forEach(item => {
      const itemId = "ITEM-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      const pFinal = Number(item.precoVendaUnitario);
      const pOriginal = Number(item.precoOriginal) || Number(item.precoCheioUnitario) || pFinal;
      const dUnit = (item.descontoUnitario !== undefined) ? Number(item.descontoUnitario) : Math.max(0, pOriginal - pFinal);

      abaItens.appendRow([
        itemId,
        vendaId,
        item.produtoId,
        item.nome,
        item.variacao || "",
        Number(item.quantidade),
        Number(item.precoCustoUnitario) || 0,
        pFinal,
        Number(item.subtotal),
        Number(item.lucroItem) || 0,
        pOriginal,
        dUnit
      ]);

      if (deveAbaterEstoque && produtosMap[item.produtoId]) {
        const prodInfo = produtosMap[item.produtoId];
        const novoEstoque = Math.max(0, prodInfo.estoqueAtual - Number(item.quantidade));
        abaProdutos.getRange(prodInfo.linha, 9).setValue(novoEstoque);
        prodInfo.estoqueAtual = novoEstoque;
      }
    });
  }

  return { status: "sucesso", id: vendaId };
}

function registrarRecebimentoLoja(lojaId, vendaId, valorRecebido, novaForma) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  const abaVendas = ssLoja.getSheetByName("Vendas");
  if (!abaVendas) return { status: "erro", mensagem: "Aba não encontrada." };
  const dados = abaVendas.getDataRange().getValues();

  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(vendaId)) {
      const totalLiquido = Number(dados[i][9]) || 0;
      let valorPagoAtual = Number(dados[i][16]) || 0;
      let novoValorPago = valorPagoAtual + Number(valorRecebido);
      let novoSaldoDevedor = Math.max(0, totalLiquido - novoValorPago);
      let novoStatusFin = novoSaldoDevedor <= 0.01 ? "Pago" : "Parcial";
      const statusPedAtual = String(dados[i][18] || "").trim();

      abaVendas.getRange(i + 1, 16).setValue(novoStatusFin);
      abaVendas.getRange(i + 1, 17).setValue(novoValorPago);
      abaVendas.getRange(i + 1, 18).setValue(novoSaldoDevedor);

      // Se quitou totalmente e ainda constava como Aguardando Aprovação, promove a Finalizado e abate estoque
      if (novoSaldoDevedor <= 0.01 && (statusPedAtual === "Aguardando Aprovação" || statusPedAtual === "Pendente")) {
        abaVendas.getRange(i + 1, 19).setValue("Finalizado");
        abaterEstoqueDeVendaLoja(ssLoja, vendaId);
      }

      return { status: "sucesso", novoStatus: novoStatusFin, saldoRestante: novoSaldoDevedor };
    }
  }
  return { status: "erro", mensagem: "Venda não localizada." };
}

function atualizarStatusPedidoLoja(lojaId, pedidoId, novoStatus) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  const abaVendas = ssLoja.getSheetByName("Vendas");
  if (!abaVendas) return { status: "erro", mensagem: "Aba não encontrada." };
  const dados = abaVendas.getDataRange().getValues();

  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(pedidoId)) {
      const statusAnterior = dados[i][18];
      abaVendas.getRange(i + 1, 19).setValue(novoStatus);

      if (novoStatus === "Finalizado" && statusAnterior !== "Finalizado") {
        abaterEstoqueDeVendaLoja(ssLoja, pedidoId);
      }

      return { status: "sucesso" };
    }
  }
  return { status: "erro", mensagem: "Pedido não localizado." };
}

function abaterEstoqueDeVendaLoja(ssLoja, vendaId) {
  const abaItens = ssLoja.getSheetByName("Itens_Venda");
  const abaProdutos = ssLoja.getSheetByName("Produtos");
  if (!abaItens || !abaProdutos) return;

  const dadosI = abaItens.getDataRange().getValues();
  const dadosP = abaProdutos.getDataRange().getValues();

  const produtosMap = {};
  for (let p = 1; p < dadosP.length; p++) {
    produtosMap[String(dadosP[p][0])] = { linha: p + 1, estoque: Number(dadosP[p][8]) || 0 };
  }

  for (let i = 1; i < dadosI.length; i++) {
    if (String(dadosI[i][1]) === String(vendaId)) {
      const prodId = String(dadosI[i][2]);
      const qtd = Number(dadosI[i][5]);
      if (produtosMap[prodId]) {
        const novoEstoque = Math.max(0, produtosMap[prodId].estoque - qtd);
        abaProdutos.getRange(produtosMap[prodId].linha, 9).setValue(novoEstoque);
        produtosMap[prodId].estoque = novoEstoque;
      }
    }
  }
}

function estornarEstoqueDeVendaLoja(ssLoja, vendaId) {
  const abaItens = ssLoja.getSheetByName("Itens_Venda");
  const abaProdutos = ssLoja.getSheetByName("Produtos");
  if (!abaItens || !abaProdutos) return;

  const dadosI = abaItens.getDataRange().getValues();
  const dadosP = abaProdutos.getDataRange().getValues();

  const produtosMap = {};
  for (let p = 1; p < dadosP.length; p++) {
    produtosMap[String(dadosP[p][0])] = { linha: p + 1, estoque: Number(dadosP[p][8]) || 0 };
  }

  for (let i = 1; i < dadosI.length; i++) {
    if (String(dadosI[i][1]) === String(vendaId)) {
      const prodId = String(dadosI[i][2]);
      const qtd = Number(dadosI[i][5]) || 0;
      if (produtosMap[prodId]) {
        const info = produtosMap[prodId];
        const novoEstoque = info.estoque + qtd;
        abaProdutos.getRange(info.linha, 9).setValue(novoEstoque);
        info.estoque = novoEstoque;
      }
    }
  }
}

function cancelarVendaLoja(lojaId, vendaId, motivo) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  const abaVendas = ssLoja.getSheetByName("Vendas");
  if (!abaVendas) return { status: "erro", mensagem: "Aba Vendas não encontrada." };
  const dados = abaVendas.getDataRange().getValues();

  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(vendaId)) {
      const tipoVenda = String(dados[i][1] || "").trim();
      const statusAnterior = String(dados[i][18] || "").trim();
      const statusFinAnterior = String(dados[i][15] || "").trim();
      const valorPagoAnterior = Number(dados[i][16]) || 0;

      if (statusAnterior === "Cancelada") {
        return { status: "erro", mensagem: "Esta venda já se encontra cancelada." };
      }

      // Estorna quantidades vendidas apenas se o estoque tiver sido abatido anteriormente
      const estoqueFoiAbatido = (tipoVenda === "PDV" || statusAnterior === "Finalizado" || statusFinAnterior === "Pago" || valorPagoAnterior > 0);
      if (estoqueFoiAbatido) {
        estornarEstoqueDeVendaLoja(ssLoja, vendaId);
      }

      // Coluna 16: Status_Financeiro
      abaVendas.getRange(i + 1, 16).setValue("Cancelada");
      // Coluna 18: Saldo_Devedor (zerado)
      abaVendas.getRange(i + 1, 18).setValue(0);
      // Coluna 19: Status_Pedido
      abaVendas.getRange(i + 1, 19).setValue("Cancelada");
      // Coluna 23: Observações
      const obsAtual = String(dados[i][22] || "");
      const logCancel = `[CANCELADA em ${new Date().toLocaleString()}: ${motivo || 'Solicitado pelo lojista'}]`;
      abaVendas.getRange(i + 1, 23).setValue(obsAtual ? obsAtual + " | " + logCancel : logCancel);

      return { status: "sucesso", mensagem: "Venda cancelada e estoque estornado na planilha do Drive." };
    }
  }
  return { status: "erro", mensagem: "Venda não localizada." };
}

// ==============================================================================
// GESTÃO DE DESPESAS E CUSTOS OPERACIONAIS (FLUXO DE CAIXA REAL)
// ==============================================================================

function salvarDespesaLoja(lojaId, d) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  let aba = ssLoja.getSheetByName("Despesas");
  if (!aba) {
    criarAbaSeNaoExistir(ssLoja, "Despesas", ["ID", "Descricao", "Categoria", "Valor", "Data", "Observacoes"]);
    aba = ssLoja.getSheetByName("Despesas");
  }

  const dados = aba.getDataRange().getValues();
  const id = d.id || "DESP-" + Utilities.getUuid().substring(0, 8).toUpperCase();
  const data = d.data || new Date().toISOString().split("T")[0];

  let linhaIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(id)) {
      linhaIndex = i + 1;
      break;
    }
  }

  const linhaDados = [
    id,
    d.descricao || "Despesa",
    d.categoria || "Geral",
    Number(d.valor) || 0,
    data,
    d.observacoes || ""
  ];

  if (linhaIndex > 0) {
    aba.getRange(linhaIndex, 1, 1, linhaDados.length).setValues([linhaDados]);
  } else {
    aba.appendRow(linhaDados);
  }

  return { status: "sucesso", id: id };
}

function excluirDespesaLoja(lojaId, id) {
  const ssLoja = abrirPlanilhaDaLoja(lojaId);
  const aba = ssLoja.getSheetByName("Despesas");
  if (!aba) return { status: "erro", mensagem: "Aba Despesas não encontrada." };
  const dados = aba.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(id)) {
      aba.deleteRow(i + 1);
      return { status: "sucesso" };
    }
  }
  return { status: "erro", mensagem: "Despesa não encontrada." };
}

/**
 * Salva imagem no Google Drive.
 * Se lojaId for fornecido, a imagem é salva dentro da subpasta "Imagens"
 * da pasta exclusiva da respectiva loja.
 */
function salvarImagemNoDrive(nomeArquivo, base64Data, lojaId) {
  try {
    if (!base64Data || !base64Data.includes("base64,")) return base64Data;
    const partes = base64Data.split("base64,");
    const mimeTipo = partes[0].split(":")[1].split(";")[0];
    const decodedBytes = Utilities.base64Decode(partes[1]);
    const blob = Utilities.newBlob(decodedBytes, mimeTipo, nomeArquivo);

    let pastaDestino;
    if (lojaId) {
      const pastaLoja = obterOuCriarPastaDaLoja(lojaId);
      pastaDestino = obterOuCriarSubpastaImagensDaLoja(pastaLoja);
    } else {
      const pastaRaiz = obterPastaRaizSistema();
      const sub = pastaRaiz.getFoldersByName("Imagens_Master");
      pastaDestino = sub.hasNext() ? sub.next() : pastaRaiz.createFolder("Imagens_Master");
    }

    const arquivo = pastaDestino.createFile(blob);
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://lh3.googleusercontent.com/d/" + arquivo.getId();
  } catch (err) {
    Logger.log("Erro ao salvar foto: " + err);
    return "";
  }
}

function salvarSugestaoGlobal(lojaId, s) {
  const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ssMaster.getSheetByName("Sugestoes_Globais");
  if (!aba) {
    criarAbaSeNaoExistir(ssMaster, "Sugestoes_Globais", [
      "ID", "Loja_ID", "Titulo", "Categoria", "Descricao", "Autor", "Data_Envio", "Status"
    ]);
    aba = ssMaster.getSheetByName("Sugestoes_Globais");
  }

  const id = s.id || "SUG-" + Utilities.getUuid().substring(0, 6).toUpperCase();

  aba.appendRow([
    id,
    lojaId || "MASTER",
    s.titulo,
    s.categoria || "Geral",
    s.descricao,
    s.autor || "Anônimo",
    new Date().toISOString(),
    s.status || "Enviada"
  ]);

  return { status: "sucesso", id: id };
}
