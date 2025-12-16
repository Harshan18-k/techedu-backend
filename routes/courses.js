const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all courses (Admin - including inactive)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create course (Admin only)
router.post('/', adminAuth, [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('description').trim().notEmpty().withMessage('Course description is required'),
  body('duration').trim().notEmpty().withMessage('Course duration is required'),
  body('fees').isNumeric().withMessage('Fees must be a number'),
  body('category').isIn(['Engineering', 'Medical', 'Arts', 'Commerce', 'Science', 'Management']).withMessage('Invalid category'),
  body('eligibility').trim().notEmpty().withMessage('Eligibility criteria is required'),
  body('seats').isInt({ min: 1 }).withMessage('Seats must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const courseData = {
      ...req.body,
      createdBy: req.user._id,
      availableSeats: req.body.seats
    };

    const course = new Course(courseData);
    await course.save();

    await course.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course (Admin only)
router.put('/:id', adminAuth, [
  body('name').optional().trim().notEmpty().withMessage('Course name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Course description cannot be empty'),
  body('duration').optional().trim().notEmpty().withMessage('Course duration cannot be empty'),
  body('fees').optional().isNumeric().withMessage('Fees must be a number'),
  body('category').optional().isIn(['Engineering', 'Medical', 'Arts', 'Commerce', 'Science', 'Management']).withMessage('Invalid category'),
  body('eligibility').optional().trim().notEmpty().withMessage('Eligibility criteria cannot be empty'),
  body('seats').optional().isInt({ min: 1 }).withMessage('Seats must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // If seats are being updated, adjust available seats
    if (req.body.seats && req.body.seats !== course.seats) {
      const seatDifference = req.body.seats - course.seats;
      req.body.availableSeats = course.availableSeats + seatDifference;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle course status (Admin only)
router.put('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.isActive = !course.isActive;
    await course.save();

    res.json({
      message: `Course ${course.isActive ? 'activated' : 'deactivated'} successfully`,
      course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;