// Booking Dashboard JavaScript
let currentBooking = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeBookingDashboard();
});

function initializeBookingDashboard() {
    // Get booking ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    
    if (bookingId) {
        loadBookingDetails(bookingId);
    } else {
        // If no booking ID, try to get the latest booking
        loadLatestBooking();
    }
}

function loadBookingDetails(bookingId) {
    // In real app, this would be an API call
    const bookings = JSON.parse(localStorage.getItem('patientBookings')) || [];
    currentBooking = bookings.find(booking => booking.bookingId === bookingId);
    
    if (!currentBooking) {
        // If booking not found, show error and redirect
        alert('Booking not found. Redirecting to home page.');
        window.location.href = 'index.html';
        return;
    }
    
    updateDashboardDisplay();
}

function loadLatestBooking() {
    const bookings = JSON.parse(localStorage.getItem('patientBookings')) || [];
    if (bookings.length > 0) {
        currentBooking = bookings[bookings.length - 1];
        updateDashboardDisplay();
    } else {
        // No bookings found
        alert('No bookings found. Redirecting to home page.');
        window.location.href = 'index.html';
    }
}

function updateDashboardDisplay() {
    if (!currentBooking) return;
    
    // Update doctor information
    document.getElementById('dashboardDoctorName').textContent = currentBooking.doctorName;
    document.getElementById('dashboardSpecialty').textContent = currentBooking.doctorSpecialty;
    document.getElementById('dashboardHospital').textContent = currentBooking.hospital;
    document.getElementById('dashboardFee').textContent = `₹${currentBooking.fee}`;
    
    // Update appointment details
    const appointmentDate = new Date(currentBooking.date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dashboardDate').textContent = appointmentDate.toLocaleDateString('en-US', options);
    document.getElementById('dashboardTime').textContent = currentBooking.time;
    document.getElementById('dashboardBookingId').textContent = currentBooking.bookingId;
    
    const bookingTime = new Date(currentBooking.bookingTime);
    document.getElementById('dashboardBookingTime').textContent = bookingTime.toLocaleString('en-US', {
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    // Update patient information
    document.getElementById('dashboardPatientName').textContent = currentBooking.patientName;
    document.getElementById('dashboardPatientId').textContent = currentBooking.patientId;
    
    // Update queue information
    document.getElementById('dashboardQueuePosition').textContent = `#${currentBooking.queuePosition}`;
    document.getElementById('dashboardWaitTime').textContent = `${currentBooking.estimatedWait} minutes`;
    
    // Calculate estimated time
    const [hours, minutes] = currentBooking.time.split(':').map(Number);
    const slotTime = new Date(currentBooking.date);
    slotTime.setHours(hours, minutes, 0, 0);
    
    const estimatedTime = new Date(slotTime.getTime() + currentBooking.estimatedWait * 60000);
    const estimatedTimeStr = estimatedTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    document.getElementById('dashboardEstimatedTime').textContent = estimatedTimeStr;
}

function rescheduleAppointment() {
    if (confirm('Do you want to reschedule this appointment?')) {
        // Redirect to doctor availability page
        window.location.href = `doctor-availability.html?doctorId=${currentBooking.doctorId}`;
    }
}

function cancelAppointment() {
    if (confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
        // In real app, this would be an API call
        const bookings = JSON.parse(localStorage.getItem('patientBookings')) || [];
        const updatedBookings = bookings.filter(booking => booking.bookingId !== currentBooking.bookingId);
        localStorage.setItem('patientBookings', JSON.stringify(updatedBookings));
        
        alert('Appointment cancelled successfully.');
        window.location.href = 'patient-dashboard.html';
    }
}

function downloadTicket() {
    // Create a printable ticket
    const ticketContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Appointment Ticket - ${currentBooking.bookingId}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .ticket { border: 2px solid #000; padding: 20px; max-width: 500px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .section { margin-bottom: 15px; }
                .section-title { font-weight: bold; margin-bottom: 5px; }
                .detail-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .barcode { text-align: center; margin-top: 20px; font-family: 'Courier New', monospace; }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="header">
                    <h2>HealthConnect</h2>
                    <h3>Appointment Ticket</h3>
                </div>
                <div class="section">
                    <div class="section-title">Appointment Details</div>
                    <div class="detail-row"><span>Booking ID:</span><span>${currentBooking.bookingId}</span></div>
                    <div class="detail-row"><span>Date:</span><span>${document.getElementById('dashboardDate').textContent}</span></div>
                    <div class="detail-row"><span>Time:</span><span>${currentBooking.time}</span></div>
                    <div class="detail-row"><span>Queue Position:</span><span>${currentBooking.queuePosition}</span></div>
                </div>
                <div class="section">
                    <div class="section-title">Doctor Information</div>
                    <div class="detail-row"><span>Doctor:</span><span>${currentBooking.doctorName}</span></div>
                    <div class="detail-row"><span>Specialty:</span><span>${currentBooking.doctorSpecialty}</span></div>
                    <div class="detail-row"><span>Hospital:</span><span>${currentBooking.hospital}</span></div>
                </div>
                <div class="section">
                    <div class="section-title">Patient Information</div>
                    <div class="detail-row"><span>Patient:</span><span>${currentBooking.patientName}</span></div>
                    <div class="detail-row"><span>Patient ID:</span><span>${currentBooking.patientId}</span></div>
                </div>
                <div class="barcode">
                    ${currentBooking.bookingId}
                    <br>
                    <small>Scan at reception</small>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(ticketContent);
    printWindow.document.close();
    printWindow.print();
}

function getPharmacyDirections() {
    // Open directions in Google Maps
    const address = encodeURIComponent('Apollo Hospital, 123 Medical Avenue, City Center');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
}

// Auto-refresh queue information every 30 seconds
setInterval(() => {
    if (currentBooking) {
        // In real app, this would update from the server
        // For demo, we'll simulate queue movement
        if (currentBooking.queuePosition > 1 && Math.random() > 0.7) {
            currentBooking.queuePosition--;
            currentBooking.estimatedWait = (currentBooking.queuePosition - 1) * 15;
            updateDashboardDisplay();
        }
    }
}, 30000);