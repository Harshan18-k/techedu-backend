const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = ex</mark>press();

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET'<mark marker-index=10 reference-tracker>, 'POST<mark marker-index=12 reference-tracker>', 'PUT<mark marker-index=14 reference-tracker>', 'DEL<mark marker-index=16 reference-tracker>ETE', '<mark marker-index=18 reference-tracker>OPTIONS<mark marker-index=20 reference-tracker>'],
  a<mark marker-index=22 reference-tracker>llowedH<mark marker-index=24 reference-tracker>eaders:<mark marker-index=26 reference-tracker> ['Cont<mark marker-index=28 reference-tracker>ent-Typ<mark marker-index=30 reference-tracker>e', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: trueker> }));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  e44 reference-tracker>mail</mark><nce-tracker>/mark></m-index=50 reference-tracker>ark>: x=62 reference-tracker>{ t2 reference-tracker>ype: String, required: tndex=55 reference-tracker>rue, unique: true </ reference-tracker>mark>},
  password: { type:e-tracker> reference-tracke reference-tracker>er>er-index=65 reference-tracker>r> Stringerence-tracker>, requierence-tracker>red: trerence-tracker>ue },
 <mark marker-ind<mark marference-tracker>er-index=74 reference-tracker>ark>a</mark>rker-inde<mark marker-index=57 reference-tracker>iarker-index=68 referen>ce-tracker>er-index=64 reference-tracker>x=60 reference-tracker>ndex=54 reference-tracker>x=51 reference-tracker>ker-index=49 reference-tracker>ex=46 reference-tracker> phone: { type: String, required: true },
  role: { type: String, default: 'user' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Contact Schema
const contactSchema = new mongoose.Schema({
  n</mark>ame: { type: String, required: true },
  email: { type: String, required: tru</mark>e },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'new' }
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema);

// Admission Schema
const admissionSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  course: { type: String, required: true },
  message: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  applicationNumber: { type: String, unique: true }
}, { timestamps: true });

admissionSchema.pre('save', function(next) {
  if (!this.applicationNumber) {
    this.applicationNumber = 'APP' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

const Admission = mongoose.model('Admission', admissionSchema);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'College Backend API is running!' });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
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
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json({ message: 'Contact saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/contact/all', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admission Routes
app.post('/api/admissions/simple', async (req, res) => {
  try {
    const admission = new Admission(req.body);
    await admission.save();
    res.status(201).json({
      message: 'Admission application submitted successfully',
      applicationId: admission._id,
      applicationNumber: admission.applicationNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admissions/all', async (req, res) => {
  try {
    const admissions = await Admission.find().sort({ createdAt: -1 });
    res.json({ admissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
