const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// CORS - Allow all origins
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'in-progress', 'resolved'], default: 'new' }
}, { timestamps: true });

const admissionSchema = new mongoose.Schema({
  applicationNumber: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  course: { type: String, required: true },
  message: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

// Models with explicit collection names
const User = mongoose.model('User', userSchema, 'users');
const Contact = mongoose.model('Contact', contactSchema, 'contacts');
const SimpleAdmission = mongoose.model('SimpleAdmission', admissionSchema, 'simpleadmissions');

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'TechEdu Backend API is running!', status: 'OK' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes (no auth for testing)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/admissions', async (req, res) => {
  try {
    const admissions = await SimpleAdmission.find().sort({ createdAt: -1 });
    res.json({ admissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalContacts = await Contact.countDocuments();
    const totalAdmissions = await SimpleAdmission.countDocuments();
    const pendingAdmissions = await SimpleAdmission.countDocuments({ status: 'pending' });
    res.json({
      totalUsers,
      totalContacts,
      totalAdmissions,
      pendingAdmissions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Contact routes
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const contact = new Contact({ name, email, phone, subject, message });
    await contact.save();
    res.status(201).json({ message: 'Contact form submitted successfully', contact });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admission routes
app.post('/api/admissions/simple', async (req, res) => {
  try {
    const { fullName, email, phone, course, message } = req.body;
    const applicationNumber = 'APP' + Date.now();
    const admission = new SimpleAdmission({
      applicationNumber,
      fullName,
      email,
      phone,
      course,
      message
    });
    await admission.save();
    res.status(201).json({ message: 'Application submitted successfully', admission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admissions/all', async (req, res) => {
  try {
    const admissions = await SimpleAdmission.find().sort({ createdAt: -1 });
    res.json({ admissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});