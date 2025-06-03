import axios from 'axios';

// Retrieve token from localStorage (or your preferred storage)
const getAuthToken = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo).token : null;
};

const api = axios.create({
    baseURL: '/api', // Your backend API base URL (proxied by CRA in development)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the token to headers
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = \`Bearer \${token}\`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor (optional: for global error handling or token refresh)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access, e.g., redirect to login
            console.error('Unauthorized access - 401');
            // localStorage.removeItem('userInfo'); // Clear stale auth info
            // window.location.href = '/login'; // Or use React Router navigate
        }
        return Promise.reject(error);
    }
);

export default api;
