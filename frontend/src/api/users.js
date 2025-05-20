// src/api/users.js
import axios from 'axios';

// 1) Reuse the same global axios with your JWT header
axios.defaults.baseURL = 'http://localhost:5000/api';

export const getUsers = () =>
  axios.get('/users').then(res => res.data);

export const createUser = user =>
  axios.post('/users', user).then(res => res.data);

export const getSupervisees = supervisorId =>
  axios.get(`/users/${supervisorId}/supervisees`).then(res => res.data);

export const assignSupervisee = (supervisorId, superviseeId) =>
  axios.post(`/users/${supervisorId}/supervisees`, { supervisee_id: superviseeId });

export const unassignSupervisee = (supervisorId, superviseeId) =>
  axios.delete(`/users/${supervisorId}/supervisees/${superviseeId}`);

export const changePassword = (userId, oldPassword, newPassword) =>
  axios.patch(`/users/${userId}/password`, { oldPassword, newPassword });
