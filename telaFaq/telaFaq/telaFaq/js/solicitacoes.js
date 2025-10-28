document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
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

    // Dados mockados (simulando um backend)
    const currentUser = {
        name: 'João Silva',
        department: 'TI',
        role: 'Gerente', // Para teste; mudar para "Desenvolvedor" para ocultar a aba
        id: 1
    };

    const requests = [
        {
            id: 1,
            userId: 1,
            name: 'João Silva',
            department: 'TI',
            role: 'Gerente',
            startDate: '2025-04-05',
            endDate: '2025-04-26',
            requestDate: '2025-03-01',
            status: 'Aprovado'
        },
        {
            id: 2,
            userId: 1,
            name: 'João Silva',
            department: 'TI',
            role: 'Gerente',
            startDate: '2025-06-01',
            endDate: '2025-06-15',
            requestDate: '2025-05-01',
            status: 'Pendente'
        },
        {
            id: 3,
            userId: 2,
            name: 'Maria Oliveira',
            department: 'TI',
            role: 'Desenvolvedor',
            startDate: '2025-07-01',
            endDate: '2025-07-20',
            requestDate: '2025-06-01',
            status: 'Pendente'
        },
        {
            id: 4,
            userId: 3,
            name: 'Pedro Santos',
            department: 'TI',
            role: 'Analista',
            startDate: '2025-08-01',
            endDate: '2025-08-10',
            requestDate: '2025-07-01',
            status: 'Pendente'
        }
    ];

    // Função para formatar datas
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Mostrar ou ocultar a aba "Aprovar Solicitações" com base no cargo
    if (currentUser.role !== 'Gerente' && currentUser.role !== 'Diretor') {
        approveTab.style.display = 'none';
    }

    // Carregar solicitações do usuário
    function loadMyRequests() {
        myRequestsTableBody.innerHTML = '';
        const userRequests = requests.filter(request => request.userId === currentUser.id);

        userRequests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.name}</td>
                <td>${request.department}</td>
                <td>${request.role}</td>
                <td>${formatDate(request.startDate)} - ${formatDate(request.endDate)}</td>
                <td class="status-${request.status.toLowerCase()}">${request.status}</td>
                <td>${formatDate(request.requestDate)}</td>
            `;
            myRequestsTableBody.appendChild(row);
        });
    }

    // Carregar solicitações para aprovação
    function loadApproveRequests() {
        approveRequestsTableBody.innerHTML = '';
        const pendingRequests = requests.filter(request => 
            request.status === 'Pendente' && request.userId !== currentUser.id
        );

        pendingRequests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.name}</td>
                <td>${request.department}</td>
                <td>${request.role}</td>
                <td>${formatDate(request.startDate)} - ${formatDate(request.endDate)}</td>
                <td>${formatDate(request.requestDate)}</td>
                <td>
                    <button class="action-button approve" data-id="${request.id}">Aprovar</button>
                    <button class="action-button reject" data-id="${request.id}">Rejeitar</button>
                </td>
            `;
            approveRequestsTableBody.appendChild(row);
        });

        // Adicionar eventos aos botões de ação
        document.querySelectorAll('.action-button').forEach(button => {
            button.addEventListener('click', function() {
                const requestId = parseInt(this.getAttribute('data-id'));
                const action = this.classList.contains('approve') ? 'Aprovado' : 'Rejeitado';
                handleRequestAction(requestId, action);
            });
        });
    }

    // Lidar com a aprovação/rejeição de solicitações
    function handleRequestAction(requestId, action) {
        const request = requests.find(req => req.id === requestId);
        if (request) {
            request.status = action;
            modalTitle.textContent = action === 'Aprovado' ? 'Solicitação Aprovada' : 'Solicitação Rejeitada';
            modalMessage.textContent = `A solicitação foi ${action.toLowerCase()} com sucesso.`;
            confirmationModal.style.display = 'block';
            loadApproveRequests(); // Atualizar a tabela de aprovações
            loadMyRequests(); // Atualizar a tabela de solicitações do usuário
        }
    }

    // Alternar abas
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');

            const tabId = this.getAttribute('data-tab');
            this.classList.add('active');
            document.getElementById(tabId).style.display = 'block';
        });
    });

    // Fechar a modal
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

    // Carregar dados iniciais
    loadMyRequests();
    loadApproveRequests();
});