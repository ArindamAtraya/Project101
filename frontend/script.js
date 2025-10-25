// API Base URL - Use relative path for same origin
const API_BASE = '/api';

// Global State
let currentUser = null;
let doctors = [];
let hospitals = [];
let pharmacies = [];
let tests = [];
let currentDoctorForBooking = null;

// DOM Elements
const elements = {
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    loginModal: document.getElementById('loginModal'),
    signupModal: document.getElementById('signupModal'),
    bookingModal: document.getElementById('bookingModal'),
    searchFilterModal: document.getElementById('searchFilterModal'),
    resultsModal: document.getElementById('resultsModal'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    bookingForm: document.getElementById('bookingForm'),
    searchFilterForm: document.getElementById('searchFilterForm'),
    doctorsContainer: document.getElementById('doctors-container'),
    hospitalsContainer: document.getElementById('hospitals-container'),
    pharmaciesContainer: document.getElementById('pharmacies-container'),
    testsContainer: document.getElementById('tests-container'),
    specialtyFilter: document.getElementById('specialtyFilter'),
    hospitalFilter: document.getElementById('hospitalFilter'),
    globalSearch: document.getElementById('globalSearch')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

function initializeApp() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');
    
    if (token && savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Modal controls
    elements.loginBtn.addEventListener('click', () => showModal('loginModal'));
    elements.signupBtn.addEventListener('click', () => showModal('signupModal'));
    
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Form submissions
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.signupForm.addEventListener('submit', handleSignup);
    elements.bookingForm.addEventListener('submit', handleBooking);
    
    // Search filter form submission
    if (elements.searchFilterForm) {
        elements.searchFilterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            findDoctorAvailability();
        });
    }
    
    // Filter changes
    if (elements.specialtyFilter) {
        elements.specialtyFilter.addEventListener('change', filterDoctors);
    }
    if (elements.hospitalFilter) {
        elements.hospitalFilter.addEventListener('change', filterDoctors);
    }
    
    // Global search
    if (elements.globalSearch) {
        elements.globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchAll();
        });
    }

    // Modal background click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Show signup/login links
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    
    if (showSignup) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('signupModal');
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('loginModal');
        });
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers,
            ...options
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Call Error:', error);
        showNotification('Error connecting to server', 'error');
        throw error;
    }
}

