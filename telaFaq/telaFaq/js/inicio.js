document.addEventListener('DOMContentLoaded', function() {
   
    const userNameElement = document.getElementById('userName');
    const lastRequestPeriod = document.getElementById('lastRequestPeriod');
    const lastRequestStatus = document.getElementById('lastRequestStatus');
    const lastRequestDate = document.getElementById('lastRequestDate');
    const vacationCountdown = document.getElementById('vacationCountdown');
    const vacationBalance = document.getElementById('vacationBalance');
    const notificationsList = document.getElementById('notificationsList');
    const teamVacationsChartContainer = document.getElementById('teamVacationsChartContainer');
    const teamVacationsChartCanvas = document.getElementById('teamVacationsChart');

   
    const currentUser = {
        name: 'João Silva',
        department: 'TI',
        role: 'Gerente',
        id: 1,
        vacationDays: 30, 
        project: 'Projeto A' 
    };

    const requests = [
        {
            id: 1,
            userId: 1,
            name: 'João Silva',
            department: 'TI',
            role: 'Gerente',
            project: 'Projeto A',
            startDate: '2024-04-05',
            endDate: '2024-04-26',
            requestDate: '2024-03-01',
            status: 'Aprovado'
        },
        {
            id: 2,
            userId: 1,
            name: 'João Silva',
            department: 'TI',
            role: 'Gerente',
            project: 'Projeto A',
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
            project: 'Projeto A',
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
            project: 'Projeto B',
            startDate: '2025-08-01',
            endDate: '2025-08-10',
            requestDate: '2025-07-01',
            status: 'Pendente'
        },
        {
            id: 5,
            userId: 4,
            name: 'Ana Costa',
            department: 'TI',
            role: 'Desenvolvedor',
            project: 'Projeto A',
            startDate: '2025-07-05',
            endDate: '2025-07-15',
            requestDate: '2025-06-05',
            status: 'Pendente'
        }
    ];

    const notifications = [
        { message: 'Sua solicitação de férias (01/06/2025 - 15/06/2025) está pendente.', date: '2025-05-01' },
        { message: 'Sua solicitação de férias (05/04/2024 - 26/04/2024) foi aprovada.', date: '2024-03-15' }
    ];

   
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

   
    userNameElement.textContent = currentUser.name;

   
    function loadLastRequest() {
        const userRequests = requests.filter(request => request.userId === currentUser.id);
        const lastRequest = userRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))[0];

        if (lastRequest) {
            lastRequestPeriod.textContent = `${formatDate(lastRequest.startDate)} - ${formatDate(lastRequest.endDate)}`;
            lastRequestStatus.textContent = lastRequest.status;
            lastRequestStatus.classList.add(`status-${lastRequest.status.toLowerCase()}`);
            lastRequestDate.textContent = formatDate(lastRequest.requestDate);
        }
    }

  
    function calculateVacationCountdown() {
        const lastApprovedRequest = requests
            .filter(request => request.userId === currentUser.id && request.status === 'Aprovado')
            .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))[0];

        if (!lastApprovedRequest) {
            vacationCountdown.textContent = 'Você pode tirar férias a qualquer momento!';
            return;
        }

        const lastVacationEnd = new Date(lastApprovedRequest.endDate);
        const nextVacationDate = new Date(lastVacationEnd);
        nextVacationDate.setFullYear(lastVacationEnd.getFullYear() + 1); 

        const today = new Date();
        const diffTime = nextVacationDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            vacationCountdown.textContent = 'Você pode tirar férias agora!';
        } else {
            vacationCountdown.textContent = `${diffDays} dias restantes`;
        }
    }

  
    function calculateVacationBalance() {
        const usedDays = requests
            .filter(request => request.userId === currentUser.id && request.status === 'Aprovado')
            .reduce((total, request) => {
                const start = new Date(request.startDate);
                const end = new Date(request.endDate);
                const diffTime = end - start;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                return total + diffDays;
            }, 0);

        const remainingDays = currentUser.vacationDays - usedDays;
        vacationBalance.textContent = `${remainingDays} dias disponíveis`;
    }

   
    function loadNotifications() {
        notificationsList.innerHTML = '';
        notifications.forEach(notification => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${formatDate(notification.date)}</strong>: ${notification.message}`;
            notificationsList.appendChild(li);
        });
    }

   
    function loadTeamVacationsChart() {
        if (currentUser.role !== 'Gerente' && currentUser.role !== 'Diretor') {
            return;
        }

        teamVacationsChartContainer.style.display = 'block';

      
        const teamRequests = requests.filter(request => request.userId !== currentUser.id && request.department === currentUser.department);
        const projectRequests = requests.filter(request => request.userId !== currentUser.id && request.project === currentUser.project);

        const teamMonths = Array(12).fill(0); 
        const projectMonths = Array(12).fill(0);

        
        teamRequests.forEach(request => {
            const startDate = new Date(request.startDate);
            const month = startDate.getMonth();
            teamMonths[month]++;
        });

        
        projectRequests.forEach(request => {
            const startDate = new Date(request.startDate);
            const month = startDate.getMonth();
            projectMonths[month]++;
        });

        const ctx = teamVacationsChartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                datasets: [
                    {
                        label: 'Equipe',
                        data: teamMonths,
                        backgroundColor: 'rgba(18, 0, 82, 0.8)', 
                        borderColor: '#120052',
                        borderWidth: 1
                    },
                    {
                        label: `Projeto (${currentUser.project})`,
                        data: projectMonths,
                        backgroundColor: 'rgba(52, 199, 89, 0.8)',  
                        borderColor: '#34c759',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Pessoas em Férias',
                            font: {
                                family: 'Poppins',
                                size: 14,
                                weight: '600'
                            },
                            color: '#120052'
                        },
                        ticks: {
                            color: '#374151'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Mês',
                            font: {
                                family: 'Poppins',
                                size: 14,
                                weight: '600'
                            },
                            color: '#120052'
                        },
                        ticks: {
                            color: '#374151'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                family: 'Poppins',
                                size: 12
                            },
                            color: '#120052'
                        }
                    }
                }
            }
        });
    }


    loadLastRequest();
    calculateVacationCountdown();
    calculateVacationBalance();
    loadNotifications();
    loadTeamVacationsChart();
});