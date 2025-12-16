const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  duration: {
    type: String,
    required: [true, 'Course duration is required']
  },
  fees: {
    type: Number,
    required: [true, 'Course fees is required'],
    min: [0, 'Fees cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: ['Engineering', 'Medical', 'Arts', 'Commerce', 'Science', 'Management']
  },
  eligibility: {
    type: String,
    required: [true, 'Eligibility criteria is required']
  },
  seats: {
    type: Number,
    required: [true, 'Number of seats is required'],
    min: [1, 'Seats must be at least 1']
  },
  availableSeats: {
    type: Number,
    default: function() { return this.seats; }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);