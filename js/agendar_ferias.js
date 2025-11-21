// ===============================
// AGENDAR_FERIAS.JS
// Envia solicitação direta ao endpoint (sem simulação)
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
  const vacationForm = document.getElementById('vacationForm');
  const nameEl = document.getElementById('name');
  const deptEl = document.getElementById('department');
  const roleEl = document.getElementById('role');

  let usuarioAtual = null; // guarda o usuário logado

  // ---- 1) Carrega o usuário e preenche os campos ----
  try {
    await carregarUsuario();
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

    if (startDate > endDate) {
      Swal.fire('Erro', 'A data inicial deve ser anterior à data final.', 'error');
      return;
    }

    // ---- monta payload exatamente como no Postman ----
try {
  // ---- monta payload exatamente como no Postman ----
  const resposta = await fetch('vaction/pedido/solicitar', {
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

    const resp = await fetch('vaction/usuarios');
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
