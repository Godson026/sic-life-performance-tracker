const mongoose = require('mongoose');
const User = require('../models/userModel');
const Branch = require('../models/branchModel');
const SalesRecord = require('../models/salesRecordModel');
const Target = require('../models/targetModel');

// Get comprehensive admin dashboard summary
const getAdminDashboardSummary = async (req, res) => {
  try {
    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Execute all queries in parallel for efficiency
    const [
      userCount,
      branchCount,
      salesThisMonth,
      branchSalesPerformance,
      topAgents
    ] = await Promise.all([
      // 1. Total user count
      User.countDocuments({}),
      
      // 2. Total branch count
      Branch.countDocuments({}),
      
      // 3. Total sales for current month
      SalesRecord.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$sales_amount' }
          }
        }
      ]),
      
      // 4. Branch sales performance for current month
      SalesRecord.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$branch',
            totalSales: { $sum: '$sales_amount' }
          }
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branchInfo'
          }
        },
        {
          $unwind: '$branchInfo'
        },
        {
          $project: {
            branchName: '$branchInfo.name',
            totalSales: 1
          }
        },
        {
          $sort: { totalSales: -1 }
        }
      ]),
      
      // 5. Top 5 agents by achievement percentage
      SalesRecord.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$agent',
            totalSales: { $sum: '$sales_amount' },
            totalRegistrations: { $sum: '$new_registrations' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'agentInfo'
          }
        },
        {
          $unwind: '$agentInfo'
        },
        {
          $lookup: {
            from: 'targets',
            let: { agentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$coordinator', '$$agentId'] },
                      { $gte: ['$start_date', startOfMonth] },
                      { $lte: ['$end_date', endOfMonth] },
                      { $eq: ['$target_type', 'sales'] }
                    ]
                  }
                }
              }
            ],
            as: 'targets'
          }
        },
        {
          $addFields: {
            monthlyTarget: {
              $ifNull: [
                { $sum: '$targets.amount' },
                0
              ]
            }
          }
        },
        {
          $addFields: {
            achievementPercentage: {
              $cond: {
                if: { $gt: ['$monthlyTarget', 0] },
                then: {
                  $multiply: [
                    { $divide: ['$totalSales', '$monthlyTarget'] },
                    100
                  ]
                },
                else: 0
              }
            }
          }
        },
        {
          $project: {
            agentName: '$agentInfo.name',
            totalSales: 1,
            totalRegistrations: 1,
            monthlyTarget: 1,
            achievementPercentage: 1
          }
        },
        {
          $sort: { achievementPercentage: -1 }
        },
        {
          $limit: 5
        }
      ])
    ]);

    // Extract sales amount from aggregation result
    const totalSalesThisMonth = salesThisMonth.length > 0 ? salesThisMonth[0].totalSales : 0;

    // Calculate average target achievement across all agents
    const averageAchievement = topAgents.length > 0 
      ? (topAgents.reduce((sum, agent) => sum + agent.achievementPercentage, 0) / topAgents.length).toFixed(1)
      : 0;

    const dashboardSummary = {
      userCount,
      branchCount,
      salesThisMonth: totalSalesThisMonth,
      averageAchievement: parseFloat(averageAchievement),
      branchSalesPerformance,
      topAgents
    };

    res.status(200).json(dashboardSummary);
  } catch (error) {
    console.error('Error fetching admin dashboard summary:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
};

// Get comprehensive branch manager dashboard summary
const getBranchManagerDashboardSummary = async (req, res) => {
  try {
    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Identify the manager's branch
    const branchId = req.user.branch;
    
    if (!branchId) {
      return res.status(400).json({ message: 'Branch manager not assigned to a branch' });
    }

    // Execute all queries in parallel for efficiency
    const [
      branchTargets,
      branchSalesProgress,
      branchRegistrationProgress,
      coordinatorPerformance,
      branchRankData
    ] = await Promise.all([
      // 1. Get Branch Targets (set by Admin)
      Target.find({
        branch: branchId,
        start_date: { $lte: endOfMonth },
        end_date: { $gte: startOfMonth }
      }).sort({ start_date: -1 }),

      // 2. Get Branch Sales Progress for current month
      SalesRecord.aggregate([
        {
          $match: {
            branch: branchId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$sales_amount' }
          }
        }
      ]),

      // 3. Get Branch Registration Progress for current month
      SalesRecord.aggregate([
        {
          $match: {
            branch: branchId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalRegistrations: { $sum: '$new_registrations' }
          }
        }
      ]),

      // 4. Get Coordinator Performance
      User.aggregate([
        {
          $match: {
            branch: branchId,
            role: 'coordinator'
          }
        },
        {
          $lookup: {
            from: 'targets',
            let: { coordinatorId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$coordinator', '$$coordinatorId'] },
                      { $gte: ['$start_date', startOfMonth] },
                      { $lte: ['$end_date', endOfMonth] },
                      { $eq: ['$target_type', 'sales'] }
                    ]
                  }
                }
              }
            ],
            as: 'monthlyTargets'
          }
        },
        {
          $lookup: {
            from: 'salesrecords',
            let: { coordinatorId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$coordinator', '$$coordinatorId'] },
                      { $gte: ['$date', startOfMonth] },
                      { $lte: ['$date', endOfMonth] }
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  totalSales: { $sum: '$sales_amount' },
                  totalRegistrations: { $sum: '$new_registrations' }
                }
              }
            ],
            as: 'monthlyPerformance'
          }
        },
        {
          $addFields: {
            monthlySalesTarget: {
              $ifNull: [
                { $sum: '$monthlyTargets.amount' },
                0
              ]
            },
            monthlySales: {
              $ifNull: [
                { $arrayElemAt: ['$monthlyPerformance.totalSales', 0] },
                0
              ]
            },
            monthlyRegistrations: {
              $ifNull: [
                { $arrayElemAt: ['$monthlyPerformance.totalRegistrations', 0] },
                0
              ]
            }
          }
        },
        {
          $addFields: {
            salesAchievementPercentage: {
              $cond: {
                if: { $gt: ['$monthlySalesTarget', 0] },
                then: {
                  $multiply: [
                    { $divide: ['$monthlySales', '$monthlySalesTarget'] },
                    100
                  ]
                },
                else: 0
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            monthlySalesTarget: 1,
            monthlySales: 1,
            monthlyRegistrations: 1,
            salesAchievementPercentage: 1
          }
        },
        {
          $sort: { salesAchievementPercentage: -1 }
        }
      ]),

      // 5. Get Branch Rank (compare with all other branches)
      SalesRecord.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$branch',
            totalSales: { $sum: '$sales_amount' }
          }
        },
        {
          $sort: { totalSales: -1 }
        }
      ])
    ]);

    // Extract values from aggregation results
    const salesThisMonth = branchSalesProgress.length > 0 ? branchSalesProgress[0].totalSales : 0;
    const registrationsThisMonth = branchRegistrationProgress.length > 0 ? branchRegistrationProgress[0].totalRegistrations : 0;

    // Calculate branch rank
    let branchRank = 1;
    for (let i = 0; i < branchRankData.length; i++) {
      if (branchRankData[i]._id.toString() === branchId.toString()) {
        branchRank = i + 1;
        break;
      }
    }

    // Get top coordinator
    const topCoordinator = coordinatorPerformance.length > 0 ? coordinatorPerformance[0] : null;

    // Calculate overall branch progress percentages
    const salesTarget = branchTargets.find(t => t.target_type === 'sales');
    const registrationTarget = branchTargets.find(t => t.target_type === 'registration');

    const salesProgressPercentage = salesTarget && salesTarget.amount > 0 
      ? ((salesThisMonth / salesTarget.amount) * 100).toFixed(1) 
      : 0;

    const registrationProgressPercentage = registrationTarget && registrationTarget.amount > 0 
      ? ((registrationsThisMonth / registrationTarget.amount) * 100).toFixed(1) 
      : 0;

    const dashboardSummary = {
      branchTargets,
      salesThisMonth,
      registrationsThisMonth,
      salesProgressPercentage: parseFloat(salesProgressPercentage),
      registrationProgressPercentage: parseFloat(registrationProgressPercentage),
      coordinatorPerformance,
      topCoordinator,
      branchRank,
      totalBranches: branchRankData.length
    };

    res.status(200).json(dashboardSummary);
  } catch (error) {
    console.error('Error fetching branch manager dashboard summary:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
};

// @desc    Get comprehensive admin report summary with aggregated data
// @route   GET /api/dashboard/admin-report
// @access  Private/Admin
const getAdminReportSummary = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // Default to monthly if not specified
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Dynamic date range based on period parameter
    let startDate;
    if (period === 'ytd') {
      startDate = new Date(currentYear, 0, 1); // January 1st of current year
    } else {
      startDate = new Date(currentYear, currentMonth, 1); // First day of current month
    }
    
    // Calculate date ranges
    const yearStart = new Date(currentYear, 0, 1);
    const monthStart = new Date(currentYear, currentMonth, 1);
    
    // Perform all aggregations in parallel for efficiency
    const [
      totalSalesYTD,
      monthlySalesData,
      topPerformingBranch,
      newRegistrationsThisMonth,
      branchSalesForChart
    ] = await Promise.all([
      // 1. Total Sales for selected period
      SalesRecord.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: currentDate }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$sales_amount' }
          }
        }
      ]),
      
      // 2. Sales for Average Calculation (based on period)
      SalesRecord.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: currentDate }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            monthlyTotal: { $sum: '$sales_amount' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]),
      
      // 3. Top Performing Branch (for selected period)
      SalesRecord.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: currentDate }
          }
        },
        {
          $group: {
            _id: '$branch',
            totalSales: { $sum: '$sales_amount' }
          }
        },
        {
          $sort: { totalSales: -1 }
        },
        {
          $limit: 1
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branchInfo'
          }
        },
        {
          $unwind: '$branchInfo'
        },
        {
          $project: {
            branchName: '$branchInfo.name',
            totalSales: 1
          }
        }
      ]),
      
      // 4. New Registrations for selected period
      SalesRecord.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: currentDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRegistrations: { $sum: '$new_registrations' }
          }
        }
      ]),
      
      // 5. Branch Sales for Chart (for selected period)
      SalesRecord.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: currentDate }
          }
        },
        {
          $group: {
            _id: '$branch',
            totalSales: { $sum: '$sales_amount' }
          }
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branchInfo'
          }
        },
        {
          $unwind: '$branchInfo'
        },
        {
          $project: {
            _id: 1,
            branchName: '$branchInfo.name',
            totalSales: 1
          }
        },
        {
          $sort: { totalSales: -1 }
        }
      ])
    ]);
    
    // Calculate average monthly sales
    const avgMonthlySales = monthlySalesData.length > 0 
      ? monthlySalesData.reduce((sum, month) => sum + month.monthlyTotal, 0) / monthlySalesData.length
      : 0;
    
    // Prepare the response
    const reportData = {
      totalSales: totalSalesYTD[0]?.totalSales || 0,
      avgMonthlySales: Math.round(avgMonthlySales),
      topPerformingBranch: topPerformingBranch[0] || { branchName: 'N/A', totalSales: 0 },
      newRegistrations: newRegistrationsThisMonth[0]?.totalRegistrations || 0,
      branchSalesForChart: branchSalesForChart || [],
      lastUpdated: currentDate,
      period: {
        type: period,
        year: currentYear,
        month: currentMonth + 1,
        monthName: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }),
        startDate: startDate,
        endDate: currentDate
      }
    };
    
    res.json(reportData);
    
  } catch (error) {
    console.error('Error generating admin report summary:', error);
    res.status(500).json({ 
      message: 'Failed to generate admin report summary',
      error: error.message 
    });
  }
};

