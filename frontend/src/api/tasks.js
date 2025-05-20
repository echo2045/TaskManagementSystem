// frontend/src/api/tasks.js
import axios from 'axios';

// point axios at backend and include JWT header globally
axios.defaults.baseURL = 'http://localhost:5000/api';

// Tasks CRUD for _any_ user
export const getTasksForUser         = userId => axios.get(`/users/${userId}/tasks`).then(r => r.data);
export const getArchivedTasksForUser = userId => axios.get(`/users/${userId}/tasks/archive`).then(r => r.data);

export const createTask  = task => axios.post('/tasks', task).then(r => r.data);
export const updateTask  = (id, upd) => axios.patch(`/tasks/${id}`, upd).then(r => r.data);
export const deleteTask  = id => axios.delete(`/tasks/${id}`);

export const getAssignees   = taskId => axios.get(`/tasks/${taskId}/assignees`).then(r => r.data);
export const assignTask     = (taskId, userId) => axios.post(`/tasks/${taskId}/assignees`, { user_id: userId }).then(r => r.data);
export const unassignTask   = (taskId, userId) => axios.delete(`/tasks/${taskId}/assignees/${userId}`);

// aliases
export const addAssignee    = assignTask;
export const removeAssignee = unassignTask;
