document.addEventListener('DOMContentLoaded', function() {
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

    // Dados mockados (simulando um backend)
    let userProfile = {
        name: 'João Silva',
        email: 'joao.silva@vaction.com',
        department: 'TI',
        role: 'Gerente',
        hireDate: '2020-01-15',
        lastPasswordChange: '2024-10-01',
        notificationsEnabled: true,
        photo: '../Assets/default_profile.png' // Foto padrão
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

    // Carregar informações do perfil
    function loadProfile() {
        profileName.textContent = userProfile.name;
        profileEmail.textContent = userProfile.email;
        profileDepartment.textContent = userProfile.department;
        profileRole.textContent = userProfile.role;
        profileHireDate.textContent = formatDate(userProfile.hireDate);
        profileLastPasswordChange.textContent = formatDate(userProfile.lastPasswordChange);
        profileNotifications.textContent = userProfile.notificationsEnabled ? 'Sim' : 'Não';
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

   
    photoUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                userProfile.photo = e.target.result;
                profilePhoto.src = userProfile.photo;
            };
            reader.readAsDataURL(file);
        }
    });


    editProfileButton.addEventListener('click', function() {
        profileCard.style.display = 'none';
        editFormContainer.style.display = 'block';
        populateEditForm();
    });

  
    cancelEditButton.addEventListener('click', function() {
        editFormContainer.style.display = 'none';
        profileCard.style.display = 'block';
    });

   
    editProfileForm.addEventListener('submit', function(e) {
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

   
    loadProfile();
    loadVacationHistory();
});