// Get comprehensive branch manager report summary
const getBranchManagerReportSummary = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const branchId = req.user.branch;

    if (!branchId) {
      return res.status(400).json({ message: 'User is not assigned to a branch.' });
    }

    let startDate = new Date();
    if (period === 'monthly') {
      startDate.setDate(1);
    } else { // 'ytd'
      startDate.setMonth(0, 1);
    }
    startDate.setHours(0, 0, 0, 0);

    console.log('🔍 Fetching data for branch:', branchId, 'period:', period, 'from:', startDate);

    // Use Promise.all for parallel, efficient data fetching
    const [
      branchSalesResult,
      topAgentResult,
      branchTargetResult,
      newRegsResult,
      agentChartResult
    ] = await Promise.all([
      // 1. Branch Sales for the period - NO ObjectId conversion needed since branch field is already ObjectId
      SalesRecord.aggregate([
        { 
          $match: { 
            branch: branchId, 
            date: { $gte: startDate } 
          } 
        }, 
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$sales_amount' } 
          } 
        }
      ]),
      
      // 2. Top Agent in the branch for the period
      SalesRecord.aggregate([
        { 
          $match: { 
            branch: branchId, 
            date: { $gte: startDate } 
          } 
        }, 
        { 
          $group: { 
            _id: '$agent', 
            totalSales: { $sum: '$sales_amount' } 
          } 
        }, 
        { 
          $sort: { totalSales: -1 } 
        }, 
        { 
          $limit: 1 
        }, 
        { 
          $lookup: { 
            from: 'users', 
            localField: '_id', 
            foreignField: '_id', 
            as: 'agentInfo' 
          } 
        }, 
        { 
          $unwind: '$agentInfo' 
        }
      ]),
      
      // 3. Branch's Sales Target for the period
      Target.findOne({ 
        branch: branchId, 
        target_type: 'sales', 
        start_date: { $lte: new Date() }, 
        end_date: { $gte: new Date() } 
      }),
      
      // 4. New Registrations in the branch for the period
      SalesRecord.aggregate([
        { 
          $match: { 
            branch: branchId, 
            date: { $gte: startDate } 
          } 
        }, 
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$new_registrations' } 
          } 
        }
      ]),
      
      // 5. Performance of all agents in the branch for the chart
      SalesRecord.aggregate([
        { 
          $match: { 
            branch: branchId, 
            date: { $gte: startDate } 
          } 
        }, 
        { 
          $group: { 
            _id: '$agent', 
            totalSales: { $sum: '$sales_amount' } 
          } 
        }, 
        { 
          $lookup: { 
            from: 'users', 
            localField: '_id', 
            foreignField: '_id', 
            as: 'agentInfo' 
          } 
        }, 
        { 
          $unwind: '$agentInfo' 
        }, 
        { 
          $project: { 
            _id: 1, 
            totalSales: 1, 
            agentName: '$agentInfo.name' 
          } 
        }
      ])
    ]);
    
    console.log('📊 Query Results:', {
      branchSales: branchSalesResult,
      topAgent: topAgentResult,
      branchTarget: branchTargetResult,
      newRegs: newRegsResult,
      agentChart: agentChartResult
    });
    
    // Safely assemble the response
    const branchSales = branchSalesResult[0]?.total || 0;
    const branchTarget = branchTargetResult?.amount || 0;
    const achievement = branchTarget > 0 ? (branchSales / branchTarget) * 100 : 0;
    
    const summary = {
      branchSales: branchSales,
      topAgent: topAgentResult[0] ? { 
        name: topAgentResult[0].agentInfo.name, 
        sales: topAgentResult[0].totalSales 
      } : { name: 'N/A', sales: 0 },
      targetAchievement: achievement,
      branchTarget: branchTarget,
      newRegistrations: newRegsResult[0]?.total || 0,
      agentPerformanceChart: agentChartResult,
      period: {
        type: period,
        startDate: startDate,
        endDate: new Date()
      }
    };

    console.log('✅ Final Summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error("--- MANAGER REPORT API ERROR ---", error);
    res.status(500).json({ message: 'Server error while generating manager report.' });
  }
};

