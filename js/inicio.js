document.addEventListener("DOMContentLoaded", function () {
  const nomeUsuario = sessionStorage.getItem("NOME_USUARIO");
  console.log(nomeUsuario);
  const userNameElement = document.getElementById("userName");
  userNameElement.textContent = nomeUsuario;

  userNameElement.textContent = "Usuário";
});

async function carregarUltimaSolicitacao() {
  const usuarioId = sessionStorage.getItem("ID_USUARIO"); // o ID deve ser salvo no login
  console.log("passei por aqui");
  if (!usuarioId) {
    console.error("ID do usuário não encontrado no sessionStorage.");
    return;
  }

  try {
    const resposta = await fetch(`vaction/dashboard/ultima-solicitacao/${usuarioId}`);

    if (!resposta.ok) {
      throw new Error("Erro ao buscar última solicitação.");
    }

    const solicitacao = await resposta.json();
    console.log(solicitacao);
    // Preenche os campos no HTML
    document.getElementById("lastRequestPeriod").textContent = `${formatarData(solicitacao.dataInicio)} até ${formatarData(solicitacao.dataFim)}`;
    let statusNome = solicitacao.status?.nome || "Desconhecido";
    if (statusNome === "PENDENTE_RH") {
      statusNome = "Pendente";
    }
    document.getElementById("lastRequestStatus").textContent = statusNome;
    document.getElementById("lastRequestDate").textContent = formatarData(solicitacao.dataSolicitacao);
  } catch (erro) {
    console.error("Erro ao carregar última solicitação:", erro);
    document.getElementById("lastRequestPeriod").textContent = "Nenhuma solicitação";
    document.getElementById("lastRequestStatus").textContent = "N/A";
    document.getElementById("lastRequestDate").textContent = "N/A";
  }
}

carregarTempoParaFerias();

async function carregarTempoParaFerias() {
  const countdownEl = document.getElementById("vacationCountdown");
  const balanceEl = document.getElementById("vacationBalance");
  if (countdownEl) countdownEl.textContent = "Calculando...";
  if (balanceEl) balanceEl.textContent = "Calculando...";

  const usuarioId = sessionStorage.getItem("ID_USUARIO");
  console.log("passei por aqui");

  if (!usuarioId) {
    console.error("ID do usuário não encontrado no sessionStorage.");
    if (countdownEl) countdownEl.textContent = "Usuário não identificado.";
    if (balanceEl) balanceEl.textContent = "Usuário não identificado.";
    return;
  }

  try {
    const resp = await fetch(`vaction/dashboard/proximas-ferias/${usuarioId}`);
    if (!resp.ok) throw new Error("Erro ao buscar dados de férias.");

    const json = await resp.json();
    console.log("Resposta da API:", json);

    // O endpoint pode retornar [ { ... } ] ou { ... }
    const item = Array.isArray(json) ? json[0] : json;

    // -------- Tempo para próximas férias --------
    const diasRaw =
      item?.dias_Trabalho_Para_Atingir_15 ??
      item?.dias_trabalho_para_atingir_15 ??
      item?.diasParaFerias ??
      item?.dias_para_ferias;

    const dias = Number(diasRaw);

    if (Number.isFinite(dias)) {
      if (dias <= 0) {
        countdownEl.textContent = "Você já pode tirar férias!";
      } else {
        const textoDias = (Number.isInteger(dias) && Math.abs(dias) === 1) ? "dia" : "dias";
        countdownEl.textContent = `${formataDias(dias)} ${textoDias} restantes para suas próximas férias.`;
      }
    } else {
      countdownEl.textContent = "Não foi possível calcular o tempo para as férias.";
    }

    // -------- Saldo de dias de férias --------
    const saldoRaw = item?.saldo_Ferias ?? item?.saldoFerias ?? item?.saldo_de_ferias;
    const saldo = Math.floor(Number(saldoRaw)); //  Arredonda sempre para baixo
    if (Number.isFinite(saldo)) {
      if (saldo <= 0) {
        balanceEl.textContent = "Sem saldo de férias disponível.";
      } else {
        balanceEl.textContent = `${saldo} ${saldo === 1 ? "dia" : "dias"} disponíveis.`;
      }
    } else {
      balanceEl.textContent = "Não foi possível obter o saldo de férias.";
    }
  } catch (erro) {
    console.error("Erro ao carregar dados de férias:", erro);
    if (countdownEl) countdownEl.textContent = "Erro ao carregar informações.";
    if (balanceEl) balanceEl.textContent = "Erro ao carregar informações.";
  }

  // Formata dias: inteiro sem casas; decimal com 1 casa (ex.: 22,5)
  function formataDias(n) {
    if (!Number.isFinite(n)) return "";
    return Number.isInteger(n)
      ? String(n)
      : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
  }
}

