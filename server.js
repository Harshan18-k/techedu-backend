const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
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

const User = mongoose.model('User', userSchema, 'users');
const Contact = mongoose.model('Contact', contactSchema, 'contacts');
const SimpleAdmission = mongoose.model('SimpleAdmission', admissionSchema, 'simpleadmissions');

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'TechEdu Backend API is running!', status: 'OK' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Debug endpoints (no auth required)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/debug/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts, count: contacts.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/debug/admissions', async (req, res) => {
  try {
    const admissions = await SimpleAdmission.find().sort({ createdAt: -1 });
    res.json({ admissions, count: admissions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Auth Routes
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

// Contact Routes
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

app.get('/api/contact', authenticateToken, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admission Routes
app.post('/api/admissions', async (req, res) => {
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

app.get('/api/admissions', async (req, res) => {
  try {
    const admissions = await SimpleAdmission.find().sort({ createdAt: -1 });
    res.json({ admissions });
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

app.put('/api/admin/admissions/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const admission = await SimpleAdmission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: 'Admission status updated', admission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/admin/admissions/:id', async (req, res) => {
  try {
    await SimpleAdmission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/users/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isActive = !user.isActive;
    user.status = user.isActive ? 'active' : 'inactive';
    await user.save();
    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Routes
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

app.put('/api/admin/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: 'Contact status updated', contact });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/admin/contacts/:id', authenticateToken, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/admin/create-admin', async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const admin = new User({
      name: 'Admin',
      email: 'admin@techedu.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});