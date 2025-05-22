// src/api/tasks.js
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true,  // if you’re using cookie-based sessions
});

// On every request, grab the JWT from sessionStorage (AuthContext’s source of truth),
// and set it as a Bearer token on our custom API instance.
// This aligns with what AuthContext is doing:
API.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Global Active / Archive ───────────────────────────────────────────────
export const getAllTasks         = () => API.get('/tasks').then(r => r.data);
export const getArchivedTasks    = () => API.get('/tasks/archive').then(r => r.data);

// ── Per-User Active / Archive ─────────────────────────────────────────────
export const getTasksForUser         = userId => 
  API.get(`/users/${userId}/tasks`).then(r => r.data);

export const getArchivedTasksForUser = userId =>
  API.get(`/users/${userId}/tasks/archive`).then(r => r.data);

// ── CRUD on Tasks ─────────────────────────────────────────────────────────
export const createTask  = payload => API.post('/tasks', payload).then(r => r.data);
export const updateTask  = (taskId, data) => API.put(`/tasks/${taskId}`, data).then(r => r.data);
export const deleteTask  = taskId => API.delete(`/tasks/${taskId}`).then(r => r.data);

// ── Delegation Endpoints ─────────────────────────────────────────────────
export const getAssignees    = taskId => API.get(`/tasks/${taskId}/assignees`).then(r => r.data);
export const addAssignee     = (taskId, userId) =>
  API.post(`/tasks/${taskId}/assignees`, { user_id: userId }).then(r => r.data);
export const removeAssignee  = (taskId, userId) =>
  API.delete(`/tasks/${taskId}/assignees/${userId}`).then(r => r.data);
export const updateAssignee  = (taskId, userId, is_completed) =>
  API.put(`/tasks/${taskId}/assignees/${userId}`, { is_completed }).then(r => r.data);
