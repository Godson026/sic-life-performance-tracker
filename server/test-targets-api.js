const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/userModel');
const Branch = require('./models/branchModel');

const testTargetsAPI = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a branch manager user
    const branchManager = await User.findOne({ role: 'branch_manager' }).select('name email role branch');
    
    if (!branchManager) {
      console.log('❌ No branch manager found in database');
      return;
    }

    console.log('🔍 Found branch manager:', {
      name: branchManager.name,
      email: branchManager.email,
      role: branchManager.role,
      branch: branchManager.branch
    });

    if (!branchManager.branch) {
      console.log('❌ Branch manager is not assigned to a branch');
      return;
    }

    // Check if there are coordinators in this branch
    const coordinatorsInBranch = await User.find({
      branch: branchManager.branch,
      role: 'coordinator'
    }).select('name email role branch');

    console.log('👥 Coordinators in branch:', coordinatorsInBranch.length);
    coordinatorsInBranch.forEach(coord => {
      console.log(`  - ${coord.name} (${coord.email})`);
    });

    // Check if there are admin targets for this branch
    const Target = require('./models/targetModel');
    const adminTargets = await Target.find({ branch: branchManager.branch });
    
    console.log('🎯 Admin targets for branch:', adminTargets.length);
    adminTargets.forEach(target => {
      console.log(`  - ${target.target_type}: ${target.amount} (${target.start_date} to ${target.end_date})`);
    });

    // Test the API endpoint (if you have a server running)
    console.log('\n🚀 Testing API endpoint...');
    console.log('Note: Make sure your server is running on port 5000');
    
    try {
      // You would need to get a valid JWT token for this to work
      // For now, just show what the endpoint should return
      console.log('Expected API endpoint: GET /api/dashboard/manager-targets-page');
      console.log('Expected response structure:', {
        adminTargets: adminTargets,
        coordinatorsInBranch: coordinatorsInBranch
      });
    } catch (error) {
      console.log('API test skipped (server not running or no auth token)');
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  Branch manager: ${branchManager.name}`);
    console.log(`  Branch ID: ${branchManager.branch}`);
    console.log(`  Coordinators in branch: ${coordinatorsInBranch.length}`);
    console.log(`  Admin targets: ${adminTargets.length}`);

    if (coordinatorsInBranch.length === 0) {
      console.log('\n⚠️  WARNING: No coordinators found in this branch!');
      console.log('This could be why the API returns an empty array.');
      console.log('Check if coordinators are properly assigned to branches.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
};

// Run the test
testTargetsAPI();
