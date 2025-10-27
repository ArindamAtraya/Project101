// Medical Records Management
class MedicalRecordsSystem {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('medicalRecords')) || [];
        this.currentFilter = 'all';
        this.currentSort = 'newest';
    }

    addRecord(recordData) {
        const record = {
            id: this.generateId(),
            ...recordData,
            uploadedAt: new Date().toISOString(),
            fileSize: this.formatFileSize(recordData.file.size)
        };
        
        this.records.unshift(record);
        this.saveToStorage();
        return record;
    }

    getAllRecords() {
        return this.records;
    }

    getRecordsByType(type) {
        return this.records.filter(record => record.type === type);
    }

    searchRecords(query) {
        return this.records.filter(record => 
            record.title.toLowerCase().includes(query.toLowerCase()) ||
            record.doctor.toLowerCase().includes(query.toLowerCase()) ||
            record.type.toLowerCase().includes(query.toLowerCase()) ||
            record.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    deleteRecord(recordId) {
        this.records = this.records.filter(record => record.id !== recordId);
        this.saveToStorage();
    }

    generateId() {
        return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    saveToStorage() {
        localStorage.setItem('medicalRecords', JSON.stringify(this.records));
    }
}

const medicalRecords = new MedicalRecordsSystem();

// Initialize Medical Records Page
document.addEventListener('DOMContentLoaded', function() {
    loadRecords();
    setupEventListeners();
});

function setupEventListeners() {
    // Upload form submission
    document.getElementById('uploadForm').addEventListener('submit', handleRecordUpload);
    
    // Search functionality
    document.getElementById('searchRecords').addEventListener('input', function() {
        if (this.value.length === 0) {
            loadRecords();
        }
    });
    
    // Modal controls
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
}

function loadRecords() {
    const filter = medicalRecords.currentFilter;
    const sort = document.getElementById('sortRecords').value;
    
    let records = [];
    if (filter === 'all') {
        records = medicalRecords.getAllRecords();
    } else {
        records = medicalRecords.getRecordsByType(filter);
    }

    // Sort records
    records.sort((a, b) => {
        switch(sort) {
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'type':
                return a.type.localeCompare(b.type);
            default: // newest
                return new Date(b.date) - new Date(a.date);
        }
    });

    displayRecords(records);
    updateStats();
}

function displayRecords(records) {
    const container = document.getElementById('recordsContainer');
    
    if (records.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical"></i>
                <h3>No medical records found</h3>
                <p>Upload your first medical record to get started</p>
                <button class="btn btn-primary" onclick="showUploadModal()">
                    <i class="fas fa-upload"></i> Upload Record
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = records.map(record => `
        <div class="record-card">
            <div class="record-header">
                <div>
                    <span class="record-type ${record.type}">${getTypeDisplayName(record.type)}</span>
                </div>
                <div class="record-date">${formatDate(record.date)}</div>
            </div>
            
            <div class="record-title">${record.title}</div>
            
            <div class="record-meta">
                <span><i class="fas fa-user-md"></i> ${record.doctor || 'Self-uploaded'}</span>
                <span><i class="fas fa-file"></i> ${record.file.name}</span>
                <span><i class="fas fa-weight"></i> ${record.fileSize}</span>
            </div>
            
            ${record.description ? `
            <div class="record-description">
                <p>${record.description}</p>
            </div>
            ` : ''}
            
            <div class="record-actions">
                <button class="btn btn-primary btn-sm" onclick="viewRecord('${record.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-outline btn-sm" onclick="downloadRecord('${record.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRecord('${record.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const records = medicalRecords.getAllRecords();
    const labReports = medicalRecords.getRecordsByType('lab').length;
    const prescriptions = medicalRecords.getRecordsByType('prescription').length;
    const scans = medicalRecords.getRecordsByType('scan').length;
    
    document.getElementById('totalRecords').textContent = records.length;
    document.getElementById('labReports').textContent = labReports;
    document.getElementById('prescriptions').textContent = prescriptions;
    document.getElementById('scans').textContent = scans;
}

function handleRecordUpload(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('recordFile');
    const type = document.getElementById('recordType').value;
    const title = document.getElementById('recordTitle').value;
    const date = document.getElementById('recordDate').value;
    const doctor = document.getElementById('recordDoctor').value;
    const description = document.getElementById('recordDescription').value;

    if (!fileInput.files[0]) {
        alert('Please select a file to upload');
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
    }

    const recordData = {
        type: type,
        title: title,
        date: date,
        doctor: doctor,
        description: description,
        file: file
    };

    // Add record to system
    medicalRecords.addRecord(recordData);
    
    // Show success message
    showNotification('Medical record uploaded successfully!', 'success');
    closeAllModals();
    
    // Reload records
    loadRecords();
    
    // Reset form
    document.getElementById('uploadForm').reset();
}

function viewRecord(recordId) {
    const record = medicalRecords.getAllRecords().find(r => r.id === recordId);
    if (record) {
        showRecordViewer(record);
    }
}

function showRecordViewer(record) {
    document.getElementById('viewerTitle').textContent = record.title;
    
    const content = document.getElementById('recordViewerContent');
    content.innerHTML = `
        <div class="record-details">
            <div class="detail-row">
                <label>Type:</label>
                <span class="record-type ${record.type}">${getTypeDisplayName(record.type)}</span>
            </div>
            <div class="detail-row">
                <label>Date:</label>
                <span>${formatDate(record.date)}</span>
            </div>
            <div class="detail-row">
                <label>Doctor/Hospital:</label>
                <span>${record.doctor || 'Self-uploaded'}</span>
            </div>
            <div class="detail-row">
                <label>File:</label>
                <span>${record.file.name} (${record.fileSize})</span>
            </div>
            ${record.description ? `
            <div class="detail-row">
                <label>Description:</label>
                <span>${record.description}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="record-preview">
            <div class="preview-placeholder">
                <i class="fas fa-file-medical" style="font-size: 4rem; color: var(--gray-light);"></i>
                <p>File Preview</p>
                <p class="text-muted">Preview would be displayed here for supported file types</p>
                <button class="btn btn-primary" onclick="downloadRecord('${record.id}')">
                    <i class="fas fa-download"></i> Download File
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('recordViewerModal').style.display = 'flex';
}

function downloadRecord(recordId) {
    const record = medicalRecords.getAllRecords().find(r => r.id === recordId);
    if (record) {
        // Simulate download
        showNotification(`Downloading ${record.file.name}...`, 'info');
        
        // In real implementation, create download link
        const url = URL.createObjectURL(record.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = record.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function deleteRecord(recordId) {
    if (confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
        medicalRecords.deleteRecord(recordId);
        showNotification('Medical record deleted successfully', 'success');
        loadRecords();
    }
}

function filterRecords(filter) {
    medicalRecords.currentFilter = filter;
    
    // Update active filter
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    loadRecords();
}

function searchRecords() {
    const query = document.getElementById('searchRecords').value;
    if (query.trim() === '') {
        loadRecords();
        return;
    }
    
    const results = medicalRecords.searchRecords(query);
    displayRecords(results);
}

function showUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
    // Set today's date as default
    document.getElementById('recordDate').value = new Date().toISOString().split('T')[0];
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Utility functions
function getTypeDisplayName(type) {
    const names = {
        'lab': 'Lab Report',
        'prescription': 'Prescription',
        'scan': 'Scan/Image',
        'vaccination': 'Vaccination',
        'other': 'Other'
    };
    return names[type] || type;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Use existing notification system or create simple alert
    alert(message);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}