// Authentication Functions
async function verifyToken(token) {
    try {
        const data = await apiCall('/auth/verify');
        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthUI();
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        currentUser = data.user;
        updateAuthUI();
        closeAllModals();
        showNotification('Login successful!', 'success');
        
        // Redirect to dashboard for doctors/hospitals
        if (currentUser.role === 'doctor' || currentUser.role === 'hospital') {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        showNotification('Login failed. Please check your credentials.', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const phone = document.getElementById('signupPhone').value;

    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, phone, role: 'patient' })
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        currentUser = data.user;
        updateAuthUI();
        closeAllModals();
        showNotification('Account created successfully!', 'success');
    } catch (error) {
        showNotification('Signup failed. Please try again.', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateAuthUI();
    showNotification('Logged out successfully', 'info');
}

// Data Loading Functions
async function loadInitialData() {
    try {
        await Promise.all([
            loadDoctors(),
            loadHospitals(),
            loadPharmacies(),
            loadTests()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
        // Load mock data if API is not available
        loadMockData();
    }
}

async function loadDoctors() {
    try {
        const data = await apiCall('/doctors');
        doctors = data;
        renderDoctors(doctors);
        updateHospitalFilter();
    } catch (error) {
        // If API fails, use mock data
        loadMockDoctors();
    }
}

async function loadHospitals() {
    try {
        const data = await apiCall('/hospitals');
        hospitals = data;
        renderHospitals(hospitals);
    } catch (error) {
        loadMockHospitals();
    }
}

async function loadPharmacies() {
    try {
        const data = await apiCall('/pharmacies');
        pharmacies = data;
        renderPharmacies(pharmacies);
    } catch (error) {
        loadMockPharmacies();
    }
}

async function loadTests() {
    try {
        const data = await apiCall('/tests');
        tests = data;
        renderTests(tests);
    } catch (error) {
        loadMockTests();
    }
}

// Rendering Functions
function renderDoctors(doctorsList) {
    const container = elements.doctorsContainer;
    if (!container) return;
    
    container.innerHTML = '';

    doctorsList.forEach(doctor => {
        const card = createDoctorCard(doctor);
        container.appendChild(card);
    });
}

function createDoctorCard(doctor) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-img">
            <i class="fas fa-user-md"></i>
        </div>
        <div class="card-content">
            <div class="card-header">
                <div>
                    <div class="card-title">${doctor.name}</div>
                    <div class="card-details">${doctor.specialty} · ${doctor.hospital}</div>
                </div>
                <div class="rating">⭐ ${doctor.rating} (${doctor.reviews})</div>
            </div>
            <div class="card-details">
                <div><i class="fas fa-map-marker-alt"></i> ${doctor.distance}</div>
                <div><i class="fas fa-clock"></i> ${doctor.availability}</div>
                <div class="availability">
                    ${doctor.availableSlots && doctor.availableSlots.length > 0 ? 
                        doctor.availableSlots.map(slot => 
                            `<span class="availability-badge">${slot}</span>`
                        ).join('') : 
                        '<span class="availability-badge">No slots today</span>'
                    }
                </div>
            </div>
            <div class="card-footer">
                <div class="price">₹${doctor.fee}</div>
                <button class="btn btn-primary" onclick="openBookingModal('${doctor.id}')">Book Appointment</button>
            </div>
        </div>
    `;
    return card;
}

function renderHospitals(hospitalsList) {
    const container = elements.hospitalsContainer;
    if (!container) return;
    
    container.innerHTML = '';

    hospitalsList.forEach(hospital => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img">
                <i class="fas fa-hospital"></i>
            </div>
            <div class="card-content">
                <div class="card-header">
                    <div>
                        <div class="card-title">${hospital.name}</div>
                        <div class="card-details">${hospital.specialty}</div>
                    </div>
                    <div class="rating">⭐ ${hospital.rating}</div>
                </div>
                <div class="card-details">
                    <div><i class="fas fa-map-marker-alt"></i> ${hospital.address}</div>
                    <div><i class="fas fa-location-arrow"></i> ${hospital.distance}</div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-outline" onclick="viewHospitalDoctors('${hospital.id}')">View Doctors</button>
                    <button class="btn btn-primary">Book Visit</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderPharmacies(pharmaciesList) {
    const container = elements.pharmaciesContainer;
    if (!container) return;
    
    container.innerHTML = '';

    pharmaciesList.forEach(pharmacy => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img">
                <i class="fas fa-prescription-bottle"></i>
            </div>
            <div class="card-content">
                <div class="card-header">
                    <div>
                        <div class="card-title">${pharmacy.name}</div>
                        <div class="card-details">${pharmacy.delivery}</div>
                    </div>
                    <div class="rating">⭐ ${pharmacy.rating}</div>
                </div>
                <div class="card-details">
                    <div><i class="fas fa-map-marker-alt"></i> ${pharmacy.address}</div>
                    <div><i class="fas fa-location-arrow"></i> ${pharmacy.distance}</div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-outline">View Medicines</button>
                    <button class="btn btn-primary">Order Now</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderTests(testsList) {
    const container = elements.testsContainer;
    if (!container) return;
    
    container.innerHTML = '';

    testsList.forEach(test => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img">
                <i class="fas fa-vial"></i>
            </div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-title">${test.name}</div>
                </div>
                <div class="card-details">${test.description}</div>
                <div class="card-details">
                    <div><i class="fas fa-home"></i> ${test.homeCollection ? 'Home Collection Available' : 'Lab Visit Required'}</div>
                    <div><i class="fas fa-utensils"></i> ${test.fasting ? 'Fasting Required' : 'No Fasting Required'}</div>
                </div>
                <div class="card-footer">
                    <div class="price">₹${test.price}</div>
                    <button class="btn btn-primary">Book Test</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Filter Functions
function filterDoctors() {
    const specialty = elements.specialtyFilter ? elements.specialtyFilter.value : '';
    const hospital = elements.hospitalFilter ? elements.hospitalFilter.value : '';

    let filteredDoctors = doctors;

    if (specialty) {
        filteredDoctors = filteredDoctors.filter(doctor => 
            doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
        );
    }

    if (hospital) {
        filteredDoctors = filteredDoctors.filter(doctor => 
            doctor.hospital.toLowerCase().includes(hospital.toLowerCase())
        );
    }

    renderDoctors(filteredDoctors);
}

function updateHospitalFilter() {
    const hospitalFilter = elements.hospitalFilter;
    if (!hospitalFilter) return;
    
    const hospitals = [...new Set(doctors.map(doctor => doctor.hospital))];
    
    hospitalFilter.innerHTML = '<option value="">All Hospitals</option>';
    hospitals.forEach(hospital => {
        hospitalFilter.innerHTML += `<option value="${hospital}">${hospital}</option>`;
    });
}

function searchAll() {
    const query = elements.globalSearch ? elements.globalSearch.value.toLowerCase() : '';
    if (!query) return;

    // Search in doctors
    const filteredDoctors = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.hospital.toLowerCase().includes(query)
    );

    // Switch to doctors tab and show results
    switchTab('doctors');
    renderDoctors(filteredDoctors);
    showNotification(`Found ${filteredDoctors.length} doctors matching "${query}"`, 'info');
}

// Booking Functions
function openBookingModal(doctorId) {
    if (!currentUser) {
        showNotification('Please login to book an appointment', 'error');
        showModal('loginModal');
        return;
    }

    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return;

    currentDoctorForBooking = doctor;
    document.getElementById('bookingTitle').textContent = `Book Appointment with ${doctor.name}`;
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;
    document.getElementById('bookingDate').value = today;
    
    // Generate time slots
    generateTimeSlots();
    showModal('bookingModal');
}

function generateTimeSlots() {
    const timeSelect = document.getElementById('bookingTime');
    if (!timeSelect) return;
    
    timeSelect.innerHTML = '<option value="">Choose a time slot</option>';
    
    // Generate slots from 9 AM to 5 PM
    for (let hour = 9; hour <= 17; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        timeSelect.innerHTML += `<option value="${time}">${time}</option>`;
    }
}

async function handleBooking(e) {
    e.preventDefault();
    
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const notes = document.getElementById('bookingNotes').value;

    if (!date || !time) {
        showNotification('Please select both date and time', 'error');
        return;
    }

    try {
        const appointment = await apiCall('/appointments', {
            method: 'POST',
            body: JSON.stringify({
                doctorId: currentDoctorForBooking.id,
                doctorName: currentDoctorForBooking.name,
                date,
                time,
                notes,
                patientId: currentUser.id,
                patientName: currentUser.name
            })
        });

        closeAllModals();
        showNotification('Appointment booked successfully!', 'success');
        
        // Generate queue information
        const queueInfo = generateQueueInfo(appointment);
        showQueueInfo(queueInfo);
        
    } catch (error) {
        showNotification('Failed to book appointment. Please try again.', 'error');
    }
}

function generateQueueInfo(appointment) {
    // Mock queue simulation
    const queuePosition = Math.floor(Math.random() * 5) + 1;
    const waitTime = queuePosition * 15; // 15 minutes per patient
    
    return {
        appointmentId: appointment.id,
        doctorName: appointment.doctorName,
        date: appointment.date,
        time: appointment.time,
        queuePosition,
        estimatedWait: waitTime,
        estimatedTime: calculateEstimatedTime(appointment.time, waitTime)
    };
}

function calculateEstimatedTime(appointmentTime, waitMinutes) {
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDate = new Date();
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    const estimatedTime = new Date(appointmentDate.getTime() + waitMinutes * 60000);
    return estimatedTime.toTimeString().split(' ')[0].substring(0, 5);
}

function showQueueInfo(queueInfo) {
    const queueHTML = `
        <div class="queue-display">
            <div class="queue-info">
                <div class="queue-position">#${queueInfo.queuePosition}</div>
                <div>Your position in queue</div>
            </div>
            <div class="card-details">
                <div><strong>Doctor:</strong> ${queueInfo.doctorName}</div>
                <div><strong>Appointment Time:</strong> ${queueInfo.time}</div>
                <div><strong>Estimated Wait:</strong> ${queueInfo.estimatedWait} minutes</div>
                <div><strong>Your turn at approx:</strong> ${queueInfo.estimatedTime}</div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn btn-primary" onclick="closeQueueInfo()">Got it</button>
            </div>
        </div>
    `;
    
    // Create modal for queue info
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Appointment Confirmed!</h3>
                <button class="close-modal" onclick="closeQueueInfo()">&times;</button>
            </div>
            ${queueHTML}
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeQueueInfo() {
    const modal = document.querySelector('.modal:last-child');
    if (modal) {
        modal.remove();
    }
}

// Search Filter Functions
function openSearchFilter() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').min = today;
    document.getElementById('appointmentDate').value = today;
    
    showModal('searchFilterModal');
}

function findDoctorAvailability() {
    const doctorName = document.getElementById('doctorName').value;
    const location = document.getElementById('location').value;
    const specialty = document.getElementById('specialty').value;
    const date = document.getElementById('appointmentDate').value;

    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }

    // Simulate API call - in real app, this would call your backend
    const results = simulateDoctorSearch(doctorName, location, specialty, date);
    
    displaySearchResults(results, { doctorName, location, specialty, date });
    closeAllModals();
    showModal('resultsModal');
}

function simulateDoctorSearch(doctorName, location, specialty, date) {
    // Mock data - in real app, this would come from your backend
    const allLocations = [
        {
            id: 'loc1',
            name: 'Apollo Hospital',
            type: 'hospital',
            address: '123 Medical Avenue, City Center',
            distance: '2.3 km away',
            phone: '+1 234-567-8900',
            doctor: 'Dr. Sarah Wilson',
            specialty: 'Cardiology',
            availableSlots: ['09:00', '11:00', '14:00', '16:00']
        },
        {
            id: 'loc2', 
            name: 'City Hospital',
            type: 'hospital',
            address: '456 Health Street, Downtown',
            distance: '1.8 km away',
            phone: '+1 234-567-8901',
            doctor: 'Dr. Sarah Wilson',
            specialty: 'Cardiology',
            availableSlots: ['10:00', '13:00', '15:00']
        },
        {
            id: 'loc3',
            name: 'MedPlus Clinic',
            type: 'clinic', 
            address: '789 Care Road, Westside',
            distance: '3.5 km away',
            phone: '+1 234-567-8902',
            doctor: 'Dr. Sarah Wilson',
            specialty: 'Cardiology',
            availableSlots: ['09:30', '11:30', '14:30']
        },
        {
            id: 'loc4',
            name: 'Wellness Pharmacy & Clinic',
            type: 'pharmacy',
            address: '321 Health Lane, Northside',
            distance: '4.2 km away', 
            phone: '+1 234-567-8903',
            doctor: 'Dr. Sarah Wilson',
            specialty: 'Cardiology',
            availableSlots: ['08:00', '12:00', '17:00']
        }
    ];

    // Filter based on search criteria
    let filtered = allLocations;

    if (doctorName) {
        filtered = filtered.filter(loc => 
            loc.doctor.toLowerCase().includes(doctorName.toLowerCase())
        );
    }

    if (location) {
        filtered = filtered.filter(loc => 
            loc.address.toLowerCase().includes(location.toLowerCase())
        );
    }

    if (specialty) {
        filtered = filtered.filter(loc => 
            loc.specialty === specialty
        );
    }

    return filtered;
}

function displaySearchResults(results, searchCriteria) {
    const container = document.getElementById('resultsContainer');
    const title = document.getElementById('resultsTitle');
    
    // Update title with search info
    let titleText = 'Doctor Availability Results';
    if (searchCriteria.doctorName) {
        titleText = `Availability for ${searchCriteria.doctorName}`;
    }
    title.textContent = titleText;

    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-availability">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <h3>No Availability Found</h3>
                <p>No doctors found matching your criteria for ${searchCriteria.date}. Try adjusting your search filters.</p>
                <button class="btn btn-primary" onclick="openSearchFilter()" style="margin-top: 15px;">
                    Modify Search
                </button>
            </div>
        `;
        return;
    }

    let html = `
        <div class="filter-tags">
            <div class="filter-tag">
                <i class="fas fa-calendar"></i>
                Date: ${searchCriteria.date}
                <span class="remove" onclick="clearSearch()">×</span>
            </div>
            ${searchCriteria.doctorName ? `
                <div class="filter-tag">
                    <i class="fas fa-user-md"></i>
                    Doctor: ${searchCriteria.doctorName}
                </div>
            ` : ''}
            ${searchCriteria.location ? `
                <div class="filter-tag">
                    <i class="fas fa-map-marker-alt"></i>
                    Location: ${searchCriteria.location}
                </div>
            ` : ''}
            ${searchCriteria.specialty ? `
                <div class="filter-tag">
                    <i class="fas fa-stethoscope"></i>
                    Specialty: ${searchCriteria.specialty}
                </div>
            ` : ''}
        </div>
        
        <div class="results-grid">
    `;

    results.forEach(location => {
        const typeIcon = getLocationTypeIcon(location.type);
        const typeColor = getLocationTypeColor(location.type);
        
        html += `
            <div class="location-section">
                <div class="location-header">
                    <div>
                        <div class="location-name">${location.name}</div>
                        <div class="card-details">${location.doctor} - ${location.specialty}</div>
                    </div>
                    <div class="location-type" style="background: ${typeColor}">
                        ${typeIcon} ${location.type.toUpperCase()}
                    </div>
                </div>
                
                <div class="location-info">
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        ${location.address}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-location-arrow"></i>
                        ${location.distance}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        ${location.phone}
                    </div>
                </div>
                
                <div class="availability-section">
                    <h4>Available Time Slots:</h4>
                    <div class="availability-slots">
                        ${location.availableSlots.map(slot => `
                            <button class="time-slot" onclick="bookAppointmentFromSearch('${location.id}', '${slot}', '${location.doctor}', '${location.name}')">
                                ${slot}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="viewLocationDetails('${location.id}')">
                        <i class="fas fa-info-circle"></i> View Details
                    </button>
                    <button class="btn btn-outline" onclick="getDirections('${location.address}')">
                        <i class="fas fa-directions"></i> Get Directions
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function getLocationTypeIcon(type) {
    const icons = {
        'hospital': '🏥',
        'clinic': '🩺', 
        'pharmacy': '💊',
        'lab': '🔬'
    };
    return icons[type] || '📍';
}

function getLocationTypeColor(type) {
    const colors = {
        'hospital': '#ef4444',
        'clinic': '#10b981',
        'pharmacy': '#f59e0b',
        'lab': '#8b5cf6'
    };
    return colors[type] || '#64748b';
}

function bookAppointmentFromSearch(locationId, timeSlot, doctorName, locationName) {
    if (!currentUser) {
        showNotification('Please login to book an appointment', 'error');
        showModal('loginModal');
        return;
    }

    const date = document.getElementById('appointmentDate').value;
    
    showNotification(`Booking appointment with ${doctorName} at ${locationName} - ${timeSlot} on ${date}`, 'success');
    
    // In real app, this would call your booking API
    setTimeout(() => {
        closeAllModals();
        showNotification('Appointment booked successfully!', 'success');
    }, 2000);
}

function viewLocationDetails(locationId) {
    showNotification('Location details feature coming soon!', 'info');
}

function getDirections(address) {
    // Open in Google Maps
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
}

function clearSearch() {
    document.getElementById('searchFilterForm').reset();
    closeAllModals();
}

// UI Helper Functions
function switchTab(tabId) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        }
    });

    // Update dashboards
    document.querySelectorAll('.dashboard').forEach(dashboard => {
        dashboard.classList.remove('active');
        if (dashboard.id === `${tabId}-tab`) {
            dashboard.classList.add('active');
        }
    });
}

function showModal(modalId) {
    closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
    if (currentUser) {
        authButtons.innerHTML = `
            <span style="margin-right: 15px; font-weight: 600;">Hello, ${currentUser.name}</span>
            <button class="btn btn-outline" onclick="handleLogout()">Logout</button>
            ${currentUser.role !== 'patient' ? 
                `<button class="btn btn-primary" onclick="window.location.href='dashboard.html'">Dashboard</button>` : 
                `<button class="btn btn-primary" onclick="showNotification('Patient dashboard coming soon!', 'info')">My Appointments</button>`
            }
        `;
    } else {
        authButtons.innerHTML = `
            <button class="btn btn-outline" id="loginBtn">Login</button>
            <button class="btn btn-primary" id="signupBtn">Sign Up</button>
        `;
        // Re-attach event listeners
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        if (loginBtn) loginBtn.addEventListener('click', () => showModal('loginModal'));
        if (signupBtn) signupBtn.addEventListener('click', () => showModal('signupModal'));
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Utility Functions
function viewHospitalDoctors(hospitalId) {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (hospital) {
        const hospitalDoctors = doctors.filter(d => d.hospital === hospital.name);
        switchTab('doctors');
        renderDoctors(hospitalDoctors);
        showNotification(`Showing doctors from ${hospital.name}`, 'info');
    }
}

// Mock Data Functions (Fallback when API is not available)
function loadMockData() {
    loadMockDoctors();
    loadMockHospitals();
    loadMockPharmacies();
    loadMockTests();
}

function loadMockDoctors() {
    doctors = [
        {
            id: 'doc1',
            name: 'Dr. Sarah Wilson',
            specialty: 'Cardiology',
            hospital: 'Apollo Hospital',
            rating: 4.9,
            reviews: 124,
            distance: '2.3 km away',
            availability: 'Available Today',
            fee: 800,
            availableSlots: ['09:00', '11:00', '14:00']
        },
        {
            id: 'doc2',
            name: 'Dr. Raj Sharma',
            specialty: 'Dermatology',
            hospital: 'City Hospital',
            rating: 4.7,
            reviews: 89,
            distance: '1.8 km away',
            availability: 'Available Tomorrow',
            fee: 600,
            availableSlots: ['10:00', '13:00', '15:00']
        },
        {
            id: 'doc3',
            name: 'Dr. Priya Mehta',
            specialty: 'Pediatrics',
            hospital: 'Children Medical Center',
            rating: 4.8,
            reviews: 156,
            distance: '3.2 km away',
            availability: 'Available Today',
            fee: 700,
            availableSlots: ['09:30', '11:30', '16:00']
        }
    ];
    renderDoctors(doctors);
    updateHospitalFilter();
}

function loadMockHospitals() {
    hospitals = [
        {
            id: 'hosp1',
            name: 'Apollo Hospital',
            specialty: 'Multi-specialty',
            rating: 4.8,
            address: '123 Medical Avenue, City Center',
            distance: '2.3 km away'
        },
        {
            id: 'hosp2',
            name: 'City Hospital',
            specialty: 'General Medicine',
            rating: 4.5,
            address: '456 Health Street, Downtown',
            distance: '1.8 km away'
        }
    ];
    renderHospitals(hospitals);
}

function loadMockPharmacies() {
    pharmacies = [
        {
            id: 'pharm1',
            name: 'MedPlus Pharmacy',
            rating: 4.6,
            address: '123 Health Street, Medical City',
            distance: '1.2 km away',
            delivery: '30 min delivery'
        },
        {
            id: 'pharm2',
            name: 'Apollo Pharmacy',
            rating: 4.7,
            address: '456 Care Avenue, Downtown',
            distance: '2.1 km away',
            delivery: '45 min delivery'
        }
    ];
    renderPharmacies(pharmacies);
}

function loadMockTests() {
    tests = [
        {
            id: 'test1',
            name: 'Complete Blood Count',
            description: 'Measures different components of blood',
            price: 499,
            homeCollection: true,
            fasting: false
        },
        {
            id: 'test2',
            name: 'Blood Sugar Test',
            description: 'Measures glucose levels in blood',
            price: 299,
            homeCollection: true,
            fasting: true
        }
    ];
    renderTests(tests);
}

// Export functions for global access
window.openBookingModal = openBookingModal;
window.handleLogout = handleLogout;
window.searchAll = searchAll;
window.closeQueueInfo = closeQueueInfo;
window.viewHospitalDoctors = viewHospitalDoctors;
window.openSearchFilter = openSearchFilter;
window.bookAppointmentFromSearch = bookAppointmentFromSearch;
window.viewLocationDetails = viewLocationDetails;
window.getDirections = getDirections;
window.clearSearch = clearSearch;