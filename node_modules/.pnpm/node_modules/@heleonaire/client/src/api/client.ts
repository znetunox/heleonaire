import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:2567',
});

// Injeta token automaticamente
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hel_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
