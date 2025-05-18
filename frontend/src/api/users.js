import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Fetch all users
export const getUsers = () =>
  API.get('/users').then(res => res.data);

// Create a new user
export const createUser = user =>
  API.post('/users', user).then(res => res.data);

// Fetch supervisees of a given supervisor
export const getSupervisees = supervisorId =>
  API.get(`/users/${supervisorId}/supervisees`).then(res => res.data);

// Assign a supervisee to a supervisor
export const assignSupervisee = (supervisorId, superviseeId) =>
  API.post(`/users/${supervisorId}/supervisees`, { supervisee_id: superviseeId });

// Remove a supervisee
export const unassignSupervisee = (supervisorId, superviseeId) =>
  API.delete(`/users/${supervisorId}/supervisees/${superviseeId}`);

// Change password for a user
export const changePassword = (userId, oldPassword, newPassword) =>
  API.patch(`/users/${userId}/password`, { oldPassword, newPassword });
