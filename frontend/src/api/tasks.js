// src/api/tasks.js
import axios from 'axios';
import apiClient from './apiClient';

const BASE_URL = 'http://192.168.10.47:5000/api/tasks';

// ✅ Create new task with correct start_date timestamp
export function createTask(data) {
  const payload = {
    ...data,
    start_date: data.start_date
      ? new Date(data.start_date).toISOString()
      : null
  };
  return apiClient.post(`/tasks`, payload).then(res => res.data);
}

// ✅ Fetch tasks for current user
export function getTasksForUser() {
  return axios.get(`${BASE_URL}`).then(res => res.data);
}

// ✅ Fetch single task by ID
export function getTask(task_id) {
    return axios.get(`${BASE_URL}/${task_id}`).then(res => res.data);
}

// ✅ Fetch archived tasks
export function getArchivedTasksForUser(user_id) {
  return axios.get(`${BASE_URL}/archive/${user_id}`).then(res => res.data);
}

// ✅ Update task (general patch)
export function updateTask(task_id, updates) {
  return axios.patch(`${BASE_URL}/${task_id}`, updates);
}

// ✅ Update entire task details (used in EditTaskModal)
export function updateTaskDetails(task) {
  return axios.put(`${BASE_URL}/${task.task_id}`, task).then(res => res.data);
}

// ✅ Delete task
export function deleteTask(task_id) {
  return axios.delete(`${BASE_URL}/${task_id}`);
}

// ✅ Get assignees
export function getAssignees(task_id) {
  return axios.get(`${BASE_URL}/${task_id}/assignees`).then(res => res.data);
}

// ✅ Add assignee with importance, urgency, and start_date
export function addAssignee(task_id, user_id, importance, urgency, start_date, assigned_time_estimate) {
  return axios.post(`${BASE_URL}/${task_id}/assignees`, {
    user_id,
    importance,
    urgency,
    start_date: start_date ? new Date(start_date).toISOString() : null,
    assigned_time_estimate
  });
}

export const assignTask = addAssignee;

// ✅ Remove assignee
export function removeAssignee(task_id, user_id) {
  return axios.delete(`${BASE_URL}/${task_id}/assignees/${user_id}`);
}

// ✅ Toggle completion for an assignee
export function markAssigneeComplete(task_id, user_id, is_completed) {
  return axios.patch(`${BASE_URL}/${task_id}/assignment/${user_id}/complete`, {
    is_completed
  });
}

// ✅ Update start date for an assignee
export function updateAssignmentStartDate(task_id, user_id, start_date) {
  return axios.patch(`${BASE_URL}/${task_id}/assignment/${user_id}/start-date`, {
    start_date: start_date ? new Date(start_date).toISOString() : null
  });
}

// Start a work session for a task
export function startWorkSession(taskId) {
  return axios.post(`${BASE_URL}/${taskId}/start`);
}

// Stop the current work session
export function stopWorkSession() {
  return axios.post(`${BASE_URL}/stop`);
}

// Get a user's work history
export function getWorkHistory(userId) {
  return axios.get(`${BASE_URL}/users/${userId}/work-history`).then(res => res.data);
}

// Get the task a user is currently working on
export function getCurrentTask(userId) {
  return axios.get(`${BASE_URL}/users/${userId}/current-task`).then(res => res.data);
}