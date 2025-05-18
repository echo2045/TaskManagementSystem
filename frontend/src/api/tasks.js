// frontend/src/api/tasks.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const getTasks = () =>
  API.get('/tasks').then(res => res.data);

export const getArchivedTasks = () =>
  API.get('/tasks/archive').then(res => res.data);

export const createTask = task =>
  API.post('/tasks', task).then(res => res.data);

export const updateTask = (id, updates) =>
  API.patch(`/tasks/${id}`, updates).then(res => res.data);

export const deleteTask = id =>
  API.delete(`/tasks/${id}`);

export const getAssignees = taskId =>
  API.get(`/tasks/${taskId}/assignees`).then(res => res.data);

// original names:
export const assignTask   = (taskId, userId) =>
  API.post(`/tasks/${taskId}/assignees`, { user_id: userId }).then(res => res.data);

export const unassignTask = (taskId, userId) =>
  API.delete(`/tasks/${taskId}/assignees/${userId}`);

// aliases so DelegateModal.jsx can import these exact names:
export const addAssignee    = assignTask;
export const removeAssignee = unassignTask;
