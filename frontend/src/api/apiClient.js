import axios from 'axios';
import { getAuthToken } from './auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://192.168.10.47:1080/api',
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;