// Get comprehensive coordinator report summary
const getCoordinatorReportSummary = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // Default to monthly if not specified
    const coordinator = req.user;
    
    // Ensure the user is a coordinator and has a branch assigned
    if (!coordinator.branch) {
      return res.status(400).json({ 
        message: 'Coordinator must be assigned to a branch' 
      });
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Dynamic date range based on period parameter
    let startDate;
    if (period === 'ytd') {
      startDate = new Date(currentYear, 0, 1); // January 1st of current year
    } else {
      startDate = new Date(currentYear, currentMonth, 1); // First day of current month
    }

    // Execute all coordinator-specific queries in parallel for efficiency
    const [
      teamSales,
      topAgentInTeam,
      teamAchievementPercentage,
      newRegistrationsInTeam,
      agentPerformanceData
    ] = await Promise.all([
      // 1. Team sales for selected period
      SalesRecord.aggregate([
        {
          $match: {
            coordinator: coordinator._id,
            date: { $gte: startDate, $lte: currentDate }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$sales_amount' }
          }
        }
      ]),

      // 2. Top performing agent in team for selected period
      SalesRecord.aggregate([
        {
          $match: {
            coordinator: coordinator._id,
            date: { $gte: startDate, $lte: currentDate }
          }
        },
        {
          $group: {
            _id: '$agent',
            totalSales: { $sum: '$sales_amount' },
            totalRegistrations: { $sum: '$new_registrations' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'agentInfo'
          }
        },
        {
          $unwind: '$agentInfo'
        },
        {
          $project: {
            agentName: '$agentInfo.name',
            totalSales: 1,
            totalRegistrations: 1
          }
        },
        {
          $sort: { totalSales: -1 }
        },
        {
          $limit: 1
        }
      ]),

      // 3. Team achievement percentage (if target exists)
      Target.findOne({
        coordinator: coordinator._id,
        target_type: 'sales',
        start_date: { $lte: currentDate },
        end_date: { $gte: currentDate }
      }),

      // 4. New registrations in team for selected period
      SalesRecord.aggregate([
        {
          $match: {
            coordinator: coordinator._id,
            date: { $gte: startDate, $lte: currentDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRegistrations: { $sum: '$new_registrations' }
          }
        }
      ]),

      // 5. Individual agent performance for chart (selected period)
      SalesRecord.aggregate([
        {
          $match: {
            coordinator: coordinator._id,
            date: { $gte: startDate, $lte: currentDate }
          }
        },
        {
          $group: {
            _id: '$agent',
            totalSales: { $sum: '$sales_amount' },
            totalRegistrations: { $sum: '$new_registrations' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'agentInfo'
          }
        },
        {
          $unwind: '$agentInfo'
        },
        {
          $project: {
            _id: 1,
            agentName: '$agentInfo.name',
            totalSales: 1,
            totalRegistrations: 1
          }
        },
        {
          $sort: { totalSales: -1 }
        }
      ])
    ]);

    // Calculate achievement percentage
    const currentSales = teamSales[0]?.totalSales || 0;
    const targetAmount = teamAchievementPercentage?.amount || 0;
    const achievementPercentage = targetAmount > 0 
      ? Math.round((currentSales / targetAmount) * 100) 
      : 0;

    // Prepare the response
    const reportData = {
      teamSales: currentSales,
      topAgentInTeam: topAgentInTeam[0] || { agentName: 'N/A', totalSales: 0, totalRegistrations: 0 },
      teamAchievementPercentage: achievementPercentage,
      newRegistrations: newRegistrationsInTeam[0]?.totalRegistrations || 0,
      agentPerformanceData: agentPerformanceData || [],
      currentTarget: targetAmount,
      lastUpdated: currentDate,
      period: {
        type: period,
        year: currentYear,
        month: currentMonth + 1,
        monthName: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }),
        startDate: startDate,
        endDate: currentDate
      }
    };

    res.json(reportData);

  } catch (error) {
    console.error('Error generating coordinator report summary:', error);
    res.status(500).json({ 
      message: 'Failed to generate coordinator report summary',
      error: error.message 
    });
  }
};

