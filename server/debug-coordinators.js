const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/userModel');
const Branch = require('./models/branchModel');

const debugCoordinators = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check all users
    console.log('\n🔍 ALL USERS IN DATABASE:');
    const allUsers = await User.find({}).select('name email role branch');
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - Branch: ${user.branch || 'NOT ASSIGNED'}`);
    });

    // Check all coordinators
    console.log('\n👥 ALL COORDINATORS:');
    const allCoordinators = await User.find({ role: 'coordinator' }).select('name email role branch');
    allCoordinators.forEach(coordinator => {
      console.log(`  - ${coordinator.name} (${coordinator.email}) - Branch: ${coordinator.branch || 'NOT ASSIGNED'}`);
    });

    // Check coordinators with branches
    console.log('\n🏢 COORDINATORS WITH BRANCHES:');
    const coordinatorsWithBranches = await User.find({ 
      role: 'coordinator', 
      branch: { $exists: true, $ne: null } 
    }).select('name email role branch');
    coordinatorsWithBranches.forEach(coordinator => {
      console.log(`  - ${coordinator.name} (${coordinator.email}) - Branch: ${coordinator.branch}`);
    });

    // Check all branches
    console.log('\n🏢 ALL BRANCHES:');
    const allBranches = await Branch.find({}).select('name _id');
    allBranches.forEach(branch => {
      console.log(`  - ${branch.name} (ID: ${branch._id})`);
    });

    // Check specific branch (if you have a branch ID)
    if (process.argv[2]) {
      const branchId = process.argv[2];
      console.log(`\n🔍 CHECKING BRANCH ${branchId}:`);
      
      const branch = await Branch.findById(branchId);
      if (branch) {
        console.log(`  Branch found: ${branch.name}`);
        
        const coordinatorsInBranch = await User.find({ 
          branch: branchId, 
          role: 'coordinator' 
        }).select('name email role branch');
        
        console.log(`  Coordinators in this branch: ${coordinatorsInBranch.length}`);
        coordinatorsInBranch.forEach(coordinator => {
          console.log(`    - ${coordinator.name} (${coordinator.email})`);
        });
      } else {
        console.log(`  Branch not found with ID: ${branchId}`);
      }
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  Total users: ${allUsers.length}`);
    console.log(`  Total coordinators: ${allCoordinators.length}`);
    console.log(`  Coordinators with branches: ${coordinatorsWithBranches.length}`);
    console.log(`  Total branches: ${allBranches.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
};

// Run the debug function
debugCoordinators();
