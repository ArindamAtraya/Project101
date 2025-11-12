// Doctor Availability JavaScript - Enhanced with Mobile Support
let currentDate = new Date();
let selectedDate = new Date();
let selectedTimeSlot = null;
let currentDoctor = null;
let isLoading = false;

// Initialize the page with enhanced features
document.addEventListener('DOMContentLoaded', function() {
    initializeDoctorAvailability();
    generateCalendar();
    loadTimeSlots();
    initializeMobileFeatures();
});

// Mobile features initialization
function initializeMobileFeatures() {
    // Handle touch interactions
    initializeTouchInteractions();
    
    // Handle viewport height for mobile
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    // Add loading states
    initializeLoadingStates();
}

function setViewportHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function initializeTouchInteractions() {
    // Add touch feedback for interactive elements
    const touchElements = document.querySelectorAll('.calendar-day, .time-slot-card, .btn');
    
    touchElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        element.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
}

function initializeLoadingStates() {
    // Simulate loading for better UX
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    if (timeSlotsGrid) {
        timeSlotsGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const loadingSlot = document.createElement('div');
            loadingSlot.className = 'time-slot-card loading-slot';
            loadingSlot.innerHTML = `
                <div class="time-slot-time" style="color: transparent;">Loading</div>
                <div class="time-slot-queue" style="color: transparent;">Loading</div>
            `;
            timeSlotsGrid.appendChild(loadingSlot);
        }
    }
}

function initializeDoctorAvailability() {
    // Get doctor info from URL parameters or default
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doctorId') || 'doc1';
    
    // In real app, this would be an API call
    currentDoctor = getDoctorById(doctorId);
    
    // Update doctor info with animation
    setTimeout(() => {
        document.getElementById('doctorName').textContent = currentDoctor.name;
        document.getElementById('doctorSpecialty').textContent = currentDoctor.specialty;
        document.getElementById('doctorHospital').textContent = currentDoctor.hospital;
        document.getElementById('doctorRating').textContent = currentDoctor.rating;
        
        // Add entrance animation
        document.querySelector('.doctor-header').style.animation = 'slideUp 0.6s ease';
    }, 300);
    
    // Update week range display
    updateWeekRangeDisplay();
}

function getDoctorById(doctorId) {
    // Mock doctor data - in real app, this would come from your backend
    const doctors = {
        'doc1': {
            id: 'doc1',
            name: 'Dr. Sarah Wilson',
            specialty: 'Cardiologist',
            hospital: 'Apollo Hospital',
            rating: 4.9,
            fee: 800
        },
        'doc2': {
            id: 'doc2',
            name: 'Dr. Raj Sharma',
            specialty: 'Dermatology',
            hospital: 'City Hospital',
            rating: 4.7,
            fee: 600
        },
        'doc3': {
            id: 'doc3',
            name: 'Dr. Priya Mehta',
            specialty: 'Pediatrics',
            hospital: 'Children Medical Center',
            rating: 4.8,
            fee: 700
        }
    };
    
    return doctors[doctorId] || doctors['doc1'];
}

function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Clear existing calendar
    calendarGrid.innerHTML = '';
    
    // Get start of current week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Generate 7 days for the week
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if this day is today
        const today = new Date();
        if (dayDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('active');
        }
        
        // Check if this day has available slots (mock logic)
        const hasAvailability = Math.random() > 0.3; // 70% chance of availability
        if (hasAvailability) {
            dayElement.classList.add('available');
        }
        
        // Add date number
        const dateNumber = document.createElement('div');
        dateNumber.textContent = dayDate.getDate();
        dateNumber.style.fontSize = '1.1rem';
        dateNumber.style.fontWeight = '600';
        dayElement.appendChild(dateNumber);
        
        // Add month abbreviation for mobile
        if (window.innerWidth <= 768) {
            const monthAbbr = document.createElement('div');
            monthAbbr.textContent = dayDate.toLocaleDateString('en-US', { month: 'short' });
            monthAbbr.style.fontSize = '0.7rem';
            monthAbbr.style.opacity = '0.7';
            monthAbbr.style.marginTop = '2px';
            dayElement.appendChild(monthAbbr);
        }
        
        dayElement.setAttribute('data-date', dayDate.toISOString().split('T')[0]);
        
        dayElement.addEventListener('click', function() {
            if (!isLoading) {
                selectDate(this.getAttribute('data-date'));
            }
        });
        
        calendarGrid.appendChild(dayElement);
    }
    
    updateWeekRangeDisplay();
}

