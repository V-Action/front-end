// ===============================
// AGENDAR_FERIAS.JS
// Envia solicitação direta ao endpoint (sem simulação)
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
  const vacationForm = document.getElementById('vacationForm');
  const nameEl = document.getElementById('name');
  const deptEl = document.getElementById('department');
  const roleEl = document.getElementById('role');

  let usuarioAtual = null;      // guarda o usuário logado
  let saldoFeriasDias = 0;      // saldo de férias em dias (mesma lógica da tela início)

  // ---- 1) Carrega o usuário, saldo e preenche os campos ----
  try {
    await carregarUsuario();
    await carregarSaldoFerias();    // usa mesma consulta/forma do inicio.js
    preencherCampos();
  } catch (erro) {
    console.error(erro);
    Swal.fire('Erro', 'Falha ao carregar dados do usuário.', 'error');
  }

  // ---- 2) Quando o formulário for enviado ----
  vacationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!usuarioAtual) {
      Swal.fire('Atenção', 'Usuário não encontrado.', 'warning');
      return;
    }

    const formData = new FormData(vacationForm);
    const startDateStr = formData.get('startDate');
    const endDateStr   = formData.get('endDate');

    if (!startDateStr || !endDateStr) {
      Swal.fire('Erro', 'Selecione as datas inicial e final.', 'error');
      return;
    }

    const startDate = new Date(startDateStr);
    const endDate   = new Date(endDateStr);
    startDate.setHours(0,0,0,0);
    endDate.setHours(0,0,0,0);

    // 2.1) NÃO PERMITIR DATA FIM ANTES DA DATA INÍCIO
    if (startDate > endDate) {
      Swal.fire('Erro', 'A data inicial deve ser anterior à data final.', 'error');
      return;
    }

    // 2.2) CALCULAR QUANTIDADE DE DIAS DE FÉRIAS (período inclusivo)
    const MS_POR_DIA = 1000 * 60 * 60 * 24;
    const diffMs = endDate.getTime() - startDate.getTime();
    const diasPeriodo = Math.floor(diffMs / MS_POR_DIA) + 1;

    // 2.3) NÃO PERMITIR AGENDAR MENOS QUE 15 DIAS DE FÉRIAS
    if (diasPeriodo < 15) {
      Swal.fire('Erro', 'O período mínimo de férias é de 15 dias.', 'error');
      return;
    }

    // 2.4) SÓ PERMITIR SE O SALDO DE FÉRIAS FOR SUPERIOR A 15 DIAS
    if (saldoFeriasDias <= 15) {
      Swal.fire(
        'Saldo insuficiente',
        'Seu saldo de férias deve ser superior a 15 dias para agendar.',
        'warning'
      );
      return;
    }

    // (Opcional) Se quiser também impedir ultrapassar o saldo:
    // if (diasPeriodo > saldoFeriasDias) {
    //   Swal.fire(
    //     'Saldo insuficiente',
    //     `Você está tentando solicitar ${diasPeriodo} dias, mas seu saldo é de ${saldoFeriasDias} dias.`,
    //     'warning'
    //   );
    //   return;
    // }

    // ---- 2.5) Monta payload exatamente como no Postman ----
    try {
      const resposta = await fetch('http://localhost:8080/vaction/pedido/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataInicio: formatDateISO(startDate),
          dataFim: formatDateISO(endDate),
          usuario: { id: usuarioAtual.id }
        })
      });

      if (!resposta.ok) {
        const txt = await resposta.text();
        throw new Error(txt || `Erro HTTP ${resposta.status}`);
      }

      Swal.fire({
        icon: 'success',
        title: 'Solicitação enviada!',
        text: 'Aguardando aprovação do seu superior.',
        timer: 2000,
        showConfirmButton: false
      });

      vacationForm.reset();
      preencherCampos(); // repõe nome/área/cargo

    } catch (err) {
      console.error(err);
      Swal.fire('Erro', err.message || 'Falha ao enviar solicitação.', 'error');
    }
  });

  // ---- 3) Funções auxiliares ----
  async function carregarUsuario() {
    const usuarioId = sessionStorage.getItem('ID_USUARIO');
    if (!usuarioId) throw new Error('ID_USUARIO não encontrado no sessionStorage.');

    const resp = await fetch('http://localhost:8080/vaction/usuarios');
    if (!resp.ok) throw new Error('Erro ao buscar usuários.');

    const lista = await resp.json();
    const encontrado = lista.find(u => u.id === parseInt(usuarioId, 10));
    if (!encontrado) throw new Error('Usuário não encontrado na lista.');

    usuarioAtual = {
      id: encontrado.id,
      nome: encontrado.nome,
      area: encontrado.area,
      cargo: encontrado.cargo
    };
  }

  // ---- NOVO: saldo de férias, igual à lógica do inicio.js ----
  async function carregarSaldoFerias() {
    const usuarioId = sessionStorage.getItem("ID_USUARIO");
    if (!usuarioId) {
      console.error("ID do usuário não encontrado no sessionStorage.");
      saldoFeriasDias = 0;
      return;
    }

    try {
      const resp = await fetch(`http://localhost:8080/vaction/dashboard/proximas-ferias/${usuarioId}`);
      if (!resp.ok) throw new Error("Erro ao buscar dados de férias.");

      const json = await resp.json();
      console.log("Resposta da API (saldo agendar):", json);

      // O endpoint pode retornar [ { ... } ] ou { ... }
      const item = Array.isArray(json) ? json[0] : json;

      // Mesmos aliases usados na tela de início
      const saldoRaw =
        item?.saldo_Ferias ??
        item?.saldoFerias ??
        item?.saldo_de_ferias;

      const saldo = Math.floor(Number(saldoRaw)); // arredonda sempre para baixo

      if (Number.isFinite(saldo)) {
        saldoFeriasDias = saldo;
      } else {
        console.warn("Não foi possível obter um saldo numérico de férias.");
        saldoFeriasDias = 0;
      }
    } catch (erro) {
      console.error("Erro ao carregar saldo de férias:", erro);
      saldoFeriasDias = 0;
    }
  }

  function preencherCampos() {
    if (!usuarioAtual) return;
    if (nameEl) nameEl.value = usuarioAtual.nome || '';
    if (deptEl) deptEl.value = usuarioAtual.area || '';
    if (roleEl) roleEl.value = usuarioAtual.cargo || '';
  }

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
});
