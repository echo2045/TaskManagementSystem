import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api/auth' });

export const register    = data => API.post('/register', data).then(r => r.data);
export const login       = data => API.post('/login',    data).then(r => r.data);

export const getAuthToken = () => {
  return sessionStorage.getItem('token');
};
