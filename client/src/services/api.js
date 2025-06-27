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

// --- QuickBooks API Functions ---

/**
 * Initiates the connection to QuickBooks.
 * This function doesn't return data but triggers a redirect via the backend.
 * The actual connection happens by navigating to this URL.
 */
export const connectQuickbooks = () => {
  // The backend /api/quickbooks/connect will handle the redirect to QBO.
  // The client just needs to navigate to this backend endpoint.
  window.location.href = `${instance.defaults.baseURL}/quickbooks/connect`;
};

/**
 * Fetches the current QuickBooks connection status.
 * @returns {Promise<object>} The connection status data.
 */
export const getQuickbooksStatus = async () => {
  try {
    const response = await instance.get('/quickbooks/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching QuickBooks status:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch QuickBooks status');
  }
};

/**
 * Disconnects from QuickBooks.
 * @returns {Promise<object>} The response message from the backend.
 */
export const disconnectQuickbooks = async () => {
  try {
    const response = await instance.post('/quickbooks/disconnect');
    return response.data;
  } catch (error) {
    console.error('Error disconnecting from QuickBooks:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to disconnect from QuickBooks');
  }
};

/**
 * Syncs a specific payroll record to QuickBooks.
 * @param {string} payrollId The ID of the payroll record to sync.
 * @returns {Promise<object>} The response from the backend, including QBO journal entry details.
 */
export const syncPayrollToQuickbooks = async (payrollId) => {
  if (!payrollId) {
    throw new Error('Payroll ID is required for syncing to QuickBooks.');
  }
  try {
    const response = await instance.post(`/quickbooks/sync/payroll/${payrollId}`);
    return response.data;
  } catch (error) {
    console.error(`Error syncing payroll ${payrollId} to QuickBooks:`, error.response?.data || error.message);
    throw error.response?.data || new Error(`Failed to sync payroll ${payrollId} to QuickBooks`);
  }
};


export default instance;