function updateWeekRangeDisplay() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    const startStr = startOfWeek.toLocaleDateString('en-US', options);
    const endStr = endOfWeek.toLocaleDateString('en-US', options);
    
    // Format for mobile
    let displayText = `${startStr} - ${endStr}, ${currentDate.getFullYear()}`;
    if (window.innerWidth <= 480) {
        displayText = `${startStr} - ${endStr}`;
    }
    
    document.getElementById('currentWeekRange').textContent = displayText;
}

function previousWeek() {
    if (isLoading) return;
    
    currentDate.setDate(currentDate.getDate() - 7);
    generateCalendar();
    loadTimeSlots();
    
    // Add animation
    document.querySelector('.availability-calendar').style.animation = 'slideUp 0.4s ease';
}

function nextWeek() {
    if (isLoading) return;
    
    currentDate.setDate(currentDate.getDate() + 7);
    generateCalendar();
    loadTimeSlots();
    
    // Add animation
    document.querySelector('.availability-calendar').style.animation = 'slideUp 0.4s ease';
}

function selectDate(dateString) {
    if (isLoading) return;
    
    selectedDate = new Date(dateString);
    
    // Update calendar selection with animation
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('active');
        if (day.getAttribute('data-date') === dateString) {
            day.classList.add('active');
            day.style.animation = 'pulse 0.5s ease';
        }
    });
    
    // Update date display
    const options = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
    };
    
    let displayText = selectedDate.toLocaleDateString('en-US', options);
    if (window.innerWidth <= 480) {
        const mobileOptions = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric'
        };
        displayText = selectedDate.toLocaleDateString('en-US', mobileOptions);
    }
    
    document.getElementById('selectedDateDisplay').textContent = displayText;
    
    // Load time slots for selected date with loading state
    loadTimeSlots();
}

function loadTimeSlots() {
    if (isLoading) return;
    
    isLoading = true;
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    
    // Show loading state
    timeSlotsGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const loadingSlot = document.createElement('div');
        loadingSlot.className = 'time-slot-card loading-slot';
        loadingSlot.innerHTML = `
            <div class="time-slot-time" style="color: transparent;">Loading</div>
            <div class="time-slot-queue" style="color: transparent;">Loading</div>
        `;
        timeSlotsGrid.appendChild(loadingSlot);
    }
    
    // Simulate API call delay
    setTimeout(() => {
        // Mock time slots data - in real app, this would come from your backend
        const timeSlots = generateMockTimeSlots();
        
        timeSlotsGrid.innerHTML = '';
        
        if (timeSlots.length === 0) {
            timeSlotsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--gray);">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <h3>No Available Slots</h3>
                    <p>No time slots available for selected date. Please choose another date.</p>
                </div>
            `;
        } else {
            timeSlots.forEach(slot => {
                const slotElement = document.createElement('div');
                slotElement.className = 'time-slot-card';
                slotElement.setAttribute('data-time', slot.time);
                slotElement.setAttribute('data-queue', slot.queuePosition);
                
                // Add status indicator
                const statusElement = document.createElement('div');
                statusElement.className = `slot-status ${getSlotStatus(slot.queuePosition)}`;
                slotElement.appendChild(statusElement);
                
                slotElement.innerHTML += `
                    <div class="time-slot-time">${formatTimeForDisplay(slot.time)}</div>
                    <div class="time-slot-queue">${slot.queuePosition} in queue</div>
                `;
                
                slotElement.addEventListener('click', function() {
                    if (!isLoading) {
                        selectTimeSlot(this);
                    }
                });
                
                timeSlotsGrid.appendChild(slotElement);
            });
        }
        
        isLoading = false;
        
        // Add entrance animation
        timeSlotsGrid.style.animation = 'slideUp 0.5s ease';
        
    }, 800); // Simulate network delay
}

function getSlotStatus(queuePosition) {
    if (queuePosition === 0) return 'slot-available';
    if (queuePosition <= 2) return 'slot-busy';
    return 'slot-full';
}

function formatTimeForDisplay(time) {
    // Convert 24h to 12h format for better display
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function generateMockTimeSlots() {
    const slots = [];
    const baseTime = 9; // 9 AM
    const slotCount = 8; // 8 slots from 9 AM to 5 PM
    
    for (let i = 0; i < slotCount; i++) {
        const hour = baseTime + i;
        const time = `${hour}:00`;
        const queuePosition = Math.floor(Math.random() * 5); // 0-4 people in queue
        const available = queuePosition < 4; // Max 4 people per slot
        
        if (available) {
            slots.push({
                time: time,
                queuePosition: queuePosition,
                available: available
            });
        }
    }
    
    return slots;
}

function selectTimeSlot(slotElement) {
    if (isLoading) return;
    
    // Remove previous selection
    document.querySelectorAll('.time-slot-card').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add selection to clicked slot with animation
    slotElement.classList.add('selected');
    slotElement.style.animation = 'pulse 0.3s ease';
    
    // Store selected time slot
    selectedTimeSlot = {
        time: slotElement.getAttribute('data-time'),
        queuePosition: parseInt(slotElement.getAttribute('data-queue'))
    };
    
    // Show queue information
    showQueueInfo();
}

function showQueueInfo() {
    if (!selectedTimeSlot) return;
    
    const queueInfoPanel = document.getElementById('queueInfoPanel');
    const patientsBefore = selectedTimeSlot.queuePosition;
    const estimatedWait = patientsBefore * 15; // 15 minutes per patient
    
    // Calculate estimated time
    const [hours, minutes] = selectedTimeSlot.time.split(':').map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hours, minutes, 0, 0);
    
    const estimatedTime = new Date(slotTime.getTime() + estimatedWait * 60000);
    const estimatedTimeStr = estimatedTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Update queue info
    document.getElementById('queuePosition').textContent = `#${patientsBefore + 1}`;
    document.getElementById('patientsBefore').textContent = patientsBefore;
    document.getElementById('estimatedWait').textContent = `${estimatedWait} minutes`;
    document.getElementById('estimatedTime').textContent = estimatedTimeStr;
    
    // Show the panel
    queueInfoPanel.classList.add('active');
    
    // Scroll to the panel smoothly on mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            queueInfoPanel.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'nearest'
            });
        }, 300);
    }
}

