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

  
    const vacationData = [
        {
            id: 1,
            name: "João Silva",
            startDate: new Date('2025-04-07'),
            endDate: new Date('2025-04-11'),
            department: "TI",
            role: "Desenvolvedor",
            project: "Sistema de Férias"
        },
        {
            id: 2,
            name: "Maria Oliveira",
            startDate: new Date('2025-04-08'),
            endDate: new Date('2025-04-12'),
            department: "RH",
            role: "Analista",
            project: "Treinamentos"
        },
        {
            id: 3,
            name: "Carlos Souza",
            startDate: new Date('2025-04-09'),
            endDate: new Date('2025-04-15'),
            department: "Vendas",
            role: "Gerente",
            project: "Clientes VIP"
        },
        {
            id: 4,
            name: "Ana Santos",
            startDate: new Date('2025-04-14'),
            endDate: new Date('2025-04-18'),
            department: "Marketing",
            role: "Analista",
            project: "Campanha Digital"
        },
        {
            id: 5,
            name: "Pedro Costa",
            startDate: new Date('2025-04-14'),
            endDate: new Date('2025-04-16'),
            department: "TI",
            role: "Estagiário",
            project: "Infraestrutura"
        }
    ];

  
    let currentStartDate = new Date(); 
    currentStartDate.setHours(0, 0, 0, 0);
    let filteredVacations = [...vacationData];

   
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
        date.setHours(0, 0, 0, 0);
        return date >= vacationStart && date <= vacationEnd;
    }

    function getVacationsForDate(date) {
        const dateCopy = new Date(date);
        return filteredVacations.filter(vacation => isDateInVacation(dateCopy, vacation));
    }

    function showVacationDetails(vacation) {
        document.getElementById('vacationModalTitle').textContent = `Férias de ${vacation.name}`;
        document.getElementById('vacationModalContent').innerHTML = `
            <p><strong>Área:</strong> ${vacation.department}</p>
            <p><strong>Cargo:</strong> ${vacation.role}</p>
            <p><strong>Projeto:</strong> ${vacation.project}</p>
            <p><strong>Período:</strong> ${formatDate(vacation.startDate)} - ${formatDate(vacation.endDate)}</p>
            <p><strong>Duração:</strong> ${Math.floor((new Date(vacation.endDate) - new Date(vacation.startDate)) / (86400000)) + 1} dias</p>
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
                const dayDiv = document.createElement('div');
                dayDiv.classList.add('day');
              
                const today = new Date();  
                today.setHours(0, 0, 0, 0);
                if (date.toDateString() === today.toDateString()) {
                    dayDiv.classList.add('today');
                }
                
                const weekday = date.toLocaleString('pt-BR', { weekday: 'short' }).replace('.', '');
                const dayNum = String(date.getDate()).padStart(2, '0');
                
                dayDiv.innerHTML = `
                    <span class="weekday">${weekday}</span>
                    <span class="day-number">${dayNum}</span>
                    <div class="vacation-container"></div>
                `;
                
                const vacations = getVacationsForDate(date);
                const container = dayDiv.querySelector('.vacation-container');
                
                vacations.forEach(vacation => {
                    const color = generateColorFromName(vacation.name);
                    const card = document.createElement('div');
                    card.className = 'vacation-card';
                    card.style.borderLeftColor = color;
                    card.innerHTML = `
                        <div class="vacation-name">${vacation.name}</div>
                        <div class="vacation-details">
                            <span>Área: ${vacation.department}</span>
                            <span>Cargo: ${vacation.role}</span>
                        </div>
                    `;
                    card.addEventListener('click', () => showVacationDetails(vacation));
                    container.appendChild(card);
                });
                
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

 
    function applyFilters() {
        const startDate = document.getElementById('startDate').value ? new Date(document.getElementById('startDate').value) : null;
        const endDate = document.getElementById('endDate').value ? new Date(document.getElementById('endDate').value) : null;
        const availableDays = document.getElementById('availableDays').checked;
        const department = document.getElementById('department').value;
        const role = document.getElementById('role').value;

        filteredVacations = vacationData.filter(vacation => {
            let matches = true;

            if (startDate && endDate) {
                const vacationStart = new Date(vacation.startDate);
                const vacationEnd = new Date(vacation.endDate);
                matches = matches && (vacationStart <= endDate && vacationEnd >= startDate);
                currentStartDate = startDate;
            }

            if (department) {
                matches = matches && vacation.department === department;
            }

            if (role) {
                matches = matches && vacation.role === role;
            }

            return matches;
        });

        if (availableDays) {
            filteredVacations = filteredVacations.filter(vacation => {
                const periodDates = [];
                for (let i = 0; i < 15; i++) {
                    const date = new Date(currentStartDate);
                    date.setDate(currentStartDate.getDate() + i);
                    periodDates.push(date);
                }
                return !periodDates.every(date => !isDateInVacation(date, vacation));
            });
        }

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

   
    generatePeriod(currentStartDate);
});