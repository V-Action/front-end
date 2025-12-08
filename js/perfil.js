document.addEventListener('DOMContentLoaded', function () {
    verificarAutenticacao();

    // ===========================
    // ELEMENTOS DO DOM
    // ===========================
    const profileCard = document.getElementById('profileCard');
    const editFormContainer = document.getElementById('editFormContainer');
    const editProfileButton = document.getElementById('editProfileButton');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const editProfileForm = document.getElementById('editProfileForm');
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModal = document.getElementById('closeModal');
    const modalCloseButton = document.getElementById('modalCloseButton');
    const vacationHistoryTableBody = document.getElementById('vacationHistoryTableBody');
    const profilePhoto = document.getElementById('profilePhoto');
    const photoUpload = document.getElementById('photoUpload');

    // Elementos de exibição
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileDepartment = document.getElementById('profileDepartment');
    const profileRole = document.getElementById('profileRole');
    const profileHireDate = document.getElementById('profileHireDate');
    const profileLastPasswordChange = document.getElementById('profileLastPasswordChange');
    const profileNotifications = document.getElementById('profileNotifications');

    // Elementos do formulário de edição
    const editName = document.getElementById('editName');
    const editPassword = document.getElementById('editPassword');

    const API_BASE_URL = "/vaction/usuarios";

    // Variável global para armazenar dados completos do usuário do backend
    let usuarioCompleto = null;

    let userProfile = {
        name: "",
        email: "",
        department: "",
        role: "",
        hireDate: "",
        lastPasswordChange: "",
        notificationsEnabled: true,
        photo: "../Assets/default_profile.png"
    };

    let vacationHistory = [];

    // ===========================
    // FUNÇÕES AUXILIARES
    // ===========================
    function formatDate(dateStr) {
        if (!dateStr) return "Não informado";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "Não informado";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async function carregarUsuarioDoBackend() {
        const idUsuario = sessionStorage.getItem("ID_USUARIO");
        if (!idUsuario) {
            const currentPath = window.location.pathname;
            const isInHtmlFolder = currentPath.includes("/html/");

            if (isInHtmlFolder) {
                window.location.href = "login.html";
            } else {
                window.location.href = "./html/login.html";
            }
            return;
        }

        try {
            const response = await fetch(API_BASE_URL + "/" + idUsuario);
            if (!response.ok) {
                throw new Error("Erro ao buscar usuário");
            }

            const json = await response.json();

            // Armazena o objeto completo do usuário para uso na edição
            usuarioCompleto = json;

            userProfile.name = json.nome;
            userProfile.email = json.email;
            userProfile.department = json.area || "Não informado";
            userProfile.role = json.cargo || "Não informado";
            userProfile.hireDate = json.dataAdmissao || json.data_admissao || "";
            userProfile.lastPasswordChange =
                sessionStorage.getItem("DATA_ADMISSAO") ||
                userProfile.hireDate ||
                "";

            userProfile.notificationsEnabled = true;

            loadProfile();
            await carregarHistoricoFerias();
        } catch (error) {
            console.error(error);
            alert("Erro ao carregar dados do perfil");
        }
    }

    // ===========================
    // CARREGAR PERFIL
    // ===========================
    function loadProfile() {
        profileName.textContent = userProfile.name || "Nome não informado";
        profileEmail.textContent = userProfile.email || "Email não informado";
        profileDepartment.textContent = userProfile.department || "Não informado";
        profileRole.textContent = userProfile.role || "Não informado";

        profileHireDate.textContent = userProfile.hireDate
            ? formatDate(userProfile.hireDate)
            : "Não informado";

        profileLastPasswordChange.textContent = userProfile.lastPasswordChange
            ? formatDate(userProfile.lastPasswordChange)
            : "Não informado";

        profileNotifications.textContent = userProfile.notificationsEnabled ? "Sim" : "Não";
        profilePhoto.src = userProfile.photo;
    }

    // ===========================
    // HISTÓRICO DE FÉRIAS (do back-end)
    // ===========================
    async function carregarHistoricoFerias() {
        const idUsuario = sessionStorage.getItem("ID_USUARIO");
        if (!idUsuario) {
            vacationHistory = [];
            loadVacationHistory();
            return;
        }

        try {
            const resp = await fetch(`/vaction/pedido/usuario/${idUsuario}`);
            if (!resp.ok && resp.status !== 204) {
                throw new Error('Erro ao buscar histórico de férias.');
            }

            if (resp.status === 204) {
                vacationHistory = [];
                loadVacationHistory();
                return;
            }

            const json = await resp.json();
            const lista = Array.isArray(json) ? json : (json ? [json] : []);

            vacationHistory = lista.map(item => {
                const statusNome = item.status?.nome || item.status || '';
                const statusFormatado = statusNome
                    .replace('_', ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');

                return {
                    startDate: item.dataInicio || item.data_inicio,
                    endDate: item.dataFim || item.data_fim,
                    requestDate: item.dataSolicitacao || item.data_solicitacao,
                    status: statusFormatado || 'Desconhecido'
                };
            }).sort((a, b) => {
                // Ordena por data de solicitação (mais recente primeiro)
                const dateA = new Date(a.requestDate);
                const dateB = new Date(b.requestDate);
                return dateB - dateA;
            });

            loadVacationHistory();
        } catch (erro) {
            console.error('Erro ao carregar histórico de férias:', erro);
            vacationHistory = [];
            loadVacationHistory();
        }
    }

    function loadVacationHistory() {
        vacationHistoryTableBody.innerHTML = '';
        
        if (vacationHistory.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3">Nenhum histórico de férias encontrado.</td>';
            vacationHistoryTableBody.appendChild(row);
            return;
        }

        vacationHistory.forEach(entry => {
            const row = document.createElement('tr');
            const statusClass = (entry.status || '').toLowerCase().replace(/\s+/g, '-');
            row.innerHTML = `
                <td>${formatDate(entry.startDate)} - ${formatDate(entry.endDate)}</td>
                <td class="status-${statusClass}">${entry.status}</td>
                <td>${formatDate(entry.requestDate)}</td>
            `;
            vacationHistoryTableBody.appendChild(row);
        });
    }

    // ===========================
    // FORMULÁRIO DE EDIÇÃO
    // ===========================
    function populateEditForm() {
        editName.value = userProfile.name || "";
        editPassword.value = '';
    }

    // Upload de foto (local, sem back ainda)
    photoUpload.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                userProfile.photo = e.target.result;
                profilePhoto.src = userProfile.photo;
            };
            reader.readAsDataURL(file);
        }
    });

    editProfileButton.addEventListener('click', function () {
        profileCard.style.display = 'none';
        editFormContainer.style.display = 'block';
        populateEditForm();
    });

    cancelEditButton.addEventListener('click', function () {
        editFormContainer.style.display = 'none';
        profileCard.style.display = 'block';
    });

    editProfileForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Valida a senha (se for alterar)
        if (editPassword.value && editPassword.value.length < 8) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro na validação',
                    text: 'A senha deve ter pelo menos 8 caracteres.'
                });
            } else {
                alert('A senha deve ter pelo menos 8 caracteres.');
            }
            return;
        }

        // Se não há senha para alterar, apenas fecha o formulário
        if (!editPassword.value) {
            editFormContainer.style.display = 'none';
            profileCard.style.display = 'block';
            return;
        }

        // Se não há dados completos do usuário, não pode editar
        if (!usuarioCompleto) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Dados do usuário não carregados. Recarregue a página.'
                });
            } else {
                alert('Dados do usuário não carregados. Recarregue a página.');
            }
            return;
        }

        const idUsuario = sessionStorage.getItem("ID_USUARIO");
        if (!idUsuario) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Usuário não identificado.'
                });
            } else {
                alert('Usuário não identificado.');
            }
            return;
        }

        try {
            // Monta payload completo do Usuario conforme esperado pelo backend
            const payload = {
                id: parseInt(idUsuario, 10),
                nome: usuarioCompleto.nome,
                cpf: usuarioCompleto.cpf,
                email: usuarioCompleto.email,
                dataAdmissao: usuarioCompleto.dataAdmissao || usuarioCompleto.data_admissao,
                cargo: usuarioCompleto.cargo,
                area: usuarioCompleto.area,
                senha: editPassword.value && editPassword.value.trim() !== '' ? editPassword.value.trim() : null,
                empresa: usuarioCompleto.empresa,
                nivelAcesso: usuarioCompleto.nivelAcesso,
                autenticado: usuarioCompleto.autenticado
            };

            const resposta = await fetch(API_BASE_URL + "/" + idUsuario, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resposta.ok) {
                let mensagemErro = 'Erro ao atualizar perfil.';
                
                if (resposta.status === 401) {
                    mensagemErro = 'Erro ao atualizar senha. Verifique os dados.';
                } else if (resposta.status === 404) {
                    mensagemErro = 'Usuário não encontrado.';
                }

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        text: mensagemErro
                    });
                } else {
                    alert(mensagemErro);
                }
                return;
            }

            // Sucesso - recarrega os dados do usuário
            await carregarUsuarioDoBackend();

            // Mostra mensagem de sucesso
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Perfil Atualizado',
                    text: 'As informações do seu perfil foram atualizadas com sucesso.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                confirmationModal.style.display = 'block';
            }

            // Limpa o campo de senha e volta para o card de perfil
            editPassword.value = '';
            editFormContainer.style.display = 'none';
            profileCard.style.display = 'block';

        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Não foi possível atualizar o perfil. Tente novamente.'
                });
            } else {
                alert('Não foi possível atualizar o perfil. Tente novamente.');
            }
        }
    });

    // ===========================
    // MODAL
    // ===========================
    closeModal.addEventListener('click', function () {
        confirmationModal.style.display = 'none';
    });

    modalCloseButton.addEventListener('click', function () {
        confirmationModal.style.display = 'none';
    });

    window.addEventListener('click', function (event) {
        if (event.target === confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });

    // ===========================
    // INICIALIZAÇÃO
    // ===========================
    carregarUsuarioDoBackend();
});
