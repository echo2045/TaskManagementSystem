// frontend/src/api/users.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export const getUsers = () =>
  API.get('/users').then(res => res.data);

export const createUser = user =>
  API.post('/users', user).then(res => res.data);

export const getSupervisees = supervisorId =>
  API.get(`/users/${supervisorId}/supervisees`).then(res => res.data);

export const assignSupervisee = (supervisorId, superviseeId) =>
  API.post(`/users/${supervisorId}/supervisees`, { supervisee_id: superviseeId });

export const unassignSupervisee = (supervisorId, superviseeId) =>
  API.delete(`/users/${supervisorId}/supervisees/${superviseeId}`);
