import axios from 'axios';

export const BASE_URL = '/api'; // swap to Rails later
export const http = axios.create({ 
  baseURL: BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token if available
http.interceptors.request.use((config) => {
  const user = localStorage.getItem('pet_shipper_user');
  if (user) {
    const userData = JSON.parse(user);
    config.headers.Authorization = `Bearer ${userData.id}`;
  }
  return config;
});