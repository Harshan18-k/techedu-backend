const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  personalInfo: {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other']
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    }
  },
  academicInfo: {
    tenthMarks: {
      type: Number,
      required: [true, '10th marks are required'],
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100']
    },
    twelfthMarks: {
      type: Number,
      required: [true, '12th marks are required'],
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100']
    },
    stream: {
      type: String,
      required: [true, 'Stream is required']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  applicationNumber: {
    type: String,
    unique: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

admissionSchema.pre('save', function(next) {
  if (!this.applicationNumber) {
    this.applicationNumber = 'APP' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Admission', admissionSchema);