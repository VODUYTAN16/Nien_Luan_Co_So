// src/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Thêm các headers khác nếu cần
  },
  withCredentials: true,
});

export default api;
