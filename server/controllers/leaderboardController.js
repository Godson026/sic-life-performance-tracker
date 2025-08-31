const SalesRecord = require('../models/salesRecordModel');
const User = require('../models/userModel');
const Branch = require('../models/branchModel');

// Get comprehensive leaderboard data with flexible parameters
const getLeaderboard = async (req, res) => {
  try {
    const { type, metric, period } = req.query;
    
    // Validate required parameters
    if (!type || !metric || !period) {
      return res.status(400).json({ 
        message: 'Missing required parameters: type, metric, and period are required' 
      });
    }

    // Validate parameter values
    const validTypes = ['agents', 'coordinators', 'branches'];
    const validMetrics = ['sales', 'registrations'];
    const validPeriods = ['weekly', 'monthly', 'yearly'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid type. Must be one of: agents, coordinators, branches' 
      });
    }

    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ 
        message: 'Invalid metric. Must be one of: sales, registrations' 
      });
    }

    if (!validPeriods.includes(period)) {
      return res.status(400).json({ 
        message: 'Invalid period. Must be one of: weekly, monthly, yearly' 
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'weekly':
        // Start of current week (Monday)
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
        endDate = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000));
        break;
      
      case 'monthly':
        // Start of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      
      case 'yearly':
        // Start of current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    let aggregationPipeline;

    // Build aggregation pipeline based on type
    switch (type) {
      case 'agents':
        aggregationPipeline = [
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$agent',
              totalPerformance: { $sum: `$${metric === 'sales' ? 'sales_amount' : 'new_registrations'}` }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'userInfo'
            }
          },
          {
            $unwind: '$userInfo'
          },
          {
            $project: {
              _id: 1,
              name: '$userInfo.name',
              totalPerformance: 1
            }
          },
          {
            $sort: { totalPerformance: -1 }
          }
        ];
        break;

      case 'coordinators':
        aggregationPipeline = [
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$coordinator',
              totalPerformance: { $sum: `$${metric === 'sales' ? 'sales_amount' : 'new_registrations'}` }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'userInfo'
            }
          },
          {
            $unwind: '$userInfo'
          },
          {
            $project: {
              _id: 1,
              name: '$userInfo.name',
              totalPerformance: 1
            }
          },
          {
            $sort: { totalPerformance: -1 }
          }
        ];
        break;

      case 'branches':
        aggregationPipeline = [
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$branch',
              totalPerformance: { $sum: `$${metric === 'sales' ? 'sales_amount' : 'new_registrations'}` }
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
              name: '$branchInfo.name',
              totalPerformance: 1
            }
          },
          {
            $sort: { totalPerformance: -1 }
          }
        ];
        break;

      default:
        return res.status(400).json({ message: 'Invalid type specified' });
    }

    // Execute the aggregation pipeline
    const results = await SalesRecord.aggregate(aggregationPipeline);

    // Add rank to each result
    const rankedResults = results.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    res.status(200).json(rankedResults);

  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard data' });
  }
};

module.exports = {
  getLeaderboard
};
