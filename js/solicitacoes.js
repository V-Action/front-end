document.addEventListener('DOMContentLoaded', function() {
    // ========= ELEMENTOS DO DOM =========
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const myRequestsTableBody = document.getElementById('myRequestsTableBody');
    const approveRequestsTableBody = document.getElementById('approveRequestsTableBody');
    const approveTab = document.getElementById('approveTab');
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModal = document.getElementById('closeModal');
    const modalCloseButton = document.getElementById('modalCloseButton');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');

    // ========= USUÁRIO LOGADO + PERMISSIONAMENTO =========
    const usuarioIdStr = sessionStorage.getItem('ID_USUARIO');
    const nivelAcesso = (sessionStorage.getItem('NIVEL_ACESSO') || 'COLABORADOR').toUpperCase();

    const currentUser = {
        id: usuarioIdStr ? parseInt(usuarioIdStr, 10) : null,
        name: sessionStorage.getItem('NOME_USUARIO') || '',
        department: sessionStorage.getItem('AREA_USUARIO') || '',
        role: sessionStorage.getItem('CARGO_USUARIO') || '',
        nivel: nivelAcesso
    };

    // Colaborador NÃO vê a aba de aprovar
    if (nivelAcesso !== 'GESTOR' && nivelAcesso !== 'RH') {
        approveTab.style.display = 'none';
    }

    // ========= ARRAYS SEPARADOS =========
    let myRequests = [];        // "Suas Solicitações"
    let pendingRequests = [];   // "Aprovar Solicitações"

    // ========= FUNÇÃO PARA FORMATAR DATA =========
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'N/A';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // ========= NORMALIZAR PEDIDO VINDO DO BACK =========
    function normalizarPedido(item) {
        const usuario =
            item.usuario ||
            item.colaborador ||
            item.user ||
            {};

        const userId =
            usuario.id ??
            item.fk_usuario ??
            item.userId ??
            null;

        const nome =
            usuario.nome ??
            item.nomeUsuario ??
            item.nomeColaborador ??
            item.nome ??
            '';

        const area =
            usuario.area ??
            usuario.departamento ??
            item.area ??
            item.departamento ??
            '';

        const cargo =
            usuario.cargo ??
            item.cargo ??
            '';

        const startDate =
            item.data_inicio ??
            item.dataInicio ??
            item.startDate ??
            null;

        const endDate =
            item.data_fim ??
            item.dataFim ??
            item.endDate ??
            null;

        const requestDate =
            item.data_solicitacao ??
            item.dataSolicitacao ??
            item.requestDate ??
            item.createdAt ??
            null;

        const statusTexto =
            item.status?.nome ??
            item.nomeStatus ??
            item.status ??
            '';

        return {
            id: item.id ?? item.id_pedido ?? item.idPedido,
            userId,
            name: nome,
            department: area,
            role: cargo,
            startDate,
            endDate,
            requestDate,
            status: statusTexto
        };
    }

    // ========= 1) CARREGAR "SUAS SOLICITAÇÕES" DO BACK =========
    async function carregarMinhasSolicitacoes() {
        if (!currentUser.id) {
            myRequests = [];
            loadMyRequests();
            return;
        }

        try {
            // Ajuste este endpoint conforme o seu back:
            // Ex.: GET vaction/pedidos/usuario/{idUsuario}
            const resp = await fetch(`vaction/pedidos/usuario/${currentUser.id}`);
            if (!resp.ok) {
                throw new Error('Erro ao buscar suas solicitações.');
            }

            const json = await resp.json();
            const lista = Array.isArray(json) ? json : (json ? [json] : []);
            myRequests = lista.map(normalizarPedido);
        } catch (erro) {
            console.error('Erro ao carregar suas solicitações:', erro);
            myRequests = [];
        }

        loadMyRequests();
    }

    // ========= 2) CARREGAR "SOLICITAÇÕES PENDENTES PARA APROVAR" DO BACK =========
    async function carregarSolicitacoesPendentes() {
        // Se não for gestor nem RH, não faz nada
        if (nivelAcesso !== 'GESTOR' && nivelAcesso !== 'RH') {
            pendingRequests = [];
            loadApproveRequests();
            return;
        }

        if (!currentUser.id) {
            pendingRequests = [];
            loadApproveRequests();
            return;
        }

        try {
            // Ajuste este endpoint conforme o seu back:
            // Ex.: GET vaction/pedidos/pendentes/{idAprovador}
            const resp = await fetch(`vaction/pedidos/pendentes/${currentUser.id}`);
            if (!resp.ok) {
                throw new Error('Erro ao buscar solicitações pendentes para aprovação.');
            }

            const json = await resp.json();
            const lista = Array.isArray(json) ? json : (json ? [json] : []);
            pendingRequests = lista.map(normalizarPedido);
        } catch (erro) {
            console.error('Erro ao carregar solicitações pendentes:', erro);
            pendingRequests = [];
        }

        loadApproveRequests();
    }

    // ========= RENDER "SUAS SOLICITAÇÕES" =========
    function loadMyRequests() {
        myRequestsTableBody.innerHTML = '';

        if (!currentUser.id) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6">Usuário não identificado.</td>`;
            myRequestsTableBody.appendChild(row);
            return;
        }

        if (myRequests.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6">Nenhuma solicitação encontrada.</td>`;
            myRequestsTableBody.appendChild(row);
            return;
        }

        myRequests.forEach(request => {
            const statusClass = (request.status || '').toLowerCase().replace(/\s+/g, '-');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.name || '-'}</td>
                <td>${request.department || '-'}</td>
                <td>${request.role || '-'}</td>
                <td>${formatDate(request.startDate)} - ${formatDate(request.endDate)}</td>
                <td class="status-${statusClass}">${request.status || '-'}</td>
                <td>${formatDate(request.requestDate)}</td>
            `;
            myRequestsTableBody.appendChild(row);
        });
    }

    // ========= RENDER "APROVAR SOLICITAÇÕES" =========
    function loadApproveRequests() {
        approveRequestsTableBody.innerHTML = '';

        // Colaborador não deveria ver essa aba (já está oculta)
        if (nivelAcesso !== 'GESTOR' && nivelAcesso !== 'RH') {
            return;
        }

        if (pendingRequests.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6">Nenhuma solicitação pendente para aprovação.</td>`;
            approveRequestsTableBody.appendChild(row);
            return;
        }

        pendingRequests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.name || '-'}</td>
                <td>${request.department || '-'}</td>
                <td>${request.role || '-'}</td>
                <td>${formatDate(request.startDate)} - ${formatDate(request.endDate)}</td>
                <td>${formatDate(request.requestDate)}</td>
                <td>
                    <button class="action-button approve" data-id="${request.id}">Aprovar</button>
                    <button class="action-button reject" data-id="${request.id}">Rejeitar</button>
                </td>
            `;
            approveRequestsTableBody.appendChild(row);
        });

        // Eventos dos botões de ação
        document.querySelectorAll('.action-button').forEach(button => {
            button.addEventListener('click', function() {
                const requestId = parseInt(this.getAttribute('data-id'), 10);
                const actionLabel = this.classList.contains('approve') ? 'Aprovado' : 'Rejeitado';
                handleRequestAction(requestId, actionLabel);
            });
        });
    }

    // ========= APROVAR / REJEITAR SOLICITAÇÃO (COM MOTIVO) =========
    async function handleRequestAction(requestId, actionLabel) {
        let motivo = null;
        let decisaoBackend = null;

        if (actionLabel === 'Rejeitado') {
            // Pop-up simples para motivo da rejeição
            motivo = window.prompt('Informe o motivo da rejeição (obrigatório):');
            if (motivo === null) {
                // Usuário cancelou o prompt
                return;
            }
            motivo = motivo.trim();
            if (!motivo) {
                alert('É necessário informar um motivo para rejeitar a solicitação.');
                return;
            }
            decisaoBackend = 'REPROVADO';
        } else {
            decisaoBackend = 'APROVADO';
        }

        try {
            // TODO: Ajustar endpoint e payload conforme o seu backend
            // Exemplo:
            /*
            const resp = await fetch(`vaction/pedidos/${requestId}/decisao`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decisao: decisaoBackend,    // APROVADO | REPROVADO
                    motivo: motivo || null,     // motivo só na rejeição
                    usuarioId: currentUser.id   // quem aprovou/rejeitou
                })
            });
            if (!resp.ok) {
                throw new Error('Erro ao atualizar a solicitação.');
            }
            */

            // Atualiza localmente para refletir na tela
            myRequests = myRequests.map(r =>
                r.id === requestId ? { ...r, status: actionLabel } : r
            );
            pendingRequests = pendingRequests.filter(r => r.id !== requestId);

            modalTitle.textContent =
                actionLabel === 'Aprovado'
                    ? 'Solicitação Aprovada'
                    : 'Solicitação Rejeitada';

            modalMessage.textContent =
                actionLabel === 'Aprovado'
                    ? 'A solicitação foi aprovada com sucesso.'
                    : 'A solicitação foi rejeitada com sucesso.';

            confirmationModal.style.display = 'block';

            loadMyRequests();
            loadApproveRequests();
        } catch (erro) {
            console.error('Erro ao processar ação:', erro);
            modalTitle.textContent = 'Erro';
            modalMessage.textContent = 'Não foi possível atualizar a solicitação.';
            confirmationModal.style.display = 'block';
        }
    }

    // ========= ALTERNAR ABAS =========
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');

            const tabId = this.getAttribute('data-tab');
            this.classList.add('active');
            document.getElementById(tabId).style.display = 'block';
        });
    });

    // ========= FECHAR MODAL =========
    closeModal.addEventListener('click', function() {
        confirmationModal.style.display = 'none';
    });

    modalCloseButton.addEventListener('click', function() {
        confirmationModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });

    // ========= FLUXO INICIAL =========
    (async () => {
        await carregarMinhasSolicitacoes();      // endpoint 1: por usuário
        await carregarSolicitacoesPendentes();   // endpoint 2: pendentes para aprovar
    })();
});