nomeUsuario();

async function nomeUsuario() {
  const usuarioId = sessionStorage.getItem("ID_USUARIO");
  if (!usuarioId) {
    console.error("ID_USUARIO não encontrado no sessionStorage.");
    return;
  }

  try {
    const resposta = await fetch(`vaction/usuarios`);

    if (!resposta.ok) {
      throw new Error("Erro ao buscar usuários.");
    }

    const usuarios = await resposta.json();

    // Encontra apenas o usuário cujo id seja igual ao armazenado
    const usuarioLogado = usuarios.find(u => u.id === parseInt(usuarioId));

    if (!usuarioLogado) {
      console.error("Usuário não encontrado na lista retornada.");
      return;
    }

    // Atualiza o nome na interface
    const userNameElement = document.getElementById("userName");
    if (userNameElement) {
      console.log(usuarioLogado.nome);
      userNameElement.textContent = usuarioLogado.nome;
    }
  } catch (erro) {
    console.error("Erro ao carregar usuário:", erro);
  }
}

// Função auxiliar para formatar datas (aaaa-mm-dd → dd/mm/aaaa)
function formatarData(dataString) {
  if (!dataString) return "N/A";
  const data = new Date(dataString);
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

async function carregarNotificacoesRecentes() {
  const usuarioId = sessionStorage.getItem("ID_USUARIO");
  if (!usuarioId) {
    console.error("ID do usuário não encontrado no sessionStorage.");
    return;
  }

  try {
    const resposta = await fetch(`vaction/dashboard/notificacoes/${usuarioId}`);

    if (!resposta.ok) {
      throw new Error("Erro ao buscar notificações.");
    }

    const notificacoes = await resposta.json(); // Espera um array no formato do mock

    const listaNotificacoes = document.getElementById("notificationsList");
    listaNotificacoes.innerHTML = ""; // Limpa a lista

    if (notificacoes.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Nenhuma notificação no momento.";
      li.classList.add("notification-item", "empty");
      listaNotificacoes.appendChild(li);
      return;
    }

    // Ordenão: Ordena do mais recente para o mais antigo
    notificacoes.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limita a 5 notificações recentes (opcional)
    notificacoes.slice(0, 5).forEach(notif => {
      const li = document.createElement("li");
      li.classList.add("notification-item");

      const dataFormatada = formatarData(notif.date);
      const icone = notif.message.includes("pendente") ? "fa-exclamation-circle pending" :
        notif.message.includes("aprovada") ? "fa-check-circle approved" :
          "fa-info-circle";

      li.innerHTML = `
            <i class="fas ${icone}"></i>
            <div class="notification-content">
                <p>${notif.message}</p>
                <span class="notification-date">${dataFormatada}</span>
            </div>
        `;

      listaNotificacoes.appendChild(li);
    });

  } catch (erro) {
    console.error("Erro ao carregar notificações:", erro);
    const listaNotificacoes = document.getElementById("notificationsList");
    listaNotificacoes.innerHTML = '<li class="notification-item empty">Erro ao carregar notificações.</li>';
  }
}
carregarSlaMedioProcesso()
async function carregarSlaMedioProcesso() {
  const alvo = document.getElementById('avgSLA');
  if (!alvo) return; // card pode estar oculto pelo data-role

  const usuarioId = sessionStorage.getItem('ID_USUARIO');
  if (!usuarioId) {
    console.error("ID do usuário não encontrado no sessionStorage.");
    alvo.textContent = "Usuário não identificado.";
    return;
  }

  try {
    const resp = await fetch(`vaction/dashboard/sla-medio/${usuarioId}`);
    if (!resp.ok) throw new Error("Erro ao buscar SLA médio.");

    const valor = await resp.json(); // número direto (ex: 5.3)
    if (valor !== null && valor !== undefined && !isNaN(valor)) {
      alvo.textContent = `${Number(valor).toFixed(1)} dias`;
    } else {
      alvo.textContent = "Não disponível";
    }
  } catch (erro) {
    console.error("Erro ao carregar SLA médio:", erro);
    alvo.textContent = "Erro ao carregar";
  }
}
carregarChamadosPendentes()
async function carregarChamadosPendentes() {
  const alvo = document.getElementById('pendingRequests');
  if (!alvo) return; // pode estar oculto pelo data-role

  const usuarioId = sessionStorage.getItem('ID_USUARIO');
  if (!usuarioId) {
    console.error("ID do usuário não encontrado no sessionStorage.");
    alvo.textContent = "Usuário não identificado.";
    return;
  }

  try {
    const resp = await fetch(`vaction/dashboard/chamados-pendentes/${usuarioId}`);
    if (!resp.ok) throw new Error("Erro ao buscar chamados pendentes.");

    const data = await resp.json();
    const total = Array.isArray(data) ? data.length : 0;
console.log(data)
    alvo.textContent = `${total} ${total === 1 ? 'chamado pendente' : 'chamados pendentes'}`;
  } catch (erro) {
    console.error("Erro ao carregar chamados pendentes:", erro);
    alvo.textContent = "Erro ao carregar";
  }
}
carregarDisponibilidadeEquipeResumo()
async function carregarDisponibilidadeEquipeResumo() {
  const canvas = document.getElementById('teamAvailabilityChart');
  if (!canvas) return; // card pode estar oculto pelo data-role

  // cria/pega o <p> de resumo abaixo do canvas
  let summary = document.getElementById('teamAvailabilitySummary');
  if (!summary) {
    summary = document.createElement('p');
    summary.id = 'teamAvailabilitySummary';
    summary.textContent = 'Calculando...';
    canvas.insertAdjacentElement('afterend', summary);
  } else {
    summary.textContent = 'Calculando...';
  }

  const gestorId = sessionStorage.getItem('ID_USUARIO');
  if (!gestorId) {
    console.error('ID do gestor não encontrado no sessionStorage.');
    summary.textContent = 'Usuário não identificado.';
    return;
  }

  try {
    const resp = await fetch(`vaction/dashboard/disponibilidade-equipe/${gestorId}`);
    if (!resp.ok) throw new Error('Erro ao buscar disponibilidade da equipe.');

    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      summary.textContent = 'Sem dados de equipe.';
      return;
    }
console.log
    const item = data[0] || {};
    // usa exatamente os campos que seu back já manda
    const disponiveis = Number(item.disponiveis ?? item.Disponiveis ?? item.qtdDisponiveis ?? 0);
    const total = Number(item.total_Colaboradores ?? item.totalColaboradores ?? item.total ?? 0);

    if (Number.isFinite(disponiveis) && Number.isFinite(total)) {
      summary.textContent = `${disponiveis} de ${total} disponíveis`;
    } else {
      summary.textContent = 'Não disponível';
    }

    // (opcional) esconder o canvas já que o card é só texto
    canvas.style.display = 'none';

  } catch (erro) {
    console.error('Erro ao carregar disponibilidade da equipe:', erro);
    summary.textContent = 'Erro ao carregar.';
  }
}




