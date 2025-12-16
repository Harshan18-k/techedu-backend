const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').matches(/^\d{10}$/).withMessage('Please enter a valid 10-digit phone number')
], async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;
    console.log('✅ Validation passed, checking existing user...');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    console.log('💾 Creating new user in MongoDB...');
    const user = new User({ name, email, password, phone });
    const savedUser = await user.save();
    console.log('✅ User saved to MongoDB:', { 
      id: savedUser._id,
      name: savedUser.name, 
      email: savedUser.email, 
      phone: savedUser.phone, 
      role: savedUser.role 
    });
    
    // Verify user was actually saved
    const verifyUser = await User.findById(savedUser._id);
    console.log('🔍 Verification - User exists in DB:', !!verifyUser);
    
    // Count total users
    const totalUsers = await User.countDocuments();
    console.log('📋 Total users in database:', totalUsers);

    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Login failed: User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found in MongoDB:', { name: user.name, email: user.email, role: user.role });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Login failed: Invalid password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.log('❌ Login failed: Account deactivated for:', email);
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    console.log('🎉 Login successful for:', user.name, '(' + user.role + ')');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    if (error.name === 'MongooseServerSelectionError') {
      return res.status(500).json({ message: 'Database connection error. Please try again later.' });
    }
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Create admin user (for setup) - No auth required
router.get('/create-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@techedu.com' });
    if (existingAdmin) {
      return res.json({ message: 'Admin already exists', admin: { email: 'admin@techedu.com' } });
    }

    const admin = new User({
      name: 'Administrator',
      email: 'admin@techedu.com',
      password: 'Admin123!',
      phone: '1234567890',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin user created via API');
    
    res.json({ 
      message: 'Admin created successfully',
      credentials: {
        email: 'admin@techedu.com',
        password: 'Admin123!'
      },
      instructions: 'You can now login with these credentials'
    });
  } catch (error) {
    console.error('❌ Admin creation error:', error);
    res.status(500).json({ message: 'Error creating admin' });
  }
});

// Create test user (for debugging)
router.get('/create-test-user', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      return res.json({ message: 'Test user already exists', user: { email: 'test@example.com' } });
    }

    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      role: 'user'
    });

    await testUser.save();
    console.log('✅ Test user created via API');
    
    res.json({ 
      message: 'Test user created successfully',
      credentials: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
  } catch (error) {
    console.error('❌ Admin creation error:', error);
    res.status(500).json({ message: 'Error creating admin' });
  }
});

// Get all users (for testing - remove in production)
router.get('/all-users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    console.log('📋 All users in database:', users.length);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', [
  auth,
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().matches(/^\d{10}$/).withMessage('Please enter a valid 10-digit phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Change password
router.put('/change-password', [
  auth,
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router;