// Get manager targets page data for Branch Manager
const getManagerTargetsPageData = async (req, res) => {
    try {
        const managerId = req.user._id;

        // Step 1: Find the manager and, crucially, populate the details of their assigned branch.
        const manager = await User.findById(managerId).populate('branch');
        
        // Step 2: Input Validation. Ensure the manager and their branch exist.
        if (!manager || !manager.branch) {
            console.error(`Error: Manager with ID ${managerId} is not assigned to a branch.`);
            return res.status(400).json({ message: "Manager is not assigned to a branch." });
        }
        
        const branchId = manager.branch._id;

        // Step 3: Fetch all data for this page in parallel.
        const [
            adminTargets,
            coordinatorsInBranch
        ] = await Promise.all([
            // Find all targets set by an Admin for this specific branch.
            Target.find({ branch: branchId }),
            
            // Find all users who have the role 'coordinator' AND are assigned to this specific branch.
            // This is the most reliable way to perform this query.
            User.find({
                branch: branchId,
                role: 'coordinator'
            })
        ]);

        // Step 4: Log the data we are about to send to the frontend for debugging.
        console.log(`✅ Data found for Branch '${manager.branch.name}':`);
        console.log(`   Admin Targets Found: ${adminTargets.length}`);
        console.log(`   Coordinators Found: ${coordinatorsInBranch.length}`);
        if(coordinatorsInBranch.length > 0) {
            console.log(`   Coordinator Names: ${coordinatorsInBranch.map(c => c.name).join(', ')}`);
        }

        res.json({
            adminTargets,
            coordinatorsInBranch
        });

    } catch (error)
    {
        console.error("--- FATAL MANAGER TARGETS PAGE API ERROR ---", error);
        res.status(500).json({ message: 'Server error while fetching manager target page data.' });
    }
};

module.exports = {
  getAdminDashboardSummary,
  getBranchManagerDashboardSummary,
  getAdminReportSummary,
  getBranchManagerReportSummary,
  getCoordinatorReportSummary,
  getManagerTargetsPageData
};