document.addEventListener('DOMContentLoaded', function () {
  const userNameElement = document.getElementById('userName');
  const lastRequestPeriod = document.getElementById('lastRequestPeriod');
  const lastRequestStatus = document.getElementById('lastRequestStatus');
  const lastRequestDate = document.getElementById('lastRequestDate');
  const vacationCountdown = document.getElementById('vacationCountdown');
  const vacationBalance = document.getElementById('vacationBalance');
  const notificationsList = document.getElementById('notificationsList');
  const teamVacationsChartContainer = document.getElementById('teamVacationsChartContainer');
  const teamVacationsChartCanvas = document.getElementById('teamVacationsChart');
  const notifications = [
    { message: 'Sua solicitação de férias (01/06/2025 - 15/06/2025) está pendente.', date: '2025-05-01' },
    { message: 'Sua solicitação de férias (05/04/2024 - 26/04/2024) foi aprovada.', date: '2024-03-15' }
  ];
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  //     function loadTeamVacationsChart() {
  //         if (currentUser.role !== 'Gerente' && currentUser.role !== 'Diretor') {
  //             return;
  //         }
  //         teamVacationsChartContainer.style.display = 'block';
  //         const teamRequests = requests.filter(request => request.userId !== currentUser.id && request.department === currentUser.department);
  //         const projectRequests = requests.filter(request => request.userId !== currentUser.id && request.project === currentUser.project);
  //         const teamMonths = Array(12).fill(0);
  //         const projectMonths = Array(12).fill(0);
  //         teamRequests.forEach(request => {
  //             const startDate = new Date(request.startDate);
  //             const month = startDate.getMonth();
  //             teamMonths[month]++;
  //         });
  //         projectRequests.forEach(request => {
  //             const startDate = new Date(request.startDate);
  //             const month = startDate.getMonth();
  //             projectMonths[month]++;
  //         });
  //         const ctx = teamVacationsChartCanvas.getContext('2d');
  //         new Chart(ctx, {
  //             type: 'bar',
  //             data: {
  //                 labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  //                 datasets: [
  //                     {
  //                         label: 'Colaboradores',
  //                         data: teamMonths,
  //                         backgroundColor: 'rgba(52, 199, 89, 0.8)',
  //                         borderColor: '#34c759',
  //                         borderWidth: 1
  //                     }
  //                 ]
  //             },
  //             options: {
  //                 scales: {
  //                     y: {
  //                         beginAtZero: true,
  //                         title: {
  //                             display: true,
  //                             text: 'Número de Pessoas em Férias',
  //                             font: {
  //                                 family: 'Poppins',
  //                                 size: 14,
  //                                 weight: '600'
  //                             },
  //                             color: '#120052'
  //                         },
  //                         ticks: {
  //                             color: '#374151'
  //                         }
  //                     },
  //                     x: {
  //                         title: {
  //                             display: true,
  //                             text: 'Mês',
  //                             font: {
  //                                 family: 'Poppins',
  //                                 size: 14,
  //                                 weight: '600'
  //                             },
  //                             color: '#120052'
  //                         },
  //                         ticks: {
  //                             color: '#374151'
  //                         }
  //                     }
  //                 },
  //                 plugins: {
  //                     legend: {
  //                         labels: {
  //                             font: {
  //                                 family: 'Poppins',
  //                                 size: 12
  //                             },
  //                             color: '#120052'
  //                         }
  //                     }
  //                 }
  //             }
  //         });
  //     }
  //     loadTeamVacationsChart();



carregarGraficoFeriasEquipe()
async function carregarGraficoFeriasEquipe() {
  const container = document.getElementById('teamVacationsChartContainer');
  const canvas    = document.getElementById('teamVacationsChart');
  if (!container || !canvas) return;

  // (Opcional) só mostra para Gestor, mantendo sua regra de visibilidade
//  const nivel = (sessionStorage.getItem('NIVEL_ACESSO') || '').toUpperCase();
//  if (nivel !== 'GESTOR') return;

  // Pega o id da empresa da sessão (ajuste se usar outra key)
  const empresaId = sessionStorage.getItem('id_empresa') || sessionStorage.getItem('FK_EMPRESA');
  if (!empresaId) {
    console.error('ID_EMPRESA não encontrado na sessionStorage.');
    return;
  }

  try {
    const resp = await fetch(`vaction/dashboard/analise-ferias-mes/${encodeURIComponent(empresaId)}`);
    if (!resp.ok) throw new Error('Erro ao buscar análise de férias por mês');
    const json = await resp.json();

    // Pega o primeiro objeto do array (pelo seu exemplo)
    const obj = (Array.isArray(json) && json[0]) ? json[0] : (json || {});

    // Mapa de aliases -> chave normalizada (PT-BR)
    // Aceita tanto "sept"->"set" quanto "oct"->"out"
    const alias = {
      jan: 'jan', fev: 'fev', mar: 'mar', abr: 'abr', mai: 'mai',
      jun: 'jun', jul: 'jul', ago: 'ago',
      set: 'set', sept: 'set',
      out: 'out', oct: 'out',
      nov: 'nov', dez: 'dez'
    };

    // Ordem e labels do gráfico
    const ordemMeses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const labels     = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    // Lê valores do objeto, aceitando aliases
    const valores = ordemMeses.map(chave => {
      // procura qualquer alias que mapeie para a chave desejada
      const candidatos = Object.keys(alias).filter(k => alias[k] === chave);
      for (const k of candidatos) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          const v = Number(obj[k]);
          return Number.isFinite(v) ? v : 0;
        }
      }
      return 0;
    });

    // Mostra o container
    container.style.display = '';

    // Destroi gráfico anterior (se houver) para evitar duplicar
    if (window.__teamVacationsChart__) {
      window.__teamVacationsChart__.destroy();
    }

    const ctx = canvas.getContext('2d');
    window.__teamVacationsChart__ = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Pessoas em férias',
          data: valores,
          borderWidth: 1
          // (cores default do Chart.js; se quiser, adicione backgroundColor/borderColor)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Número de Pessoas em Férias' }
          },
          x: {
            title: { display: true, text: 'Mês' }
          }
        },
        plugins: {
          legend: { display: true }
        }
      }
    });

  } catch (e) {
    console.error('Erro em carregarGraficoFeriasEquipe:', e);
  }
}








});

