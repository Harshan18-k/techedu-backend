const express = require('express');
const cors = require('cors');

const app = express();

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'TechEdu Backend API is running!', 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Mock data for testing
const mockUsers = [
  { _id: '1', name: 'Administrator', email: 'admin@techedu.com', role: 'admin', isActive: true },
  { _id: '2', name: 'HARSHAN', email: 'harshan.k2024aids@sece.ac.in', role: 'user', isActive: true },
  { _id: '3', name: 'jeeva', email: 'jeeva@gmail.com', role: 'user', isActive: true },
  { _id: '4', name: 'madhan', email: 'madhan@gmail.com', role: 'user', isActive: true }
];

const mockContacts = [];
const mockAdmissions = [];

// API routes with mock data
app.get('/api/users', (req, res) => {
  res.json({ users: mockUsers });
});

app.get('/api/admin/contacts', (req, res) => {
  res.json({ contacts: mockContacts });
});

app.get('/api/admin/admissions', (req, res) => {
  res.json({ admissions: mockAdmissions });
});

app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: mockUsers.length,
    totalContacts: mockContacts.length,
    totalAdmissions: mockAdmissions.length,
    pendingAdmissions: 0
  });
});

// Catch all for debugging
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /api/test',
      'GET /api/users',
      'GET /api/admin/contacts',
      'GET /api/admin/admissions',
      'GET /api/admin/stats'
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});