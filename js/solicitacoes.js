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
    
    // Modal de Rejeição
    const rejectionModal = document.getElementById('rejectionModal');
    const closeRejectionModal = document.getElementById('closeRejectionModal');
    const cancelRejection = document.getElementById('cancelRejection');
    const confirmRejection = document.getElementById('confirmRejection');
    const rejectionReason = document.getElementById('rejectionReason');
    let currentRejectionRequestId = null;

    // ========= USUÁRIO LOGADO + PERMISSIONAMENTO =========
    const usuarioIdStr = sessionStorage.getItem('ID_USUARIO');
    let nivelAcesso = sessionStorage.getItem('NIVEL_ACESSO') || 'COLABORADOR';

    // Garantir que está em maiúsculas e tratar diferentes formatos
    if (nivelAcesso) {
        // Se for um objeto stringificado, tenta parsear
        if (typeof nivelAcesso === 'string' && nivelAcesso.startsWith('{')) {
            try {
                const parsed = JSON.parse(nivelAcesso);
                nivelAcesso = parsed.nome || parsed.descricao || 'COLABORADOR';
            } catch (e) {
                // Se falhar, mantém o valor original
            }
        }
        // Se vier como objeto aninhado (ex: "COLABORADOR" ou objeto com .nome)
        if (typeof nivelAcesso === 'object' && nivelAcesso !== null) {
            nivelAcesso = nivelAcesso.nome || nivelAcesso.descricao || 'COLABORADOR';
        }
    }

    nivelAcesso = String(nivelAcesso).toUpperCase().trim();

    const currentUser = {
        id: usuarioIdStr ? parseInt(usuarioIdStr, 10) : null,
        name: sessionStorage.getItem('NOME_USUARIO') || '',
        department: sessionStorage.getItem('AREA_USUARIO') || '',
        role: sessionStorage.getItem('CARGO_USUARIO') || '',
        nivel: nivelAcesso
    };

    // Debug: verificar valores
    console.log('Nível de Acesso:', nivelAcesso);
    console.log('Elemento approveTab:', approveTab);

    // Colaborador NÃO vê a aba de aprovar
    if (nivelAcesso !== 'GESTOR' && nivelAcesso !== 'RH') {
        if (approveTab) {
            approveTab.style.display = 'none';
            console.log('Aba "Aprovar Solicitações" ocultada para:', nivelAcesso);
        } else {
            console.error('Elemento approveTab não encontrado!');
        }
    } else {
        console.log('Aba "Aprovar Solicitações" visível para:', nivelAcesso);
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
            // Endpoint: GET vaction/pedido/usuario/{idUsuario}
            const resp = await fetch(`/vaction/pedido/usuario/${currentUser.id}`);
            if (!resp.ok && resp.status !== 204) {
                throw new Error('Erro ao buscar suas solicitações.');
            }
            if (resp.status === 204) {
                myRequests = [];
                loadMyRequests();
                return;
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
            // Endpoint: GET vaction/pedido/pendentes/{idAprovador}
            const resp = await fetch(`/vaction/pedido/pendentes/${currentUser.id}`);
            if (!resp.ok && resp.status !== 204) {
                throw new Error('Erro ao buscar solicitações pendentes para aprovação.');
            }
            if (resp.status === 204) {
                pendingRequests = [];
                loadApproveRequests();
                return;
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
        if (actionLabel === 'Rejeitado') {
            // Abre modal de justificativa para rejeição
            currentRejectionRequestId = requestId;
            rejectionReason.value = '';
            rejectionModal.style.display = 'block';
            return;
        }

        // Se for aprovação, processa diretamente
        await processarAprovacao(requestId);
    }

    // ========= PROCESSAR APROVAÇÃO =========
    async function processarAprovacao(requestId) {
        try {
            const payload = {
                pedido: {
                    id: requestId
                },
                usuario: {
                    id: currentUser.id
                },
                decisao: {
                    id: 1,
                    nome: 'APROVADO'
                },
                observacao: null
            };

            const resp = await fetch(`/vaction/pedido`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                throw new Error(`Erro ao atualizar a solicitação: ${errorText}`);
            }

            // Recarrega as listas do servidor
            await carregarMinhasSolicitacoes();
            await carregarSolicitacoesPendentes();

            modalTitle.textContent = 'Solicitação Aprovada';
            modalMessage.textContent = 'A solicitação foi aprovada com sucesso.';
            confirmationModal.style.display = 'block';
        } catch (erro) {
            console.error('Erro ao processar aprovação:', erro);
            modalTitle.textContent = 'Erro';
            modalMessage.textContent = 'Não foi possível atualizar a solicitação.';
            confirmationModal.style.display = 'block';
        }
    }

    // ========= PROCESSAR REJEIÇÃO =========
    async function processarRejeicao() {
        if (!currentRejectionRequestId) {
            return;
        }

        const motivo = rejectionReason.value.trim();
        
        if (!motivo) {
            alert('É necessário informar um motivo para rejeitar a solicitação.');
            return;
        }

        try {
            const payload = {
                pedido: {
                    id: currentRejectionRequestId
                },
                usuario: {
                    id: currentUser.id
                },
                decisao: {
                    id: 2,
                    nome: 'REPROVADO'
                },
                observacao: motivo
            };

            const resp = await fetch(`/vaction/pedido`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                throw new Error(`Erro ao atualizar a solicitação: ${errorText}`);
            }

            // Fecha modal de rejeição
            rejectionModal.style.display = 'none';
            rejectionReason.value = '';
            currentRejectionRequestId = null;

            // Recarrega as listas do servidor
            await carregarMinhasSolicitacoes();
            await carregarSolicitacoesPendentes();

            // Mostra modal de confirmação
            modalTitle.textContent = 'Solicitação Rejeitada';
            modalMessage.textContent = 'A solicitação foi rejeitada com sucesso.';
            confirmationModal.style.display = 'block';
        } catch (erro) {
            console.error('Erro ao processar rejeição:', erro);
            alert('Não foi possível rejeitar a solicitação. Tente novamente.');
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
        if (event.target === rejectionModal) {
            rejectionModal.style.display = 'none';
            rejectionReason.value = '';
            currentRejectionRequestId = null;
        }
    });

    // ========= EVENTOS DA MODAL DE REJEIÇÃO =========
    closeRejectionModal.addEventListener('click', function() {
        rejectionModal.style.display = 'none';
        rejectionReason.value = '';
        currentRejectionRequestId = null;
    });

    cancelRejection.addEventListener('click', function() {
        rejectionModal.style.display = 'none';
        rejectionReason.value = '';
        currentRejectionRequestId = null;
    });

    confirmRejection.addEventListener('click', function() {
        processarRejeicao();
    });

    // Fecha modal ao pressionar ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            if (rejectionModal.style.display === 'block') {
                rejectionModal.style.display = 'none';
                rejectionReason.value = '';
                currentRejectionRequestId = null;
            }
        }
    });

    // ========= FLUXO INICIAL =========
    (async () => {
        await carregarMinhasSolicitacoes();      // endpoint 1: por usuário
        await carregarSolicitacoesPendentes();   // endpoint 2: pendentes para aprovar
    })();
});
