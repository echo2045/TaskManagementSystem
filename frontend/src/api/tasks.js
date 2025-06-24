// src/api/tasks.js
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/tasks';

// ✅ Create new task with correct start_date timestamp
export function createTask(data) {
  const payload = {
    ...data,
    start_date: data.start_date
      ? new Date(data.start_date).toISOString()
      : null
  };
  return axios.post(`${BASE_URL}`, payload);
}

// ✅ Fetch tasks for current user
export function getTasksForUser() {
  return axios.get(`${BASE_URL}`).then(res => res.data);
}

// ✅ Fetch archived tasks
export function getArchivedTasksForUser(user_id) {
  return axios.get(`${BASE_URL}/archive/${user_id}`).then(res => res.data);
}

// ✅ Update task
export function updateTask(task_id, updates) {
  return axios.patch(`${BASE_URL}/${task_id}`, updates);
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
export function addAssignee(task_id, user_id, importance, urgency, start_date) {
  return axios.post(`${BASE_URL}/${task_id}/assignees`, {
    user_id,
    importance,
    urgency,
    start_date: start_date ? new Date(start_date).toISOString() : null
  });
}

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
