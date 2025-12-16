const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');

const router = express.Router();

// Submit contact form
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').matches(/^\d{10}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('subject').trim().isLength({ min: 5 }).withMessage('Subject must be at least 5 characters'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
], async (req, res) => {
  try {
    console.log('📬 Contact form data received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Contact validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, subject, message } = req.body;
    console.log('✅ Contact validation passed, creating contact record...');

    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message
    });

    console.log('💾 Saving contact to MongoDB Atlas...');
    const savedContact = await contact.save();
    console.log('✅ Contact saved to MongoDB:', {
      id: savedContact._id,
      name: savedContact.name,
      email: savedContact.email,
      subject: savedContact.subject,
      createdAt: savedContact.createdAt
    });

    res.status(201).json({
      message: 'Contact form submitted successfully',
      contact: {
        id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email,
        subject: savedContact.subject,
        createdAt: savedContact.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Contact submission error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error while submitting contact form' });
  }
});

// Get all contacts (for admin)
router.get('/all', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    console.log('📬 Fetched contacts:', contacts.length);
    res.json({ contacts });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

module.exports = router;