document.addEventListener("DOMContentLoaded", async () => {
  await carregarUltimaSolicitacao();
  await carregarNotificacoesRecentes();
});
document.addEventListener('DOMContentLoaded', function aplicarVisibilidadePorNivel() {
  // Lê o nível salvo (GESTOR | RH | COLABORADOR). Padrão: COLABORADOR
  const nivel = (sessionStorage.getItem('NIVEL_ACESSO') || 'COLABORADOR').toUpperCase();

  // Quais "data-role" cada nível pode ver
  const mapa = {
    COLABORADOR: new Set(['all']),
    GESTOR:      new Set(['all', 'gestor', 'rh-gestor']),
    RH:          new Set(['all', 'rh', 'rh-gestor'])
  };

  const permitidos = mapa[nivel] || mapa.COLABORADOR;

  // Mostra/oculta cada card conforme o atributo data-role
  document.querySelectorAll('.cards-container .card').forEach(card => {
    const role = (card.getAttribute('data-role') || 'all').toLowerCase();
    card.style.display = permitidos.has(role) ? '' : 'none';
  });

  // (Opcional) Se ainda quiser controlar o bloco extra "Férias da Equipe"
  // fora dos cards, mantenha-o visível apenas para GESTOR
  const equipeExtra = document.getElementById('teamVacationsChartContainer');
  if (equipeExtra) {
    equipeExtra.style.display = (nivel === 'GESTOR') ? '' : 'none';
  }
});