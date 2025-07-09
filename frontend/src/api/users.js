import apiClient from './apiClient';



// 2) Get all users
export const getUsers = () =>
  apiClient.get('/users').then(res => res.data);

// 3) Create new user
export const createUser = user =>
  apiClient.post('/users', user).then(res => res.data);

// 4) Supervisor - Get supervisees
export const getSupervisees = supervisorId =>
  apiClient.get(`/users/${supervisorId}/supervisees`).then(res => res.data);

// 5) Supervisor - Assign a supervisee
export const assignSupervisee = (supervisorId, superviseeId) =>
  apiClient.post(`/users/${supervisorId}/supervisees`, { supervisee_id: superviseeId });

// 6) Supervisor - Unassign a supervisee
export const unassignSupervisee = (supervisorId, superviseeId) =>
  apiClient.delete(`/users/${supervisorId}/supervisees/${superviseeId}`);

// 7) Change password
export const changePassword = (userId, oldPassword, newPassword) =>
  apiClient.patch(`/users/${userId}/password`, { oldPassword, newPassword });

// ✅ 8) Delete user by ID
export const deleteUserById = userId =>
  apiClient.delete(`/users/${userId}`);

// ✅ 9) Update user by ID (excluding password and ID)
export const updateUserById = (userId, updatedFields) =>
  apiClient.patch(`/users/${userId}`, updatedFields);
