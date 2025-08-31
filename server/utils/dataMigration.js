const mongoose = require('mongoose');
const SalesRecord = require('../models/salesRecordModel');
const User = require('../models/userModel');

/**
 * Utility to migrate existing sales records to include complete hierarchy information
 * This should be run once to fix any existing data that doesn't have complete hierarchy
 */
const migrateSalesRecordsWithBranchInfo = async () => {
  try {
    console.log('🔄 Starting complete hierarchy migration...');
    
    // Find all sales records missing any part of the hierarchy
    const recordsWithIncompleteHierarchy = await SalesRecord.find({ 
      $or: [
        { branch: { $exists: false } },
        { branch: null },
        { coordinator: { $exists: false } },
        { coordinator: null }
      ]
    });
    
    console.log(`📊 Found ${recordsWithIncompleteHierarchy.length} records with incomplete hierarchy`);
    
    if (recordsWithIncompleteHierarchy.length === 0) {
      console.log('✅ All sales records already have complete hierarchy information');
      return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const record of recordsWithIncompleteHierarchy) {
      try {
        let needsUpdate = false;
        let updateData = {};
        
        // Check and fix coordinator if missing
        if (!record.coordinator) {
          console.log(`⚠️ Record ${record._id} missing coordinator - cannot migrate automatically`);
          skippedCount++;
          continue;
        }
        
        // Find the coordinator to get their branch
        const coordinator = await User.findById(record.coordinator);
        
        if (coordinator && coordinator.branch) {
          // Update the record with the coordinator's branch
          updateData.branch = coordinator.branch;
          needsUpdate = true;
          
          console.log(`✅ Updating record ${record._id} with branch: ${coordinator.branch}`);
        } else {
          console.log(`⚠️ Coordinator ${record.coordinator} not found or has no branch`);
          errorCount++;
          continue;
        }
        
        if (needsUpdate) {
          await SalesRecord.findByIdAndUpdate(record._id, updateData);
          updatedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error updating record ${record._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`✅ Migration complete: ${updatedCount} records updated, ${errorCount} errors, ${skippedCount} skipped`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Clean up orphaned sales records that cannot be properly linked
 */
const cleanupOrphanedSalesRecords = async () => {
  try {
    console.log('🧹 Starting cleanup of orphaned sales records...');
    
    // Find records that cannot be properly linked
    const orphanedRecords = await SalesRecord.find({
      $or: [
        { coordinator: { $exists: false } },
        { coordinator: null },
        { agent: { $exists: false } },
        { agent: null }
      ]
    });
    
    console.log(`📊 Found ${orphanedRecords.length} orphaned records`);
    
    if (orphanedRecords.length === 0) {
      console.log('✅ No orphaned records found');
      return;
    }
    
    // Delete orphaned records
    const deleteResult = await SalesRecord.deleteMany({
      _id: { $in: orphanedRecords.map(r => r._id) }
    });
    
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} orphaned records`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
};

/**
 * Verify data integrity by checking sales records
 */
const verifySalesRecordsIntegrity = async () => {
  try {
    console.log('🔍 Verifying sales records integrity...');
    
    const totalRecords = await SalesRecord.countDocuments();
    const recordsWithBranch = await SalesRecord.countDocuments({ branch: { $exists: true, $ne: null } });
    const recordsWithCoordinator = await SalesRecord.countDocuments({ coordinator: { $exists: true, $ne: null } });
    
    console.log(`📊 Total sales records: ${totalRecords}`);
    console.log(`📊 Records with branch: ${recordsWithBranch}`);
    console.log(`📊 Records with coordinator: ${recordsWithCoordinator}`);
    
    if (totalRecords === recordsWithBranch && totalRecords === recordsWithCoordinator) {
      console.log('✅ All sales records have complete branch and coordinator information');
    } else {
      console.log('⚠️ Some records are missing branch or coordinator information');
    }
    
    return {
      total: totalRecords,
      withBranch: recordsWithBranch,
      withCoordinator: recordsWithCoordinator,
      isComplete: totalRecords === recordsWithBranch && totalRecords === recordsWithCoordinator
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
};

module.exports = {
  migrateSalesRecordsWithBranchInfo,
  verifySalesRecordsIntegrity,
  cleanupOrphanedSalesRecords
};
