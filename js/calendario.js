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

    let vacationData = [];
    let filteredVacations = [];
    let filtroDiasDisponiveisAtivo = false;
    let filtroPeriodoInicio = null;
    let filtroPeriodoFim = null;
    
    // Nível de acesso do usuário
    let nivelAcesso = (sessionStorage.getItem('NIVEL_ACESSO') || 'COLABORADOR').toUpperCase().trim();

    async function carregarCalendario() {
        try {
            const usuarioId = sessionStorage.getItem('ID_USUARIO');
            if (!usuarioId) {
                console.error('ID do usuário não encontrado');
                vacationData = [];
                filteredVacations = [];
                return;
            }

            const resp = await fetch(`/vaction/pedido/calendario/${usuarioId}`);
            if (resp.status === 204 || !resp.ok) {
                vacationData = [];
                filteredVacations = [];
                return;
            }

            const json = await resp.json();
            const lista = Array.isArray(json) ? json : [];

            vacationData = lista.map(item => {
                const startDate = item.dataInicio ? new Date(item.dataInicio) : null;
                const endDate = item.dataFim ? new Date(item.dataFim) : null;
                const usuario = item.usuario || {};

                return {
                    id: item.id,
                    name: usuario.nome || '',
                    startDate,
                    endDate,
                    department: usuario.area || '',
                    role: usuario.cargo || '',
                    project: ''
                };
            }).filter(v => v.startDate && v.endDate && !isNaN(v.startDate) && !isNaN(v.endDate));

            filteredVacations = [...vacationData];
            
            // Após carregar dados, configura os filtros baseado no nível de acesso
            configurarFiltrosPorNivel();
            popularSelectsFiltros();
        } catch (erro) {
            console.error('Erro ao carregar calendário:', erro);
            vacationData = [];
            filteredVacations = [];
        }
    }

    // ========= CONFIGURAR FILTROS POR NÍVEL DE ACESSO =========
    function configurarFiltrosPorNivel() {
        const departmentGroup = document.getElementById('departmentGroup');
        const roleGroup = document.getElementById('roleGroup');
        const employeeGroup = document.getElementById('employeeGroup');

        // Resetar visibilidade
        if (departmentGroup) departmentGroup.style.display = 'none';
        if (roleGroup) roleGroup.style.display = 'none';
        if (employeeGroup) employeeGroup.style.display = 'none';

        // Mostrar filtros baseado no nível de acesso
        if (nivelAcesso === 'RH') {
            // RH: vê todos os filtros
            if (departmentGroup) departmentGroup.style.display = 'block';
            if (roleGroup) roleGroup.style.display = 'block';
            if (employeeGroup) employeeGroup.style.display = 'block';
        } else if (nivelAcesso === 'GESTOR') {
            // GESTOR: vê área e colaborador (da equipe)
            if (departmentGroup) departmentGroup.style.display = 'block';
            if (employeeGroup) employeeGroup.style.display = 'block';
            if (roleGroup) roleGroup.style.display = 'block';
        }
        // COLABORADOR: não vê filtros adicionais (só período e dias disponíveis)
    }

    // ========= POPULAR SELECTS COM DADOS DISPONÍVEIS =========
    function popularSelectsFiltros() {
        // Extrair valores únicos dos dados carregados
        const areas = [...new Set(vacationData.map(v => v.department).filter(Boolean))].sort();
        const cargos = [...new Set(vacationData.map(v => v.role).filter(Boolean))].sort();
        const colaboradores = [...new Set(vacationData.map(v => v.name).filter(Boolean))].sort();

        // Popular select de Área
        const departmentSelect = document.getElementById('department');
        if (departmentSelect) {
            // Manter a opção "Todas"
            const todasOption = departmentSelect.querySelector('option[value=""]');
            departmentSelect.innerHTML = '';
            if (todasOption) {
                departmentSelect.appendChild(todasOption);
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Todas';
                departmentSelect.appendChild(option);
            }
            
            areas.forEach(area => {
                const option = document.createElement('option');
                option.value = area;
                option.textContent = area;
                departmentSelect.appendChild(option);
            });
        }

        // Popular select de Cargo
        const roleSelect = document.getElementById('role');
        if (roleSelect) {
            const todasOption = roleSelect.querySelector('option[value=""]');
            roleSelect.innerHTML = '';
            if (todasOption) {
                roleSelect.appendChild(todasOption);
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Todos';
                roleSelect.appendChild(option);
            }
            
            cargos.forEach(cargo => {
                const option = document.createElement('option');
                option.value = cargo;
                option.textContent = cargo;
                roleSelect.appendChild(option);
            });
        }

        // Popular select de Colaborador
        const employeeSelect = document.getElementById('employee');
        if (employeeSelect) {
            const todasOption = employeeSelect.querySelector('option[value=""]');
            employeeSelect.innerHTML = '';
            if (todasOption) {
                employeeSelect.appendChild(todasOption);
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Todos';
                employeeSelect.appendChild(option);
            }
            
            colaboradores.forEach(colaborador => {
                const option = document.createElement('option');
                option.value = colaborador;
                option.textContent = colaborador;
                employeeSelect.appendChild(option);
            });
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
        dateCopy.setHours(0, 0, 0, 0);
        
        // Se houver filtro de período, mostrar férias completas que interceptam o período
        // (filteredVacations já contém apenas as férias que interceptam o período filtrado)
        // Não bloquear dias individuais - mostrar a férias inteira mesmo que comece antes ou termine depois
        return filteredVacations.filter(vacation => isDateInVacation(dateCopy, vacation));
    }

    function showVacationDetails(vacation) {
        document.getElementById('vacationModalTitle').textContent = `Férias de ${vacation.name}`;
        document.getElementById('vacationModalContent').innerHTML = `
            <p><strong>Área:</strong> ${vacation.department || 'N/A'}</p>
            <p><strong>Cargo:</strong> ${vacation.role || 'N/A'}</p>
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

            // Sempre mostra 15 dias (tamanho padrão)
            for (let i = 0; i < 15; i++) {
                const date = new Date(monday);
                date.setDate(monday.getDate() + i);
                period.push(date);
            }

            period.forEach((date) => {
                // Verificar se o dia tem férias (getVacationsForDate já filtra por período)
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
                
                // Mostrar férias (getVacationsForDate já filtra por período)
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

    // ====== FILTROS COM PERMISSIONAMENTO POR NÍVEL DE ACESSO ======
    function applyFilters() {
        const startDateInputEl = document.getElementById('startDate');
        const endDateInputEl   = document.getElementById('endDate');
        const availableDaysEl  = document.getElementById('availableDays');
        const departmentEl     = document.getElementById('department');
        const roleEl           = document.getElementById('role');
        const employeeEl       = document.getElementById('employee');

        const startDateInput = startDateInputEl ? startDateInputEl.value : '';
        const endDateInput   = endDateInputEl ? endDateInputEl.value : '';
        const availableDays  = availableDaysEl ? availableDaysEl.checked : false;
        const department     = departmentEl ? departmentEl.value : '';
        const role           = roleEl ? roleEl.value : '';
        const employee       = employeeEl ? employeeEl.value : '';

        const startDate = startDateInput ? new Date(startDateInput) : null;
        const endDate   = endDateInput ? new Date(endDateInput) : null;

        // Armazenar período filtrado (para filtrar quais dias mostram férias)
        filtroPeriodoInicio = startDate;
        filtroPeriodoFim = endDate;

        // TODOS podem ativar o filtro visual "dias disponíveis"
        filtroDiasDisponiveisAtivo = availableDays;

        filteredVacations = vacationData.filter(vacation => {
            let matches = true;

            // Filtro por período (todos podem usar)
            if (startDate && endDate) {
                const vacationStart = new Date(vacation.startDate);
                const vacationEnd   = new Date(vacation.endDate);
                matches = matches && (vacationStart <= endDate && vacationEnd >= startDate);
            }

            // Filtro por área (GESTOR e RH)
            if (department && (nivelAcesso === 'GESTOR' || nivelAcesso === 'RH')) {
                const depFiltro = department.trim().toUpperCase();
                const depFerias = (vacation.department || '').trim().toUpperCase();
                matches = matches && (depFerias === depFiltro);
            }

            // Filtro por cargo (GESTOR e RH)
            if (role && (nivelAcesso === 'GESTOR' || nivelAcesso === 'RH')) {
                const roleFiltro = role.trim();
                const roleFerias = (vacation.role || '').trim();
                matches = matches && (roleFerias === roleFiltro);
            }

            // Filtro por colaborador (GESTOR e RH)
            if (employee && (nivelAcesso === 'GESTOR' || nivelAcesso === 'RH')) {
                const empFiltro = employee.trim();
                const empFerias = (vacation.name || '').trim();
                matches = matches && (empFerias === empFiltro);
            }

            return matches;
        });

        // Sempre gerar o período a partir da data atual de navegação
        generatePeriod(currentStartDate);
    }

    // ========= LIMPAR FILTROS =========
    function limparFiltros() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const availableDays = document.getElementById('availableDays');
        const department = document.getElementById('department');
        const role = document.getElementById('role');
        const employee = document.getElementById('employee');

        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        if (availableDays) availableDays.checked = false;
        if (department) department.value = '';
        if (role) role.value = '';
        if (employee) employee.value = '';

        filtroDiasDisponiveisAtivo = false;
        filtroPeriodoInicio = null;
        filtroPeriodoFim = null;
        filteredVacations = [...vacationData];
        
        // Resetar para data atual
        currentStartDate = new Date();
        currentStartDate.setHours(0, 0, 0, 0);
        
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

    // Botão de limpar filtros
    const clearFiltersButton = document.getElementById('clearFilters');
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', () => {
            limparFiltros();
            filterModal.style.display = 'none';
        });
    }

    vacationModal.querySelector('.close').addEventListener('click', () => {
        vacationModal.style.display = 'none';
    });

    (async () => {
        await carregarCalendario();
        generatePeriod(currentStartDate);
    })();
});
