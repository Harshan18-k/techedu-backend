const express = require('express');
const User = require('../models/User');
const Contact = require('../models/Contact');
const SimpleAdmission = require('../models/SimpleAdmission');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Dashboard Statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalContacts = await Contact.countDocuments();
    const totalAdmissions = await SimpleAdmission.countDocuments();
    
    const recentUsers = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAdmissions = await SimpleAdmission.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalAdmins,
        totalContacts,
        totalAdmissions
      },
      recent: {
        users: recentUsers,
        contacts: recentContacts,
        admissions: recentAdmissions
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Get all contacts
router.get('/contacts', adminAuth, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (error) {
    console.error('Contacts fetch error:', error);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

// Update contact status
router.put('/contacts/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status, respondedBy: req.user._id, respondedAt: new Date() },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    res.json({ message: 'Contact updated successfully', contact });
  } catch (error) {
    console.error('Contact update error:', error);
    res.status(500).json({ message: 'Error updating contact' });
  }
});

// Delete contact
router.delete('/contacts/:id', adminAuth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Contact delete error:', error);
    res.status(500).json({ message: 'Error deleting contact' });
  }
});

// Get all admissions
router.get('/admissions', adminAuth, async (req, res) => {
  try {
    const admissions = await SimpleAdmission.find().sort({ createdAt: -1 });
    res.json({ admissions });
  } catch (error) {
    console.error('Admissions fetch error:', error);
    res.status(500).json({ message: 'Error fetching admissions' });
  }
});

module.exports = router;