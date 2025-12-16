const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const SimpleAdmission = require('./models/SimpleAdmission');

async function testAdmissions() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Count all admissions
    const count = await SimpleAdmission.countDocuments();
    console.log(`📊 Total admissions in database: ${count}`);
    
    // Get all admissions
    const admissions = await SimpleAdmission.find().sort({ createdAt: -1 });
    console.log('📋 All admissions:');
    admissions.forEach((admission, index) => {
      console.log(`${index + 1}. ${admission.fullName} - ${admission.email} - ${admission.course} (${admission.applicationNumber})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAdmissions();