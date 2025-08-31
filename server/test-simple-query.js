const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/userModel');
const Target = require('./models/targetModel');

const testSimpleQuery = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Test the exact query from the controller
    const branchId = '68ad41ec85515bc0b38e16af'; // Adwoa's branch
    
    console.log('🔍 Testing query for branch:', branchId);
    console.log('🔍 Branch ID type:', typeof branchId);
    console.log('🔍 Is valid ObjectId:', mongoose.Types.ObjectId.isValid(branchId));
    
    // Test 1: Simple query
    const coordinators = await User.find({
      branch: branchId,
      role: 'coordinator'
    }).select('name email role branch');
    
    console.log('✅ Simple query result:', coordinators.length, 'coordinators');
    coordinators.forEach(coord => {
      console.log(`  - ${coord.name} (${coord.email})`);
    });
    
    // Test 2: Targets query
    const targets = await Target.find({ branch: branchId });
    console.log('✅ Targets query result:', targets.length, 'targets');
    
    // Test 3: Check if branchId is a string or ObjectId
    const branchIdObj = new mongoose.Types.ObjectId(branchId);
    console.log('🔍 Converted to ObjectId:', branchIdObj);
    
    const coordinatorsWithObj = await User.find({
      branch: branchIdObj,
      role: 'coordinator'
    }).select('name email role branch');
    
    console.log('✅ ObjectId query result:', coordinatorsWithObj.length, 'coordinators');
    
    // Test 4: Check what's actually in the database
    const allCoordinators = await User.find({ role: 'coordinator' }).select('name email role branch');
    console.log('🔍 All coordinators in database:');
    allCoordinators.forEach(coord => {
      console.log(`  - ${coord.name}: branch=${coord.branch}, type=${typeof coord.branch}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
};

// Run the test
testSimpleQuery();
