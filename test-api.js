const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const SimpleAdmission = require('./models/SimpleAdmission');

async function testAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Simulate the API call
    const admissions = await SimpleAdmission.find().sort({ createdAt: -1 });
    console.log('📋 API Response would be:');
    console.log(JSON.stringify({ admissions }, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAPI();