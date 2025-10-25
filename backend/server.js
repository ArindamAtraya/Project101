const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'healthconnect-secret-key-2023';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory database (for demo)
let users = [];
let doctors = [];
let appointments = [];
let tests = [];

// Initialize sample data
function initializeSampleData() {
    // Sample users
    const hashedPassword = bcrypt.hashSync('password123', 10);
    users = [
        {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
            password: hashedPassword,
            phone: '+1234567890',
            role: 'patient',
            createdAt: new Date()
        },
        {
            id: 'doc1',
            name: 'Dr. Sarah Wilson',
            email: 'sarah@hospital.com',
            password: hashedPassword,
            phone: '+1234567891',
            role: 'doctor',
            createdAt: new Date()
        }
    ];

    // Sample doctors
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
            availableSlots: ['09:00', '11:00', '14:00', '16:00'],
            qualifications: ['MBBS, MD - Cardiology'],
            experience: '10+ years',
            about: 'Senior Cardiologist with extensive experience in heart care.'
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
            availableSlots: ['10:00', '13:00', '15:00', '17:00'],
            qualifications: ['MBBS, MD - Dermatology'],
            experience: '8+ years',
            about: 'Expert in skin treatments and cosmetic dermatology.'
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
            availableSlots: ['09:30', '11:30', '14:30', '16:30'],
            qualifications: ['MBBS, DCH, MD - Pediatrics'],
            experience: '12+ years',
            about: 'Specialized in child healthcare and development.'
        }
    ];

    // Sample tests
    tests = [
        {
            id: 'test1',
            name: 'Complete Blood Count',
            description: 'Measures different components of blood including red cells, white cells, and platelets',
            price: 499,
            homeCollection: true,
            fasting: false,
            reportTime: '24 hours'
        },
        {
            id: 'test2',
            name: 'Blood Sugar Test',
            description: 'Measures glucose levels in blood to screen for diabetes',
            price: 299,
            homeCollection: true,
            fasting: true,
            reportTime: '6 hours'
        }
    ];
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'HealthConnect API is running',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/auth/register',
            '/api/auth/login',
            '/api/doctors',
            '/api/hospitals',
            '/api/appointments'
        ]
    });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, role = 'patient' } = req.body;

        console.log('Registration attempt:', { name, email, role });

        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            phone,
            role,
            createdAt: new Date()
        };

        users.push(user);
        console.log('User registered successfully:', user.email);

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', email);

        // Find user
        const user = users.find(user => user.email === email);
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('Invalid password for:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful:', user.email);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
        }
    });
});

// Doctors Routes
app.get('/api/doctors', (req, res) => {
    const { specialty, hospital } = req.query;
    
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

    console.log('Returning doctors:', filteredDoctors.length);
    res.json(filteredDoctors);
});

app.get('/api/doctors/:id', (req, res) => {
    const doctor = doctors.find(d => d.id === req.params.id);
    if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
});

// Hospitals Routes
app.get('/api/hospitals', (req, res) => {
    const hospitalsList = [
        {
            id: 'hosp1',
            name: 'Apollo Hospital',
            specialty: 'Multi-specialty',
            rating: 4.8,
            address: '123 Medical Avenue, City Center',
            distance: '2.3 km away',
            facilities: ['Emergency', 'ICU', 'Pharmacy', 'Lab'],
            doctors: doctors.filter(d => d.hospital === 'Apollo Hospital').length
        },
        {
            id: 'hosp2',
            name: 'City Hospital',
            specialty: 'General Medicine',
            rating: 4.5,
            address: '456 Health Street, Downtown',
            distance: '1.8 km away',
            facilities: ['Emergency', 'Pharmacy', 'Lab'],
            doctors: doctors.filter(d => d.hospital === 'City Hospital').length
        }
    ];
    res.json(hospitalsList);
});

// Pharmacies Routes
app.get('/api/pharmacies', (req, res) => {
    const pharmaciesList = [
        {
            id: 'pharm1',
            name: 'MedPlus Pharmacy',
            rating: 4.6,
            address: '123 Health Street, Medical City',
            distance: '1.2 km away',
            delivery: '30 min delivery',
            open24x7: true
        },
        {
            id: 'pharm2',
            name: 'Apollo Pharmacy',
            rating: 4.7,
            address: '456 Care Avenue, Downtown',
            distance: '2.1 km away',
            delivery: '45 min delivery',
            open24x7: false
        }
    ];
    res.json(pharmaciesList);
});

// Tests Routes
app.get('/api/tests', (req, res) => {
    res.json(tests);
});

// Appointments Routes
app.get('/api/appointments', authenticateToken, (req, res) => {
    const userAppointments = appointments.filter(apt => apt.patientId === req.user.id);
    res.json(userAppointments);
});

app.post('/api/appointments', authenticateToken, (req, res) => {
    try {
        const { doctorId, doctorName, date, time, notes } = req.body;

        console.log('Booking appointment:', { doctorId, doctorName, date, time });

        const doctor = doctors.find(d => d.id === doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const appointment = {
            id: uuidv4(),
            doctorId,
            doctorName,
            patientId: req.user.id,
            patientName: req.user.name,
            date,
            time,
            notes,
            status: 'confirmed',
            createdAt: new Date(),
            fee: doctor.fee
        };

        appointments.push(appointment);
        console.log('Appointment booked successfully:', appointment.id);

        res.json(appointment);
    } catch (error) {
        console.error('Appointment booking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test data endpoint
app.get('/api/test-data', (req, res) => {
    res.json({
        users: users.length,
        doctors: doctors.length,
        appointments: appointments.length,
        tests: tests.length
    });
});

// Initialize sample data
initializeSampleData();

// Start server
app.listen(PORT, () => {
    console.log(`🚀 HealthConnect server running on port ${PORT}`);
    console.log(`📍 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Test Data: http://localhost:${PORT}/api/test-data`);
    console.log('\n📋 Available API Endpoints:');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/doctors');
    console.log('   GET  /api/hospitals');
    console.log('   POST /api/appointments');
});