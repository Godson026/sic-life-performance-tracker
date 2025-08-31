const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Import routes
const userRoutes = require('./routes/userRoutes');
const branchRoutes = require('./routes/branchRoutes');
const salesRecordRoutes = require('./routes/salesRecordRoutes');
const targetRoutes = require('./routes/targetRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/sales', salesRecordRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SIC Life API is running' });
});

// Export for Vercel
module.exports = app;
