import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Matches your backend port
});

// This interceptor automatically attaches your JWT token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;