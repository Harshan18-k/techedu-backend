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
  { _id: '693fa22a51eb329600a6318a', name: 'Administrator', email: 'admin@techedu.com', role: 'admin', isActive: true, phone: '1234567890', createdAt: '2025-12-15T05:52:42.019Z' },
  { _id: '693fad997763b512a920d52c', name: 'HARSHAN', email: 'harshan.k2024aids@sece.ac.in', role: 'user', isActive: true, phone: '7604990626', createdAt: '2025-12-15T06:41:29.785Z' },
  { _id: '69412e61b241d68db38f6bac', name: 'jeeva', email: 'jeeva@gmail.com', role: 'user', isActive: true, phone: '6382312593', createdAt: '2025-12-16T10:03:13.187Z' },
  { _id: '694233e9b8f3b9cba1bf9364', name: 'madhan', email: 'madhan@gmail.com', role: 'user', isActive: true, createdAt: '2025-12-17T04:39:05.171Z' }
];

const mockContacts = [
  { _id: '1', name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', subject: 'Course Inquiry', message: 'I would like to know more about your React course.', status: 'new', createdAt: new Date().toISOString() },
  { _id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', subject: 'Technical Support', message: 'Having trouble accessing my account.', status: 'in-progress', createdAt: new Date().toISOString() }
];

const mockAdmissions = [
  { _id: '1', applicationNumber: 'APP1734567890123', fullName: 'Alice Johnson', email: 'alice@example.com', phone: '555-0123', course: 'cs', message: 'Passionate about computer science', status: 'pending', createdAt: new Date().toISOString() },
  { _id: '2', applicationNumber: 'APP1734567890124', fullName: 'Bob Wilson', email: 'bob@example.com', phone: '555-0124', course: 'eng', message: 'Engineering has always been my dream', status: 'approved', createdAt: new Date().toISOString() }
];

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
    pendingAdmissions: mockAdmissions.filter(a => a.status === 'pending').length
  });
});

// Contact management endpoints
app.put('/api/admin/contacts/:id', (req, res) => {
  const { status } = req.body;
  const contactIndex = mockContacts.findIndex(c => c._id === req.params.id);
  if (contactIndex !== -1) {
    mockContacts[contactIndex].status = status;
    res.json({ message: 'Contact status updated', contact: mockContacts[contactIndex] });
  } else {
    res.status(404).json({ message: 'Contact not found' });
  }
});

app.delete('/api/admin/contacts/:id', (req, res) => {
  const contactIndex = mockContacts.findIndex(c => c._id === req.params.id);
  if (contactIndex !== -1) {
    mockContacts.splice(contactIndex, 1);
    res.json({ message: 'Contact deleted successfully' });
  } else {
    res.status(404).json({ message: 'Contact not found' });
  }
});

// Admission management endpoints
app.put('/api/admin/admissions/:id', (req, res) => {
  const { status } = req.body;
  const admissionIndex = mockAdmissions.findIndex(a => a._id === req.params.id);
  if (admissionIndex !== -1) {
    mockAdmissions[admissionIndex].status = status;
    res.json({ message: 'Admission status updated', admission: mockAdmissions[admissionIndex] });
  } else {
    res.status(404).json({ message: 'Admission not found' });
  }
});

app.delete('/api/admin/admissions/:id', (req, res) => {
  const admissionIndex = mockAdmissions.findIndex(a => a._id === req.params.id);
  if (admissionIndex !== -1) {
    mockAdmissions.splice(admissionIndex, 1);
    res.json({ message: 'Admission deleted successfully' });
  } else {
    res.status(404).json({ message: 'Admission not found' });
  }
});

// User management endpoints
app.delete('/api/users/:id', (req, res) => {
  const userIndex = mockUsers.findIndex(u => u._id === req.params.id);
  if (userIndex !== -1) {
    mockUsers.splice(userIndex, 1);
    res.json({ message: 'User deleted successfully' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.put('/api/users/:id/toggle-status', (req, res) => {
  const userIndex = mockUsers.findIndex(u => u._id === req.params.id);
  if (userIndex !== -1) {
    mockUsers[userIndex].isActive = !mockUsers[userIndex].isActive;
    res.json({ message: 'User status updated', user: mockUsers[userIndex] });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
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