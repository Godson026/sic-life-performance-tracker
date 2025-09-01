import axios from 'axios';

// Create an axios instance with the base URL for your backend API
// In development, this will point to localhost:5000
// In production, you'll replace 'YOUR_RENDER_BACKEND_URL_HERE' with your actual Render backend URL
const API = axios.create({ 
    baseURL: process.env.NODE_ENV === 'production' 
        ? 'YOUR_RENDER_BACKEND_URL_HERE' 
        : 'http://localhost:5000'
});

// Add a request interceptor to include the auth token in all requests
API.interceptors.request.use(
    (config) => {
        // Get the user from localStorage (this is where your auth token is stored)
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common errors
API.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized errors (token expired, invalid, etc.)
        if (error.response?.status === 401) {
            // Clear the user from localStorage and redirect to login
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;
