// API Base URL - Use relative path for same origin
const API_BASE = '/api';

// Global State
let currentUser = null;
let doctors = [];
let hospitals = [];
let pharmacies = [];
let tests = [];
let currentDoctorForBooking = null;
let currentLocation = '';
let currentSpecialty = '';

// DOM Elements
const elements = {
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    loginModal: document.getElementById('loginModal'),
    signupModal: document.getElementById('signupModal'),
    bookingModal: document.getElementById('bookingModal'),
    searchFilterModal: document.getElementById('searchFilterModal'),
    resultsModal: document.getElementById('resultsModal'),
    locationModal: document.getElementById('locationModal'),
    providersModal: document.getElementById('providersModal'),
    doctorsModal: document.getElementById('doctorsModal'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    bookingForm: document.getElementById('bookingForm'),
    searchFilterForm: document.getElementById('searchFilterForm'),
    locationForm: document.getElementById('locationForm'),
    doctorsContainer: document.getElementById('doctors-container'),
    hospitalsContainer: document.getElementById('hospitals-container'),
    pharmaciesContainer: document.getElementById('pharmacies-container'),
    testsContainer: document.getElementById('tests-container'),
    specialtyFilter: document.getElementById('specialtyFilter'),
    hospitalFilter: document.getElementById('hospitalFilter'),
    globalSearch: document.getElementById('globalSearch'),
    providersContainer: document.getElementById('providersContainer'),
    doctorsListContainer: document.getElementById('doctorsContainer')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
    initializeDemoAccounts();
    initializeMobileFeatures();
});

// Demo Accounts Initialization
function initializeDemoAccounts() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Demo patient account with hospital records
    const demoPatient = {
        id: 'user_001',
        name: 'John Doe',
        email: 'patient@demo.com',
        password: 'demo123',
        role: 'patient',
        patientId: 'P123456',
        phone: '+1 234-567-8900',
        dob: '1988-05-15'
    };

    // Check if demo account already exists
    const existingPatient = users.find(u => u.email === demoPatient.email);
    if (!existingPatient) {
        users.push(demoPatient);
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Mobile Features Initialization
function initializeMobileFeatures() {
    // Handle viewport height for mobile browsers
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    // Initialize touch interactions
    initializeTouchInteractions();
    
    // Performance optimization for mobile
    optimizeForMobile();
}

function setViewportHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function initializeTouchInteractions() {
    const touchElements = document.querySelectorAll('.card, .feature-card, .btn, .time-slot');
    
    touchElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        element.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
}

function optimizeForMobile() {
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            setViewportHeight();
        }, 250);
    });

    // Prevent zoom on double-tap (iOS)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

function initializeApp() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');
    
    if (token && savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
    
    // Add device type detection
    detectDeviceType();
}

function detectDeviceType() {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
    } else if (isTablet) {
        document.body.classList.add('tablet-device');
    } else {
        document.body.classList.add('desktop-device');
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
    
    // Location form submission
    if (elements.locationForm) {
        elements.locationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            findHealthcareProviders();
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
            closeAllModals();
            showModal('signupModal');
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            showModal('loginModal');
        });
    }
}

// API Functions with Fallback to Demo
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
        
        // For auth endpoints, throw error to trigger demo fallback
        if (endpoint.includes('/auth/')) {
            throw error;
        }
        
        showNotification('Error connecting to server', 'error');
        throw error;
    }
}

// Authentication Functions with Demo Fallback
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        // Try API call first
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
        // API failed, try demo authentication
        console.log('API login failed, trying demo authentication...');
        handleDemoLogin(email, password);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const phone = document.getElementById('signupPhone').value;

    try {
        // Try API call first
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
        // API failed, create demo account
        console.log('API signup failed, creating demo account...');
        createDemoAccount(name, email, password, phone);
    }
}

// Demo Authentication Functions
function handleDemoLogin(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Generate demo token
        const token = 'demo_token_' + Math.random().toString(36).substr(2);
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
        
        updateAuthUI();
        closeAllModals();
        showNotification('Demo login successful!', 'success');
        
        // Redirect to dashboard for doctors/hospitals
        if (currentUser.role === 'doctor' || currentUser.role === 'hospital') {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } else {
        // Check if it's the pre-created demo account
        if (email === 'patient@demo.com' && password === 'demo123') {
            // Auto-create the demo account if it doesn't exist
            initializeDemoAccounts();
            handleDemoLogin(email, password);
        } else {
            showNotification('Invalid email or password. Try: patient@demo.com / demo123', 'error');
        }
    }
}

