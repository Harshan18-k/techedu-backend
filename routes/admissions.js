const express = require('express');
const { body, validationResult } = require('express-validator');
const Admission = require('../models/Admission');
const SimpleAdmission = require('../models/SimpleAdmission');
const Course = require('../models/Course');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all simple admissions (for admin) - MUST be before other routes
router.get('/all', async (req, res) => {
  try {
    const admissions = await SimpleAdmission.find().sort({ createdAt: -1 });
    console.log('📋 Fetched admissions:', admissions.length);
    res.json({ admissions });
  } catch (error) {
    console.error('❌ Error fetching admissions:', error);
    res.status(500).json({ message: 'Error fetching admissions' });
  }
});

// Simple admission application (no auth required)
router.post('/simple', [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').matches(/^\d{10}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('course').notEmpty().withMessage('Please select a course')
], async (req, res) => {
  try {
    console.log('📝 Admission form data received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, phone, course, message } = req.body;
    console.log('✅ Validation passed, creating admission record...');

    const admission = new SimpleAdmission({
      fullName,
      email,
      phone,
      course,
      message: message || ''
    });

    console.log('💾 Saving to MongoDB Atlas...');
    const savedAdmission = await admission.save();
    console.log('✅ Admission saved to MongoDB:', {
      id: savedAdmission._id,
      fullName: savedAdmission.fullName,
      email: savedAdmission.email,
      course: savedAdmission.course,
      applicationNumber: savedAdmission.applicationNumber
    });

    res.status(201).json({
      message: 'Admission application submitted successfully',
      applicationId: savedAdmission._id,
      applicationNumber: savedAdmission.applicationNumber
    });
  } catch (error) {
    console.error('❌ Admission submission error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error while submitting application' });
  }
});

// Submit admission application
router.post('/', auth, [
  body('course').notEmpty().withMessage('Course is required'),
  body('personalInfo.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('personalInfo.dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('personalInfo.gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  body('personalInfo.address').trim().notEmpty().withMessage('Address is required'),
  body('personalInfo.city').trim().notEmpty().withMessage('City is required'),
  body('personalInfo.state').trim().notEmpty().withMessage('State is required'),
  body('personalInfo.pincode').matches(/^\d{6}$/).withMessage('Valid 6-digit pincode is required'),
  body('academicInfo.tenthMarks').isFloat({ min: 0, max: 100 }).withMessage('10th marks must be between 0-100'),
  body('academicInfo.twelfthMarks').isFloat({ min: 0, max: 100 }).withMessage('12th marks must be between 0-100'),
  body('academicInfo.stream').trim().notEmpty().withMessage('Stream is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { course: courseId, personalInfo, academicInfo } = req.body;

    // Check if course exists and has available seats
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isActive) {
      return res.status(400).json({ message: 'Course is not active for admissions' });
    }

    if (course.availableSeats <= 0) {
      return res.status(400).json({ message: 'No seats available for this course' });
    }

    // Check if user already applied for this course
    const existingApplication = await Admission.findOne({
      user: req.user._id,
      course: courseId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this course' });
    }

    const admission = new Admission({
      user: req.user._id,
      course: courseId,
      personalInfo,
      academicInfo
    });

    await admission.save();
    await admission.populate(['user', 'course']);

    res.status(201).json({
      message: 'Admission application submitted successfully',
      admission,
      applicationNumber: admission.applicationNumber
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's applications
router.get('/my-applications', auth, async (req, res) => {
  try {
    const applications = await Admission.find({ user: req.user._id })
      .populate('course', 'name category fees duration')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all applications (Admin only)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const applications = await Admission.find()
      .populate('user', 'name email phone')
      .populate('course', 'name category fees duration')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single application (MUST be after /all route)
router.get('/:id', auth, async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('course', 'name category fees duration eligibility');

    if (!admission) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Users can only view their own applications, admins can view all
    if (req.user.role !== 'admin' && admission.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ admission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status (Admin only)
router.put('/:id/status', adminAuth, [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const oldStatus = admission.status;
    admission.status = status;
    await admission.save();

    // Update course available seats based on status change
    const course = await Course.findById(admission.course);
    if (course) {
      if (status === 'approved' && oldStatus !== 'approved') {
        course.availableSeats = Math.max(0, course.availableSeats - 1);
      } else if (oldStatus === 'approved' && status !== 'approved') {
        course.availableSeats = Math.min(course.seats, course.availableSeats + 1);
      }
      await course.save();
    }

    await admission.populate(['user', 'course']);

    res.json({
      message: `Application ${status} successfully`,
      admission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete application (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // If application was approved, restore seat
    if (admission.status === 'approved') {
      const course = await Course.findById(admission.course);
      if (course) {
        course.availableSeats = Math.min(course.seats, course.availableSeats + 1);
        await course.save();
      }
    }

    await Admission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;