// Environment configuration for the SIC Life Performance Tracker

const config = {
    development: {
        API_BASE_URL: 'http://localhost:5000',
        NODE_ENV: 'development'
    },
    production: {
        API_BASE_URL: 'https://sic-life-backend.onrender.com', // Replace with your actual Render URL
        NODE_ENV: 'production'
    }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export the configuration for the current environment
export default config[environment];

// Alternative approach using environment variables (recommended for production)
export const API_BASE_URL = process.env.VITE_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' 
        ? 'https://sic-life-backend.onrender.com' 
        : 'http://localhost:5000');
