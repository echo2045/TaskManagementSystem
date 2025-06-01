import axios from 'axios';

// 1) Base URL
axios.defaults.baseURL = 'http://localhost:5000/api';

// 2) Get all users
export const getUsers = () =>
  axios.get('/users').then(res => res.data);

// 3) Create new user
export const createUser = user =>
  axios.post('/users', user).then(res => res.data);

// 4) Supervisor - Get supervisees
export const getSupervisees = supervisorId =>
  axios.get(`/users/${supervisorId}/supervisees`).then(res => res.data);

// 5) Supervisor - Assign a supervisee
export const assignSupervisee = (supervisorId, superviseeId) =>
  axios.post(`/users/${supervisorId}/supervisees`, { supervisee_id: superviseeId });

// 6) Supervisor - Unassign a supervisee
export const unassignSupervisee = (supervisorId, superviseeId) =>
  axios.delete(`/users/${supervisorId}/supervisees/${superviseeId}`);

// 7) Change password
export const changePassword = (userId, oldPassword, newPassword) =>
  axios.patch(`/users/${userId}/password`, { oldPassword, newPassword });

// ✅ 8) Delete user by ID
export const deleteUserById = userId =>
  axios.delete(`/users/${userId}`);

// ✅ 9) Update user by ID (excluding password and ID)
export const updateUserById = (userId, updatedFields) =>
  axios.patch(`/users/${userId}`, updatedFields);
