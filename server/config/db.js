const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Ensure the MONGO_URI is available
        if (!process.env.MONGO_URI) {
            console.error('❌ FATAL ERROR: MONGO_URI is not defined in your .env file.');
            console.error('📝 Please check your .env file and ensure it contains:');
            console.error('   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
            console.error('🔍 Current environment variables:', Object.keys(process.env).filter(key => key.includes('MONGO')));
            process.exit(1); // Exit the application with a failure code
        }

        console.log('🔌 Attempting to connect to MongoDB...');
        console.log('🌐 Connection string:', process.env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Modern Mongoose handles these options automatically, but they don't hurt
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected Successfully!`);
        console.log(`   🏢 Database: ${conn.connection.name}`);
        console.log(`   🌐 Host: ${conn.connection.host}`);
        console.log(`   🔌 Port: ${conn.connection.port}`);
        console.log(`   📊 Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

        // Set up connection event listeners for monitoring
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });

        return conn;
    } catch (error) {
        console.error('❌ Error Connecting to MongoDB:');
        console.error('   📝 Error Message:', error.message);
        console.error('   🔍 Error Code:', error.code);
        console.error('   🌐 Connection String:', process.env.MONGO_URI ? 'Present' : 'Missing');
        
        // Provide helpful troubleshooting tips
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Troubleshooting Tips:');
            console.error('   1. Check if your .env file exists in the server directory');
            console.error('   2. Verify MONGO_URI is correctly formatted');
            console.error('   3. Ensure your IP is whitelisted in MongoDB Atlas');
            console.error('   4. Check if your MongoDB Atlas cluster is running');
        } else if (error.code === 'ENOTFOUND') {
            console.error('💡 Troubleshooting Tips:');
            console.error('   1. Check your internet connection');
            console.error('   2. Verify the cluster URL in your MONGO_URI');
            console.error('   3. Ensure MongoDB Atlas is accessible');
        } else if (error.message.includes('Authentication failed')) {
            console.error('💡 Troubleshooting Tips:');
            console.error('   1. Check your username and password in MONGO_URI');
            console.error('   2. Verify your MongoDB Atlas user credentials');
            console.error('   3. Ensure your user has the correct permissions');
        }

        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
