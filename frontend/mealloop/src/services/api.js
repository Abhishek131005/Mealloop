// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Optional: attach token when you add real auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
export const getMyDonationHistory = () => api.get('/donations/history');

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