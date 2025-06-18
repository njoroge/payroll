import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:5001/api', // Default for development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add interceptors for request (e.g., adding auth token) or response (e.g., error handling)
instance.interceptors.request.use(
  (config) => {
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      const token = userInfo?.token;
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
