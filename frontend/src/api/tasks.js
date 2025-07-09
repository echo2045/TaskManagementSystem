// src/api/tasks.js
import apiClient from './apiClient';

const BASE_URL = 'http://localhost:5000/api/tasks';

// ✅ Create new task with correct start_date timestamp
export function createTask(data) {
  const payload = {
    ...data,
    start_date: data.start_date
      ? new Date(data.start_date).toISOString()
      : null
  };
  return apiClient.post(`/tasks`, payload);
}

// ✅ Fetch tasks for current user
export function getTasksForUser() {
  return apiClient.get(`/tasks`).then(res => res.data);
}

// ✅ Fetch single task by ID
export function getTask(task_id) {
    return apiClient.get(`/tasks/${task_id}`).then(res => res.data);
}

// ✅ Fetch archived tasks
export function getArchivedTasksForUser(user_id) {
  return apiClient.get(`/tasks/archive/${user_id}`).then(res => res.data);
}

// ✅ Update task (general patch)
export function updateTask(task_id, updates) {
  return apiClient.patch(`/tasks/${task_id}`, updates);
}

// ✅ Update entire task details (used in EditTaskModal)
export function updateTaskDetails(task) {
  return apiClient.put(`/tasks/${task.task_id}`, task).then(res => res.data);
}

// ✅ Delete task
export function deleteTask(task_id) {
  return apiClient.delete(`/tasks/${task_id}`);
}

// ✅ Get assignees
export function getAssignees(task_id) {
  return apiClient.get(`/tasks/${task_id}/assignees`).then(res => res.data);
}

// ✅ Add assignee with importance, urgency, and start_date
export function addAssignee(task_id, user_id, importance, urgency, start_date, assigned_time_estimate) {
  return apiClient.post(`/tasks/${task_id}/assignees`, {
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
  return apiClient.delete(`/tasks/${task_id}/assignees/${user_id}`);
}

// ✅ Toggle completion for an assignee
export function markAssigneeComplete(task_id, user_id, is_completed) {
  return apiClient.patch(`/tasks/${task_id}/assignment/${user_id}/complete`, {
    is_completed
  });
}

// ✅ Update start date for an assignee
export function updateAssignmentStartDate(task_id, user_id, start_date) {
  return apiClient.patch(`/tasks/${task_id}/assignment/${user_id}/start-date`, {
    start_date: start_date ? new Date(start_date).toISOString() : null
  });
}

// Start a work session for a task
export function startWorkSession(taskId) {
  return apiClient.post(`/tasks/${taskId}/start`);
}

// Stop the current work session
export function stopWorkSession() {
  return apiClient.post(`/tasks/stop`);
}

// Get a user's work history
export function getWorkHistory(userId) {
  return apiClient.get(`/users/${userId}/work-history`).then(res => res.data);
}

// Get the task a user is currently working on
export function getCurrentTask(userId) {
  return apiClient.get(`/users/${userId}/current-task`).then(res => res.data);
}