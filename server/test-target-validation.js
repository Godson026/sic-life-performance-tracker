// Test script for target validation
// Run this with: node test-target-validation.js

const mongoose = require('mongoose');
require('dotenv').config();

// Test data
const testCases = [
  {
    name: "Valid target data",
    data: {
      branchId: "507f1f77bcf86cd799439011", // Valid ObjectId format
      target_type: "sales",
      amount: 10000,
      start_date: "2024-01-01",
      end_date: "2024-01-31"
    },
    shouldPass: true
  },
  {
    name: "Missing branchId",
    data: {
      target_type: "sales",
      amount: 10000,
      start_date: "2024-01-01",
      end_date: "2024-01-31"
    },
    shouldPass: false,
    expectedError: "Please select a branch."
  },
  {
    name: "Invalid branchId format",
    data: {
      branchId: "invalid-id",
      target_type: "sales",
      amount: 10000,
      start_date: "2024-01-01",
      end_date: "2024-01-31"
    },
    shouldPass: false,
    expectedError: "Invalid branch ID format."
  },
  {
    name: "Missing target_type",
    data: {
      branchId: "507f1f77bcf86cd799439011",
      amount: 10000,
      start_date: "2024-01-01",
      end_date: "2024-01-31"
    },
    shouldPass: false,
    expectedError: "Please select a valid target type (sales or registration)."
  },
  {
    name: "Invalid target_type",
    data: {
      branchId: "507f1f77bcf86cd799439011",
      target_type: "invalid",
      amount: 10000,
      start_date: "2024-01-01",
      end_date: "2024-01-31"
    },
    shouldPass: false,
    expectedError: "Please select a valid target type (sales or registration)."
  },
  {
    name: "Missing amount",
    data: {
      branchId: "507f1f77bcf86cd799439011",
      target_type: "sales",
      start_date: "2024-01-01",
      end_date: "2024-01-31"
    },
    shouldPass: false,
    expectedError: "Please enter a valid positive target amount."
  },
  {
    name: "Zero amount",
    data: {
      branchId: "507f1f77bcf86cd799439011",
      target_type: "sales",
      amount: 0,
      start_date: "2024-01-01",
      end_date: "2024-01-31"
    },
    shouldPass: false,
    expectedError: "Please enter a valid positive target amount."
  },
  {
    name: "Negative amount",
    data: {
      branchId: "507f1f77bcf86cd799439011",
      target_type: "sales",
      amount: -1000,
      start_date: "2024-01-01",
      end_date: "2024-01-31"
    },
    shouldPass: false,
    expectedError: "Please enter a valid positive target amount."
  },
  {
    name: "Missing start_date",
    data: {
      branchId: "507f1f77bcf86cd799439011",
      target_type: "sales",
      amount: 10000,
      end_date: "2024-01-31"
    },
    shouldPass: false,
    expectedError: "Please provide a start date."
  },
  {
    name: "Missing end_date",
    data: {
      branchId: "507f1f77bcf86cd799439011",
      target_type: "sales",
      amount: 10000,
      start_date: "2024-01-01"
    },
    shouldPass: false,
    expectedError: "Please provide an end date."
  },
  {
    name: "End date before start date",
    data: {
      branchId: "507f1f77bcf86cd799439011",
      target_type: "sales",
      amount: 10000,
      start_date: "2024-01-31",
      end_date: "2024-01-01"
    },
    shouldPass: false,
    expectedError: "End date must be after start date."
  },
  {
    name: "Start date in the past",
    data: {
      branchId: "507f1f77bcf86cd799439011",
      target_type: "sales",
      amount: 10000,
      start_date: "2023-01-01",
      end_date: "2023-01-31"
    },
    shouldPass: false,
    expectedError: "Start date cannot be in the past."
  }
];

console.log("🧪 Testing Target Validation Logic...\n");

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  
  // Simulate validation logic
  let errors = [];
  
  if (!testCase.data.branchId) {
    errors.push("Please select a branch.");
  } else if (!mongoose.Types.ObjectId.isValid(testCase.data.branchId)) {
    errors.push("Invalid branch ID format.");
  }
  
  if (!testCase.data.target_type || !['sales', 'registration'].includes(testCase.data.target_type)) {
    errors.push("Please select a valid target type (sales or registration).");
  }
  
  if (!testCase.data.amount || isNaN(testCase.data.amount) || Number(testCase.data.amount) <= 0) {
    errors.push("Please enter a valid positive target amount.");
  }
  
  if (!testCase.data.start_date) {
    errors.push("Please provide a start date.");
  }
  
  if (!testCase.data.end_date) {
    errors.push("Please provide an end date.");
  }
  
  if (testCase.data.start_date && testCase.data.end_date) {
    const startDate = new Date(testCase.data.start_date);
    const endDate = new Date(testCase.data.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.push("Please provide valid dates in the correct format.");
    } else if (startDate >= endDate) {
      errors.push("End date must be after start date.");
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        errors.push("Start date cannot be in the past.");
      }
    }
  }
  
  const passed = testCase.shouldPass ? errors.length === 0 : errors.length > 0;
  const status = passed ? "✅ PASS" : "❌ FAIL";
  
  console.log(`   Status: ${status}`);
  
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.join(', ')}`);
    if (testCase.expectedError && !errors.includes(testCase.expectedError)) {
      console.log(`   ⚠️  Expected: ${testCase.expectedError}`);
    }
  }
  
  console.log("");
});

console.log("🎯 Validation testing complete!");
console.log("\n💡 To test the actual API endpoint:");
console.log("1. Start your server: npm start");
console.log("2. Use Postman or curl to test POST /api/targets/branch");
console.log("3. Try the test cases above with different payloads");