function createDemoAccount(name, email, password, phone) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showNotification('User already exists with this email', 'error');
        return;
    }
    
    const newUser = {
        id: 'user_' + Date.now(),
        name: name,
        email: email,
        password: password,
        phone: phone,
        role: 'patient',
        patientId: 'P' + Math.random().toString(36).substr(2, 6).toUpperCase()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    const token = 'demo_token_' + Math.random().toString(36).substr(2);
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    currentUser = newUser;
    
    updateAuthUI();
    closeAllModals();
    showNotification('Demo account created successfully!', 'success');
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
                <button class="btn btn-primary" onclick="openDoctorAvailability('${doctor.id}')">Check Availability</button>
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

// NEW: Function to open doctor availability page
function openDoctorAvailability(doctorId) {
    if (!currentUser) {
        showNotification('Please login to book an appointment', 'error');
        showModal('loginModal');
        return;
    }

    // Redirect to doctor availability page
    window.location.href = `doctor-availability.html?doctorId=${doctorId}`;
}

// NEW: Function to open booking dashboard
function openBookingDashboard(bookingId) {
    window.location.href = `booking-dashboard.html?bookingId=${bookingId}`;
}

// Update the existing openBookingModal function to redirect to availability page
function openBookingModal(doctorId) {
    if (!currentUser) {
        showNotification('Please login to book an appointment', 'error');
        showModal('loginModal');
        return;
    }

    // Redirect to doctor availability page instead of opening modal
    openDoctorAvailability(doctorId);
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
            doctorId: 'doc1',
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
            doctorId: 'doc1',
            availableSlots: ['10:00', '13:00', '15:00']
        },
        {
            id: 'loc3',
            name: 'MedPlus Clinic',
            type: 'clinic', 
            address: '789 Care Road, Westside',
            distance: '3.5 km away',
            phone: '+1 234-567-8902',
            doctor: 'Dr. Michael Brown',
            specialty: 'Orthopedics',
            doctorId: 'doc2',
            availableSlots: ['09:30', '11:30', '14:30']
        },
        {
            id: 'loc4',
            name: 'Wellness Pharmacy & Clinic',
            type: 'pharmacy',
            address: '321 Health Lane, Northside',
            distance: '4.2 km away', 
            phone: '+1 234-567-8903',
            doctor: 'Dr. Emily Chen',
            specialty: 'Neurology',
            doctorId: 'doc3',
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
                    <button class="btn btn-primary" onclick="openDoctorAvailability('${location.doctorId}')">
                        <i class="fas fa-info-circle"></i> View Details & Book
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

// Update the bookAppointmentFromSearch function
function bookAppointmentFromSearch(locationId, timeSlot, doctorName, locationName) {
    if (!currentUser) {
        showNotification('Please login to book an appointment', 'error');
        showModal('loginModal');
        return;
    }

    // For demo purposes, redirect to availability page of first doctor
    openDoctorAvailability('doc1');
}

// Update the viewLocationDetails function
function viewLocationDetails(locationId) {
    // Find the location and redirect to doctor availability
    const locations = simulateDoctorSearch('', '', '', '');
    const location = locations.find(loc => loc.id === locationId);
    
    if (location && location.doctorId) {
        openDoctorAvailability(location.doctorId);
    } else {
        showNotification('Doctor details not available', 'info');
    }
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

// Location-based Healthcare Provider Search
function openLocationModal() {
    showModal('locationModal');
}

function findHealthcareProviders() {
    const location = document.getElementById('bookingLocation').value;
    const specialty = document.getElementById('bookingSpecialty').value;

    if (!location) {
        showNotification('Please enter a location', 'error');
        return;
    }

    currentLocation = location;
    currentSpecialty = specialty;

    // Simulate API call - in real app, this would call your backend
    const providers = simulateHealthcareProviderSearch(location, specialty);
    
    displayHealthcareProviders(providers, { location, specialty });
    closeAllModals();
    showModal('providersModal');
}

function simulateHealthcareProviderSearch(location, specialty) {
    // Mock data - in real app, this would come from your backend
    const allProviders = [
        {
            id: 'hosp1',
            name: 'Apollo Hospital',
            type: 'hospital',
            address: '123 Medical Avenue, City Center',
            distance: '2.3 km away',
            phone: '+1 234-567-8900',
            rating: 4.8,
            specialties: ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics'],
            doctors: [
                { id: 'doc1', name: 'Dr. Sarah Wilson', specialty: 'Cardiology', availableSlots: ['09:00', '11:00', '14:00'] },
                { id: 'doc2', name: 'Dr. Michael Brown', specialty: 'Orthopedics', availableSlots: ['10:00', '13:00', '15:00'] },
                { id: 'doc3', name: 'Dr. Emily Chen', specialty: 'Neurology', availableSlots: ['09:30', '12:00', '16:00'] }
            ]
        },
        {
            id: 'hosp2',
            name: 'City Hospital',
            type: 'hospital',
            address: '456 Health Street, Downtown',
            distance: '1.8 km away',
            phone: '+1 234-567-8901',
            rating: 4.5,
            specialties: ['Cardiology', 'Dermatology', 'Gynecology'],
            doctors: [
                { id: 'doc4', name: 'Dr. Robert Johnson', specialty: 'Cardiology', availableSlots: ['08:00', '12:00', '17:00'] },
                { id: 'doc5', name: 'Dr. Lisa Garcia', specialty: 'Dermatology', availableSlots: ['09:00', '14:00', '16:30'] }
            ]
        },
        {
            id: 'clinic1',
            name: 'MedPlus Clinic',
            type: 'clinic',
            address: '789 Care Road, Westside',
            distance: '3.5 km away',
            phone: '+1 234-567-8902',
            rating: 4.6,
            specialties: ['General Medicine', 'Pediatrics'],
            doctors: [
                { id: 'doc6', name: 'Dr. James Wilson', specialty: 'General Medicine', availableSlots: ['08:30', '11:30', '15:30'] },
                { id: 'doc7', name: 'Dr. Maria Rodriguez', specialty: 'Pediatrics', availableSlots: ['09:00', '13:00', '16:00'] }
            ]
        },
        {
            id: 'pharm1',
            name: 'Wellness Pharmacy & Clinic',
            type: 'pharmacy',
            address: '321 Health Lane, Northside',
            distance: '4.2 km away',
            phone: '+1 234-567-8903',
            rating: 4.4,
            specialties: ['General Medicine'],
            doctors: [
                { id: 'doc8', name: 'Dr. David Lee', specialty: 'General Medicine', availableSlots: ['10:00', '14:00', '18:00'] }
            ]
        }
    ];

    // Filter based on search criteria
    let filtered = allProviders;

    if (location) {
        filtered = filtered.filter(provider => 
            provider.address.toLowerCase().includes(location.toLowerCase())
        );
    }

    if (specialty) {
        filtered = filtered.filter(provider => 
            provider.specialties.includes(specialty)
        );
    }

    return filtered;
}

function displayHealthcareProviders(providers, searchCriteria) {
    const container = document.getElementById('providersContainer');
    const title = document.getElementById('providersTitle');
    
    // Update title with search info
    let titleText = 'Healthcare Providers';
    if (searchCriteria.location) {
        titleText = `Providers in ${searchCriteria.location}`;
    }
    title.textContent = titleText;

    if (providers.length === 0) {
        container.innerHTML = `
            <div class="no-availability">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <h3>No Providers Found</h3>
                <p>No healthcare providers found in ${searchCriteria.location}. Try adjusting your search location.</p>
                <button class="btn btn-primary" onclick="openLocationModal()" style="margin-top: 15px;">
                    Modify Search
                </button>
            </div>
        `;
        return;
    }

    let html = `
        <div class="filter-tags">
            <div class="filter-tag">
                <i class="fas fa-map-marker-alt"></i>
                Location: ${searchCriteria.location}
                <span class="remove" onclick="clearLocationSearch()">×</span>
            </div>
            ${searchCriteria.specialty ? `
                <div class="filter-tag">
                    <i class="fas fa-stethoscope"></i>
                    Specialty: ${searchCriteria.specialty}
                </div>
            ` : ''}
        </div>
        
        <div class="results-grid">
    `;

    providers.forEach(provider => {
        const typeIcon = getLocationTypeIcon(provider.type);
        const typeColor = getLocationTypeColor(provider.type);
        
        html += `
            <div class="provider-card">
                <div class="provider-header">
                    <div class="provider-name">${provider.name}</div>
                    <div class="provider-type" style="background: ${typeColor}">
                        ${typeIcon} ${provider.type.toUpperCase()}
                    </div>
                </div>
                
                <div class="provider-info">
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        ${provider.address}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-location-arrow"></i>
                        ${provider.distance}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        ${provider.phone}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-star"></i>
                        Rating: ${provider.rating}/5
                    </div>
                    <div class="info-item">
                        <i class="fas fa-stethoscope"></i>
                        Specialties: ${provider.specialties.join(', ')}
                    </div>
                </div>
                
                <div class="provider-doctors">
                    <h4>Available Doctors:</h4>
                    <div class="doctors-list">
                        ${provider.doctors.map(doctor => `
                            <div class="doctor-item">
                                <div class="doctor-info">
                                    <div class="doctor-name">${doctor.name}</div>
                                    <div class="doctor-specialty">${doctor.specialty}</div>
                                </div>
                                <div class="doctor-availability">
                                    ${doctor.availableSlots.map(slot => `
                                        <button class="time-slot" onclick="bookDoctorAppointment('${provider.id}', '${doctor.id}', '${slot}', '${doctor.name}', '${provider.name}')">
                                            ${slot}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="openDoctorAvailability('${provider.doctors[0]?.id || 'doc1'}')">
                        <i class="fas fa-user-md"></i> View Doctors & Book
                    </button>
                    <button class="btn btn-outline" onclick="getDirections('${provider.address}')">
                        <i class="fas fa-directions"></i> Get Directions
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function viewAllDoctors(providerId) {
    // Find the provider
    const providers = simulateHealthcareProviderSearch(currentLocation, currentSpecialty);
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider) return;
    
    // Display all doctors in a modal
    const container = document.getElementById('doctorsContainer');
    const title = document.getElementById('doctorsTitle');
    
    title.textContent = `Doctors at ${provider.name}`;
    
    let html = `
        <div class="filter-tags">
            <div class="filter-tag">
                <i class="fas fa-map-marker-alt"></i>
                Location: ${currentLocation}
            </div>
            <div class="filter-tag">
                <i class="fas fa-hospital"></i>
                Provider: ${provider.name}
            </div>
        </div>
        
        <div class="doctors-list">
    `;
    
    provider.doctors.forEach(doctor => {
        html += `
            <div class="doctor-item">
                <div class="doctor-info">
                    <div class="doctor-name">${doctor.name}</div>
                    <div class="doctor-specialty">${doctor.specialty}</div>
                </div>
                <div class="doctor-availability">
                    ${doctor.availableSlots.map(slot => `
                        <button class="time-slot" onclick="openDoctorAvailability('${doctor.id}')">
                            ${slot}
                        </button>
                    `).join('')}
                </div>
                <div style="margin-top: 10px;">
                    <button class="btn btn-primary btn-sm" onclick="openDoctorAvailability('${doctor.id}')">
                        <i class="fas fa-calendar-plus"></i> View Full Availability
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    closeAllModals();
    showModal('doctorsModal');
}

function bookDoctorAppointment(providerId, doctorId, timeSlot, doctorName, providerName) {
    if (!currentUser) {
        showNotification('Please login to book an appointment', 'error');
        showModal('loginModal');
        return;
    }

    // Redirect to doctor availability page
    openDoctorAvailability(doctorId);
}

function clearLocationSearch() {
    document.getElementById('locationForm').reset();
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
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
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
                `<button class="btn btn-primary" onclick="window.location.href='patient-dashboard.html'">My Dashboard</button>`
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

// Enhanced Notification System
function showNotification(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, duration);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    });
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
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

// Add this new function to handle doctor details from hospital view
function viewDoctorDetails(doctorId) {
    openDoctorAvailability(doctorId);
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
window.openLocationModal = openLocationModal;
window.bookAppointmentFromSearch = bookAppointmentFromSearch;
window.viewLocationDetails = viewLocationDetails;
window.getDirections = getDirections;
window.clearSearch = clearSearch;
window.clearLocationSearch = clearLocationSearch;
window.viewAllDoctors = viewAllDoctors;
window.bookDoctorAppointment = bookDoctorAppointment;
window.openDoctorAvailability = openDoctorAvailability;
window.openBookingDashboard = openBookingDashboard;
window.viewDoctorDetails = viewDoctorDetails;
window.showNotification = showNotification;
window.showModal = showModal;
window.closeAllModals = closeAllModals;