function closeQueueInfo() {
    const queueInfoPanel = document.getElementById('queueInfoPanel');
    queueInfoPanel.classList.remove('active');
    
    // Clear selection
    document.querySelectorAll('.time-slot-card').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    selectedTimeSlot = null;
}

function confirmBooking() {
    if (!selectedTimeSlot) {
        showNotification('Please select a time slot first.', 'error');
        return;
    }
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showNotification('Please login to book an appointment.', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    // Show loading state
    const confirmBtn = document.querySelector('.btn-xl');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<div class="loading"></div> Processing...';
    confirmBtn.disabled = true;
    
    // Create booking data
    const bookingData = {
        doctorId: currentDoctor.id,
        doctorName: currentDoctor.name,
        doctorSpecialty: currentDoctor.specialty,
        hospital: currentDoctor.hospital,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTimeSlot.time,
        patientId: currentUser.id,
        patientName: currentUser.name,
        queuePosition: selectedTimeSlot.queuePosition + 1,
        estimatedWait: selectedTimeSlot.queuePosition * 15,
        fee: currentDoctor.fee,
        bookingTime: new Date().toISOString()
    };
    
    // Simulate API call
    setTimeout(() => {
        // Save booking to localStorage (in real app, this would be an API call)
        const bookingId = saveBooking(bookingData);
        
        // Show success message
        showNotification('Appointment booked successfully!', 'success');
        
        // Redirect to booking dashboard
        setTimeout(() => {
            window.location.href = `booking-dashboard.html?bookingId=${bookingId}`;
        }, 1500);
        
    }, 2000);
}

function saveBooking(bookingData) {
    // Generate unique booking ID
    bookingData.bookingId = 'BK' + Date.now();
    
    // Get existing bookings or initialize empty array
    const bookings = JSON.parse(localStorage.getItem('patientBookings')) || [];
    
    // Add new booking
    bookings.push(bookingData);
    
    // Save back to localStorage
    localStorage.setItem('patientBookings', JSON.stringify(bookings));
    
    return bookingData.bookingId;
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, 5000);
    
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

// Utility function to format date
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Add CSS for pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .touch-active {
        transform: scale(0.95);
    }
    
    .btn-text {
        display: inline;
    }
    
    @media (max-width: 480px) {
        .btn-text {
            display: inline !important;
        }
    }
    
    /* Ensure queue number is white */
    #queuePosition {
        color: white !important;
    }
    
    /* Ensure doctor specialty is white */
    #doctorSpecialty {
        color: white !important;
    }
`;
document.head.appendChild(style);