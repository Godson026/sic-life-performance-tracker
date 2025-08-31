const mongoose = require('mongoose');
const { migrateSalesRecordsWithBranchInfo, verifySalesRecordsIntegrity, cleanupOrphanedSalesRecords } = require('./utils/dataMigration');
const SalesRecord = require('./models/salesRecordModel');
const User = require('./models/userModel');
const Branch = require('./models/branchModel');

/**
 * Validate the complete hierarchy of sales records
 */
const validateSalesRecordHierarchy = async () => {
  try {
    console.log('🔍 Validating sales record hierarchy...');
    
    // Get all sales records with populated references
    const salesRecords = await SalesRecord.find()
      .populate('agent', 'name role branch')
      .populate('coordinator', 'name role branch')
      .populate('branch', 'name');
    
    let validRecords = 0;
    let invalidRecords = 0;
    let hierarchyIssues = [];
    
    for (const record of salesRecords) {
      let isValid = true;
      let issues = [];
      
      // Check if all required fields exist
      if (!record.agent || !record.coordinator || !record.branch) {
        isValid = false;
        issues.push('Missing required references');
      }
      
      // Check if agent is actually an agent
      if (record.agent && record.agent.role !== 'agent') {
        isValid = false;
        issues.push('Agent is not an agent role');
      }
      
      // Check if coordinator is actually a coordinator
      if (record.coordinator && record.coordinator.role !== 'coordinator') {
        isValid = false;
        issues.push('Coordinator is not a coordinator role');
      }
      
      // Check if agent and coordinator belong to same branch
      if (record.agent && record.coordinator && record.branch) {
        if (record.agent.branch && record.agent.branch.toString() !== record.branch._id.toString()) {
          isValid = false;
          issues.push('Agent branch mismatch');
        }
        
        if (record.coordinator.branch && record.coordinator.branch.toString() !== record.branch._id.toString()) {
          isValid = false;
          issues.push('Coordinator branch mismatch');
        }
      }
      
      if (isValid) {
        validRecords++;
      } else {
        invalidRecords++;
        hierarchyIssues.push({
          recordId: record._id,
          issues: issues
        });
      }
    }
    
    console.log(`📊 Hierarchy validation results:`);
    console.log(`   ✅ Valid records: ${validRecords}`);
    console.log(`   ❌ Invalid records: ${invalidRecords}`);
    
    if (hierarchyIssues.length > 0) {
      console.log('⚠️ Hierarchy issues found:');
      hierarchyIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. Record ${issue.recordId}: ${issue.issues.join(', ')}`);
      });
    }
    
    return { validRecords, invalidRecords, hierarchyIssues };
    
  } catch (error) {
    console.error('❌ Hierarchy validation failed:', error);
    throw error;
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sic-life-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testDataPipeline = async () => {
  try {
    console.log('🧪 Testing Data Pipeline...\n');
    
    // 1. Check database connection
    console.log('1️⃣ Checking database connection...');
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      console.log('✅ Database connected successfully');
    } else {
      console.log('❌ Database not connected. State:', dbState);
      return;
    }
    
    // 2. Check collections exist
    console.log('\n2️⃣ Checking collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('📚 Available collections:', collectionNames);
    
    // 3. Check if we have any data
    console.log('\n3️⃣ Checking data counts...');
    const userCount = await User.countDocuments();
    const branchCount = await Branch.countDocuments();
    const salesCount = await SalesRecord.countDocuments();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`🏢 Branches: ${branchCount}`);
    console.log(`💰 Sales Records: ${salesCount}`);
    
    if (salesCount === 0) {
      console.log('⚠️ No sales records found. Please create some test data first.');
      return;
    }
    
    // 4. Check data integrity
    console.log('\n4️⃣ Checking data integrity...');
    const integrity = await verifySalesRecordsIntegrity();
    
    if (!integrity.isComplete) {
      console.log('🔄 Running data migration...');
      await migrateSalesRecordsWithBranchInfo();
      
      // Check again after migration
      console.log('\n🔄 Re-checking integrity after migration...');
      const integrityAfter = await verifySalesRecordsIntegrity();
      console.log('✅ Integrity check after migration:', integrityAfter);
    }
    
    // 4.5. Deep hierarchy validation
    console.log('\n4️⃣5️⃣ Deep hierarchy validation...');
    await validateSalesRecordHierarchy();
    
    // 4.6. Cleanup orphaned records
    console.log('\n4️⃣6️⃣ Cleaning up orphaned records...');
    await cleanupOrphanedSalesRecords();
    
    // 5. Test sample queries
    console.log('\n5️⃣ Testing sample queries...');
    
    // Get a sample sales record
    const sampleRecord = await SalesRecord.findOne().populate('branch coordinator agent');
    if (sampleRecord) {
      console.log('📊 Sample Sales Record:');
      console.log(`   - Agent: ${sampleRecord.agent?.name || 'N/A'}`);
      console.log(`   - Coordinator: ${sampleRecord.coordinator?.name || 'N/A'}`);
      console.log(`   - Branch: ${sampleRecord.branch?.name || 'N/A'}`);
      console.log(`   - Sales Amount: ${sampleRecord.sales_amount}`);
      console.log(`   - Date: ${sampleRecord.date}`);
    }
    
    // Test branch-specific query
    if (sampleRecord && sampleRecord.branch) {
      console.log('\n🔍 Testing branch-specific query...');
      const branchSales = await SalesRecord.aggregate([
        {
          $match: { branch: sampleRecord.branch._id }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$sales_amount' },
            totalRecords: { $sum: 1 }
          }
        }
      ]);
      
      if (branchSales.length > 0) {
        console.log(`✅ Branch ${sampleRecord.branch.name} has ${branchSales[0].totalRecords} records with total sales: GHS ${branchSales[0].totalSales}`);
      }
    }
    
    console.log('\n🎉 Data pipeline test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testDataPipeline();
}

module.exports = { testDataPipeline };
