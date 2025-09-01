require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path'); // Required for serving static files in production
const mongoose = require('mongoose'); // Required for graceful shutdown
const connectDB = require('./config/db'); // Import after dotenv is configured

// --- All your route imports ---
const userRoutes = require('./routes/userRoutes');
const branchRoutes = require('./routes/branchRoutes');
const salesRecordRoutes = require('./routes/salesRecordRoutes');
const targetRoutes = require('./routes/targetRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow the app to accept JSON in the body of requests

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/sales', salesRecordRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// --- Production Configuration ---
// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
    // Only serve static files if the client/dist directory exists
    const clientDistPath = path.join(__dirname, '../client/dist');
    
    try {
        // Check if the client/dist directory exists
        if (require('fs').existsSync(clientDistPath)) {
            // Serve static files from the client build
            app.use(express.static(clientDistPath));
            
            // Catch all handler: send back React's index.html file for any non-API routes
            app.get('*', (req, res) => {
                res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
            });
        } else {
            // If no frontend build exists, just serve the API
            app.get('/', (req, res) => {
                res.json({ 
                    message: 'SIC Life Performance Tracker API is running',
                    status: 'API Only Mode',
                    endpoints: '/api, /health'
                });
            });
        }
    } catch (error) {
        // Fallback to API-only mode
        app.get('/', (req, res) => {
            res.json({ 
                message: 'SIC Life Performance Tracker API is running',
                status: 'API Only Mode',
                endpoints: '/api, /health'
            });
        });
    }
} else {
    app.get('/', (req, res) => {
        res.send('API is running in development mode. Please set NODE_ENV to production for full app serving.');
    });
}

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongoUri: process.env.MONGO_URI ? 'Configured' : 'Missing'
    });
});

// --- Connect to Database ---
// We call this right away to ensure the connection is established.
console.log('🚀 Starting server initialization...');
console.log('📁 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Port:', process.env.PORT || 5000);
console.log('🌐 MONGO_URI Status:', process.env.MONGO_URI ? '✅ Configured' : '❌ Missing');

// Initialize database connection
const initializeServer = async () => {
    try {
        // Connect to MongoDB first
        await connectDB();
        
        // Only start the server after successful database connection
        const PORT = process.env.PORT || 5000;
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running successfully on port ${PORT}`);
            console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
            console.log(`🔌 API endpoints available at: http://localhost:${PORT}/api`);
        });
        
    } catch (error) {
        console.error('❌ Failed to initialize server:', error.message);
        process.exit(1);
    }
};

// Start the server
initializeServer();

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM. Gracefully shutting down...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});
