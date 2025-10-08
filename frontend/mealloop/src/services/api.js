// src/services/api.js
import axios from 'axios';

// Configure API base URL with production fallback
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If we're on a Render domain, use the production backend
  if (window.location.hostname.includes('onrender.com')) {
    return 'https://mealloop.onrender.com/api';
  }
  
  // Otherwise use the environment variable or fallback
  return envUrl || 'https://mealloop.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('Current hostname:', window.location.hostname);
console.log('API Base URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for Render cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Optional: attach token when you add real auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('Backend server is not reachable. Please check if the backend is deployed and running.');
    }
    
    if (error.response?.status === 404) {
      console.error('API endpoint not found:', error.config.url);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// ---- Endpoints (wrap as functions)
export const postDonation = (payload) => {
  // Real backend call
  return api.post('/donations', payload);
};
export const getMyDonations = async () => {
  try {
    console.log('Fetching user donations...');
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/donations/mine', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Donations response:', response);
    return response.data; // Return just the data array
  } catch (error) {
    console.error('Error fetching donations:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};
export const updateDonation = (id, payload) => api.patch(`/donations/${id}`, payload);
export const deleteDonation = (id) => {
  // Real API call to delete a donation
  return api.delete(`/donations/${id}`);
};
export const getMyDonationHistory = () => api.get('/donations');

// Get nearby donations with optional location parameters
export const getNearbyDonations = (params = {}) => {
  console.log('Fetching nearby donations with params:', params);
  return api.get('/donations', { 
    params: {
      ...params,
      nearby: true  // Add this if your backend expects a query parameter
    }
  });
};

// Get delivered donations for volunteer
export const getDeliveredDonations = async () => {
  try {
    const response = await api.get('/donations/delivered');
    return response.data;
  } catch (error) {
    console.error('Error fetching delivered donations:', error);
    throw error;
  }
};

// Claim a donation
export const claimDonation = (id) => api.post(`/donations/${id}/claim`);

// Mark a donation as picked up
export const markPickedUp = (id, payload) => api.patch(`/donations/${id}/pickup`, payload);

// Mark a donation as delivered
export const markDelivered = (id) => api.patch(`/donations/${id}/deliver`);

// profile/karma
export const getMe = () => api.get('/users/me');