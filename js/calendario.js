document.addEventListener('DOMContentLoaded', function() {
    const calendarDays = document.getElementById('calendarDays');
    const periodTitle = document.getElementById('periodTitle');
    const prevPeriodButton = document.getElementById('prevPeriod');
    const nextPeriodButton = document.getElementById('nextPeriod');
    const filterButton = document.getElementById('filterButton');
    const filterModal = document.getElementById('filterModal');
    const closeModal = document.getElementById('closeModal');
    const filterForm = document.getElementById('filterForm');
    const vacationModal = document.getElementById('vacationModal');

    // ====== NOVO: dados vêm do back ======
    let vacationData = [];          // antes era const com mock
    let filteredVacations = [];     // começa vazio, depois copia vacationData
    let filtroDiasDisponiveisAtivo = false; // controla filtro de "dias disponíveis" (TODOS)

    // ====== NOVO: carregar calendário do backend ======
    async function carregarCalendario() {
        try {
            const resp = await fetch('http://localhost:8080/vaction/get-calendario');
            if (!resp.ok) {
                throw new Error('Erro ao buscar dados do calendário.');
            }

            const json = await resp.json();
            console.log('Resposta vaction/get-calendario:', json);

            const lista = Array.isArray(json) ? json : (json ? [json] : []);

            vacationData = lista
                .map(item => {
                    const startRaw = item.startDate ?? item.dataInicio ?? item.data_inicio;
                    const endRaw   = item.endDate   ?? item.dataFim    ?? item.data_fim;

                    const startDate = startRaw ? new Date(startRaw) : null;
                    const endDate   = endRaw   ? new Date(endRaw)   : null;

                    return {
                        id: item.id ?? item.idPedido ?? item.id_pedido,
                        name: item.name ?? item.nome ?? item.nomeUsuario ?? item.colaborador,
                        startDate,
                        endDate,
                        department: item.department ?? item.area ?? item.departamento,
                        role: item.role ?? item.cargo ?? '',
                        project: item.project ?? item.projeto ?? ''
                    };
                })
                // só mantém os que têm datas válidas
                .filter(v =>
                    v.startDate instanceof Date && !isNaN(v.startDate) &&
                    v.endDate   instanceof Date && !isNaN(v.endDate)
                );

            filteredVacations = [...vacationData];
        } catch (erro) {
            console.error('Erro ao carregar calendário:', erro);
            vacationData = [];
            filteredVacations = [];
        }
    }

    // ================== LÓGICA ORIGINAL (mantida) ==================

    let currentStartDate = new Date(); 
    currentStartDate.setHours(0, 0, 0, 0);

    function getMonday(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        return monday;
    }

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function generateColorFromName(name) {
        let hash = 0;
        if (!name) return 'hsl(200, 70%, 60%)';
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        return `hsl(${h}, 70%, 60%)`;
    }

    function isDateInVacation(date, vacation) {
        const vacationStart = new Date(vacation.startDate);
        const vacationEnd = new Date(vacation.endDate);
        vacationStart.setHours(0, 0, 0, 0);
        vacationEnd.setHours(0, 0, 0, 0);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d >= vacationStart && d <= vacationEnd;
    }

    function getVacationsForDate(date) {
        const dateCopy = new Date(date);
        return filteredVacations.filter(vacation => isDateInVacation(dateCopy, vacation));
    }

    function showVacationDetails(vacation) {
        document.getElementById('vacationModalTitle').textContent = `Férias de ${vacation.name}`;
        document.getElementById('vacationModalContent').innerHTML = `
            <p><strong>Área:</strong> ${vacation.department || 'N/A'}</p>
            <p><strong>Cargo:</strong> ${vacation.role || 'N/A'}</p>
            <p><strong>Projeto:</strong> ${vacation.project || 'N/A'}</p>
            <p><strong>Período:</strong> ${formatDate(vacation.startDate)} - ${formatDate(vacation.endDate)}</p>
            <p><strong>Duração:</strong> ${
                Math.floor((new Date(vacation.endDate) - new Date(vacation.startDate)) / 86400000) + 1
            } dias</p>
        `;
        vacationModal.style.display = 'block';
    }

    function generatePeriod(startDate) {
        calendarDays.classList.add('fade');
        
        setTimeout(() => {
            calendarDays.innerHTML = '';
            const monday = getMonday(new Date(startDate));
            const period = [];

            for (let i = 0; i < 15; i++) {
                const date = new Date(monday);
                date.setDate(monday.getDate() + i);
                period.push(date);
            }

            period.forEach((date) => {
                // NOVO: primeiro vemos se o dia tem férias
                const vacations = getVacationsForDate(date);

                // Se o filtro "dias disponíveis" estiver ativo,
                // só exibimos dias SEM ninguém de férias
                if (filtroDiasDisponiveisAtivo && vacations.length > 0) {
                    return; // pula este dia
                }

                const dayDiv = document.createElement('div');
                dayDiv.classList.add('day');
              
                const today = new Date();  
                today.setHours(0, 0, 0, 0);
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                if (d.toDateString() === today.toDateString()) {
                    dayDiv.classList.add('today');
                }
                
                const weekday = date.toLocaleString('pt-BR', { weekday: 'short' }).replace('.', '');
                const dayNum = String(date.getDate()).padStart(2, '0');
                
                dayDiv.innerHTML = `
                    <span class="weekday">${weekday}</span>
                    <span class="day-number">${dayNum}</span>
                    <div class="vacation-container"></div>
                `;
                
                const container = dayDiv.querySelector('.vacation-container');
                
                vacations.forEach(vacation => {
                    const color = generateColorFromName(vacation.name);
                    const card = document.createElement('div');
                    card.className = 'vacation-card';
                    card.style.borderLeftColor = color;
                    card.innerHTML = `
                        <div class="vacation-name">${vacation.name}</div>
                        <div class="vacation-details">
                            <span>Área: ${vacation.department || 'N/A'}</span>
                            <span>Cargo: ${vacation.role || 'N/A'}</span>
                        </div>
                    `;
                    card.addEventListener('click', () => showVacationDetails(vacation));
                    container.appendChild(card);
                });

                // Se o filtro de dias disponíveis estiver ativo e não há férias,
                // podemos destacar visualmente o dia como "livre"
                if (filtroDiasDisponiveisAtivo && vacations.length === 0) {
                    dayDiv.classList.add('available-day');
                }
                
                calendarDays.appendChild(dayDiv);
            });

            const endDate = new Date(monday);
            endDate.setDate(monday.getDate() + 14);
            periodTitle.textContent = `${formatDate(monday)} - ${formatDate(endDate)}`;
            
            calendarDays.classList.remove('fade');
        }, 300);
    }

    function navigatePeriod(direction) {
        const newDate = new Date(currentStartDate);
        newDate.setDate(currentStartDate.getDate() + (direction * 15));
        currentStartDate = newDate;
        generatePeriod(currentStartDate);
    }

    // ====== AJUSTADO: filtros com permissionamento (NIVEL_ACESSO) ======
    function applyFilters() {
        const startDateInputEl = document.getElementById('startDate');
        const endDateInputEl   = document.getElementById('endDate');
        const availableDaysEl  = document.getElementById('availableDays');
        const departmentEl     = document.getElementById('department');
        const roleEl           = document.getElementById('role');

        const startDateInput = startDateInputEl ? startDateInputEl.value : '';
        const endDateInput   = endDateInputEl ? endDateInputEl.value : '';
        const availableDays  = availableDaysEl ? availableDaysEl.checked : false;
        const department     = departmentEl ? departmentEl.value : '';
        const role           = roleEl ? roleEl.value : '';

        const startDate = startDateInput ? new Date(startDateInput) : null;
        const endDate   = endDateInput ? new Date(endDateInput) : null;

        // Nível de acesso (mesmo padrão da aba Início)
        const nivel = (sessionStorage.getItem('NIVEL_ACESSO') || 'COLABORADOR').toUpperCase();

        // TODOS podem ativar o filtro visual "dias disponíveis"
        filtroDiasDisponiveisAtivo = availableDays;

        filteredVacations = vacationData.filter(vacation => {
            let matches = true;

            // Filtro por período
            if (startDate && endDate) {
                const vacationStart = new Date(vacation.startDate);
                const vacationEnd   = new Date(vacation.endDate);
                matches = matches && (vacationStart <= endDate && vacationEnd >= startDate);
                currentStartDate = startDate;
            }

            // Filtro por área => APENAS RH
            if (department && nivel === 'RH') {
                const depFiltro = department.trim().toUpperCase();
                const depFerias = (vacation.department || '').trim().toUpperCase();
                matches = matches && (depFerias === depFiltro);
            }

            // Filtro por cargo => todos
            if (role) {
                matches = matches && vacation.role === role;
            }

            return matches;
        });

        generatePeriod(currentStartDate);
    }

    prevPeriodButton.addEventListener('click', () => navigatePeriod(-1));
    nextPeriodButton.addEventListener('click', () => navigatePeriod(1));

    filterButton.addEventListener('click', () => {
        filterModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        filterModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === filterModal) {
            filterModal.style.display = 'none';
        }
        if (event.target === vacationModal) {
            vacationModal.style.display = 'none';
        }
    });

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
        filterModal.style.display = 'none';
    });

    vacationModal.querySelector('.close').addEventListener('click', () => {
        vacationModal.style.display = 'none';
    });

    // ====== NOVO: carrega dados do back e só então gera o período ======
    (async () => {
        await carregarCalendario();
        generatePeriod(currentStartDate);
    })();
});
