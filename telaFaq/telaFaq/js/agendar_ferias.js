document.addEventListener('DOMContentLoaded', function() {
    
    const vacationForm = document.getElementById('vacationForm');
    const simulationCalendar = document.getElementById('simulationCalendar');
    const simulationDays = document.getElementById('simulationDays');
    const simulationPeriodTitle = document.getElementById('simulationPeriodTitle');
    const prevPeriodButton = document.getElementById('prevPeriod');
    const nextPeriodButton = document.getElementById('nextPeriod');
    const changeDateButton = document.getElementById('changeDateButton');
    const requestVacationButton = document.getElementById('requestVacationButton');
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModal = document.getElementById('closeModal');
    const modalCloseButton = document.getElementById('modalCloseButton');

    let simulatedVacation = null;
    let currentStartDate = null;

    
    function formatDateFull(date) {
        const months = [
            'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        const day = String(date.getDate()).padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} de ${month} de ${year}`;
    }

    function getMonday(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setHours(0, 0, 0, 0); 
        monday.setDate(diff);
        return monday;
    }

  
    function dateToString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function isDateInVacation(date, vacation) {
     
        const compareDateStr = dateToString(date);
        const vacationStartStr = dateToString(new Date(vacation.startDate));
        const vacationEndStr = dateToString(new Date(vacation.endDate));


        return compareDateStr >= vacationStartStr && compareDateStr <= vacationEndStr;
    }

    function generateSimulationCalendar(startDate, vacation) {
        simulationDays.classList.add('fade');

        setTimeout(() => {
            simulationDays.innerHTML = '';
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

                if (isDateInVacation(date, vacation)) {
                    const container = dayDiv.querySelector('.vacation-container');
                    const card = document.createElement('div');
                    card.className = 'vacation-card';
                    card.style.borderLeftColor = '#34c759'; 
                    card.innerHTML = `
                        <div class="vacation-name">${vacation.name}</div>
                    `;
                    container.appendChild(card);
                }

                simulationDays.appendChild(dayDiv);
            });

            const endDate = new Date(monday);
            endDate.setDate(monday.getDate() + 14);
            simulationPeriodTitle.textContent = `${formatDateFull(monday)} - ${formatDateFull(endDate)}`;
            simulationDays.classList.remove('fade');
        }, 300);
    }

  
    function navigatePeriod(direction) {
        const newDate = new Date(currentStartDate);
        newDate.setDate(currentStartDate.getDate() + (direction * 15));
        currentStartDate = newDate;
        generateSimulationCalendar(currentStartDate, simulatedVacation);
    }

  
    vacationForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(vacationForm);
        const startDateInput = formData.get('startDate');
        const endDateInput = formData.get('endDate'); 

       
        const startDateParts = startDateInput.split('-');
        const endDateParts = endDateInput.split('-');

        const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
        const endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);

      
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        simulatedVacation = {
            name: formData.get('name'),
            department: formData.get('department'),
            role: formData.get('role'),
            startDate: startDate,
            endDate: endDate
        };

      
        console.log('Start Date:', dateToString(startDate));
        console.log('End Date:', dateToString(endDate));

        if (simulatedVacation.startDate > simulatedVacation.endDate) {
            alert('A data inicial deve ser anterior à data final.');
            return;
        }

        currentStartDate = simulatedVacation.startDate;
        simulationCalendar.style.display = 'block';
        generateSimulationCalendar(currentStartDate, simulatedVacation);
    });

  
    changeDateButton.addEventListener('click', function() {
        simulationCalendar.style.display = 'none';
        simulatedVacation = null;
        currentStartDate = null;
    });

 
    requestVacationButton.addEventListener('click', function() {
        if (simulatedVacation) {
            console.log('Solicitação enviada:', simulatedVacation);
            confirmationModal.style.display = 'block';
            simulationCalendar.style.display = 'none';
            vacationForm.reset();
            simulatedVacation = null;
            currentStartDate = null;
        }
    });

  
    prevPeriodButton.addEventListener('click', () => navigatePeriod(-1));
    nextPeriodButton.addEventListener('click', () => navigatePeriod(1));

  
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
});