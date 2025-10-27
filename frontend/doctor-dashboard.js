// Doctor Dashboard JavaScript
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {
    name: 'Dr. Sarah Wilson',
    role: 'Cardiologist',
    email: 'sarah.wilson@hospital.com'
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadDashboardData();
});

function initializeDashboard() {
    // Set user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('greetingName').textContent = currentUser.name.split(' ')[1];

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
            
            // Update active nav
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Menu toggle for mobile
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    });

    // Modal controls
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Generate calendar
    generateCalendar();
    generateWeeklySchedule();
}

function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Show selected section
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Load section-specific data
    loadSectionData(section);
}

function loadSectionData(section) {
    switch(section) {
        case 'appointments':
            loadAllAppointments();
            break;
        case 'patients':
            loadPatients();
            break;
        case 'prescriptions':
            loadPrescriptions();
            break;
        case 'schedule':
            generateWeeklySchedule();
            break;
    }
}

function loadDashboardData() {
    // Load today's appointments
    loadTodaysAppointments();
    
    // Load all appointments
    loadAllAppointments();
    
    // Load patients
    loadPatients();
    
    // Load prescriptions
    loadPrescriptions();
    
    // Update stats
    updateDashboardStats();
}

function loadTodaysAppointments() {
    const appointments = [
        {
            id: 'A001',
            patient: 'John Doe',
            time: '09:00 AM',
            status: 'confirmed',
            type: 'Consultation'
        },
        {
            id: 'A002',
            patient: 'Jane Smith',
            time: '10:30 AM',
            status: 'pending',
            type: 'Follow-up'
        },
        {
            id: 'A003',
            patient: 'Mike Johnson',
            time: '02:15 PM',
            status: 'confirmed',
            type: 'Emergency'
        }
    ];

    const container = document.getElementById('todayAppointmentsList');
    container.innerHTML = '';

    appointments.forEach(apt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${apt.patient}</td>
            <td>${apt.time}</td>
            <td><span class="status-badge status-${apt.status}">${apt.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="viewAppointment('${apt.id}')">View</button>
                    <button class="btn btn-outline btn-sm" onclick="editAppointment('${apt.id}')">Edit</button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}

function loadAllAppointments() {
    const appointments = [
        {
            id: 'A001',
            patient: 'John Doe',
            date: '2023-10-20',
            time: '09:00 AM',
            type: 'Consultation',
            status: 'confirmed'
        },
        {
            id: 'A002', 
            patient: 'Jane Smith',
            date: '2023-10-20',
            time: '10:30 AM',
            type: 'Follow-up',
            status: 'pending'
        },
        {
            id: 'A003',
            patient: 'Mike Johnson',
            date: '2023-10-21',
            time: '11:00 AM',
            type: 'Checkup',
            status: 'confirmed'
        }
    ];

    const container = document.getElementById('appointmentsList');
    container.innerHTML = '';

    appointments.forEach(apt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${apt.id}</td>
            <td>${apt.patient}</td>
            <td>${apt.date} at ${apt.time}</td>
            <td>${apt.type}</td>
            <td><span class="status-badge status-${apt.status}">${apt.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="viewAppointment('${apt.id}')">View</button>
                    <button class="btn btn-outline btn-sm" onclick="editAppointment('${apt.id}')">Edit</button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}

function loadPatients() {
    const patients = [
        {
            id: 'P001',
            name: 'John Doe',
            phone: '+1 234-567-8900',
            lastVisit: '2023-10-15',
            history: 'Hypertension'
        },
        {
            id: 'P002',
            name: 'Jane Smith', 
            phone: '+1 234-567-8901',
            lastVisit: '2023-10-10',
            history: 'Diabetes'
        },
        {
            id: 'P003',
            name: 'Mike Johnson',
            phone: '+1 234-567-8902',
            lastVisit: '2023-10-18',
            history: 'Asthma'
        }
    ];

    const container = document.getElementById('patientsList');
    container.innerHTML = '';

    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.phone}</td>
            <td>${patient.lastVisit}</td>
            <td>${patient.history}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="viewPatient('${patient.id}')">View</button>
                    <button class="btn btn-outline btn-sm" onclick="viewPatientHistory('${patient.id}')">History</button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}

function loadPrescriptions() {
    const prescriptions = [
        {
            id: 'RX20231020001',
            patient: 'John Doe',
            date: '2023-10-20',
            medications: ['Paracetamol', 'Ibuprofen'],
            status: 'active'
        },
        {
            id: 'RX20231019001',
            patient: 'Jane Smith',
            date: '2023-10-19',
            medications: ['Amoxicillin'],
            status: 'completed'
        }
    ];

    const container = document.getElementById('prescriptionsList');
    if (!container) return;

    container.innerHTML = '';

    prescriptions.forEach(prescription => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${prescription.id}</td>
            <td>${prescription.patient}</td>
            <td>${prescription.date}</td>
            <td>${prescription.medications.join(', ')}</td>
            <td><span class="status-badge status-${prescription.status}">${prescription.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="viewPrescription('${prescription.id}')">View</button>
                    <button class="btn btn-outline btn-sm" onclick="printPrescription('${prescription.id}')">Print</button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}

function updateDashboardStats() {
    // Update stats cards with real data
    document.getElementById('totalAppointments').textContent = '12';
    document.getElementById('todayAppointments').textContent = '5';
    document.getElementById('pendingAppointments').textContent = '3';
    document.getElementById('totalEarnings').textContent = '8,400';
}

function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Add day headers
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day';
        dayHeader.style.fontWeight = '600';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Add calendar days (simplified)
    for (let i = 1; i <= 31; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = i;
        
        // Mark some days as having appointments
        if ([5, 12, 19, 26].includes(i)) {
            day.classList.add('has-appointment');
        }
        
        if (i === 20) {
            day.classList.add('active');
        }
        
        calendarGrid.appendChild(day);
    }
}

function generateWeeklySchedule() {
    const scheduleGrid = document.getElementById('weeklySchedule');
    if (!scheduleGrid) return;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

    // Create schedule grid
    scheduleGrid.innerHTML = `
        <div class="time-column">
            <div class="time-header">Time</div>
            ${timeSlots.map(time => `<div class="time-slot">${time}</div>`).join('')}
        </div>
        ${days.map(day => `
            <div class="day-column">
                <div class="day-header">${day}</div>
                ${timeSlots.map(time => `<div class="time-slot" data-day="${day}" data-time="${time}"></div>`).join('')}
            </div>
        `).join('')}
    `;

    // Add some sample appointments
    const appointments = [
        { day: 'Monday', time: '10:00', patient: 'John Doe', type: 'consultation' },
        { day: 'Wednesday', time: '14:00', patient: 'Jane Smith', type: 'follow-up' },
        { day: 'Friday', time: '11:00', patient: 'Mike Johnson', type: 'emergency' }
    ];

    appointments.forEach(apt => {
        const slot = scheduleGrid.querySelector(`[data-day="${apt.day}"][data-time="${apt.time}"]`);
        if (slot) {
            slot.innerHTML = `
                <div class="appointment-slot" style="background: var(--primary); color: white; padding: 5px; border-radius: 4px; font-size: 0.8rem;">
                    ${apt.patient}
                </div>
            `;
        }
    });
}

function showNewAppointmentModal() {
    document.getElementById('newAppointmentModal').style.display = 'flex';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function viewAppointment(appointmentId) {
    alert(`View appointment ${appointmentId}`);
    // Implement view appointment functionality
}

function editAppointment(appointmentId) {
    alert(`Edit appointment ${appointmentId}`);
    // Implement edit appointment functionality
}

function viewPatient(patientId) {
    alert(`View patient ${patientId}`);
    // Implement view patient functionality
}

function viewPatientHistory(patientId) {
    alert(`View patient history ${patientId}`);
    // Implement view patient history functionality
}

function viewPrescription(prescriptionId) {
    alert(`View prescription ${prescriptionId}`);
    // Implement view prescription functionality
}

function printPrescription(prescriptionId) {
    alert(`Print prescription ${prescriptionId}`);
    // Implement print prescription functionality
}

function showNewPatientModal() {
    alert('Open new patient modal');
    // Implement new patient modal
}

function showScheduleModal() {
    alert('Open schedule editor modal');
    // Implement schedule editor modal
}