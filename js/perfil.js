document.addEventListener('DOMContentLoaded', function () {
    verificarAutenticacao()
    // Elementos do DOM
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
    const editEmail = document.getElementById('editEmail');
    const editPassword = document.getElementById('editPassword');
    const editDepartment = document.getElementById('editDepartment');
    const editRole = document.getElementById('editRole');
    const editNotifications = document.getElementById('editNotifications');

    const API_BASE_URL = "http://localhost:8080/vaction/usuarios";

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

    const vacationHistory = [
        {
            startDate: '2024-04-05',
            endDate: '2024-04-26',
            requestDate: '2024-03-01',
            status: 'Aprovado'
        },
        {
            startDate: '2025-06-01',
            endDate: '2025-06-15',
            requestDate: '2025-05-01',
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

    // Função para obter a data atual no formato YYYY-MM-DD (corrigindo fuso horário)
    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function carregarUsuarioDoBackend() {
    const idUsuario = sessionStorage.getItem("ID_USUARIO");
    if (!idUsuario) {
        // segurança extra, redireciona se não tiver usuário
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes("/html/");

        if (isInHtmlFolder) {
            window.location.href = "login.html";
        } else {
            window.location.href = "./html/login.html";
        }
        return;
    }

    fetch(API_BASE_URL + "/" + idUsuario)
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao buscar usuário");
            }
            return response.json();
        })
        .then(json => {
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
        })
        .catch(error => {
            console.error(error);
            alert("Erro ao carregar dados do perfil");
        });
}

    // Carregar informações do perfil
    function loadProfile() {
        profileName.textContent = userProfile.name || "Nome não informado";
        profileEmail.textContent = userProfile.email || "Email não informado";
        profileDepartment.textContent = userProfile.department || "Não informado";
        profileRole.textContent = userProfile.role || "Não informado";
        if (userProfile.hireDate) {
            profileHireDate.textContent = formatDate(userProfile.hireDate);
        } else {
            profileHireDate.textContent = "Não informado";
        }

        if (userProfile.lastPasswordChange) {
            profileLastPasswordChange.textContent = formatDate(userProfile.lastPasswordChange);
        } else {
            profileLastPasswordChange.textContent = "Não informado";
        }

        profileNotifications.textContent = userProfile.notificationsEnabled ? "Sim" : "Não";
        profilePhoto.src = userProfile.photo;

    }

    // Carregar histórico de férias
    function loadVacationHistory() {
        vacationHistoryTableBody.innerHTML = '';
        vacationHistory.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(entry.startDate)} - ${formatDate(entry.endDate)}</td>
                <td class="status-${entry.status.toLowerCase()}">${entry.status}</td>
                <td>${formatDate(entry.requestDate)}</td>
            `;
            vacationHistoryTableBody.appendChild(row);
        });
    }

    // Preencher o formulário de edição
    function populateEditForm() {
        editName.value = userProfile.name;
        editEmail.value = userProfile.email;
        editDepartment.value = userProfile.department;
        editRole.value = userProfile.role;
        editNotifications.value = userProfile.notificationsEnabled.toString();
        editPassword.value = '';
    }


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


    editProfileForm.addEventListener('submit', function (e) {
        e.preventDefault();


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editEmail.value)) {
            alert('Por favor, insira um email válido.');
            return;
        }


        if (editPassword.value && editPassword.value.length < 8) {
            alert('A senha deve ter pelo menos 8 caracteres.');
            return;
        }


        userProfile.email = editEmail.value;
        userProfile.department = editDepartment.value;
        userProfile.role = editRole.value;
        userProfile.notificationsEnabled = editNotifications.value === 'true';
        if (editPassword.value) {
            userProfile.lastPasswordChange = getCurrentDate();
        }


        loadProfile();


        confirmationModal.style.display = 'block';


        editFormContainer.style.display = 'none';
        profileCard.style.display = 'block';
    });


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


    carregarUsuarioDoBackend();
    loadVacationHistory();
});
