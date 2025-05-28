import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/tasks';

export function createTask(data) {
  return axios.post(`${BASE_URL}`, data);
}

export function getTasksForUser() {
  return axios.get(`${BASE_URL}`).then(res => res.data);
}

export function getArchivedTasksForUser(user_id) {
  return axios.get(`${BASE_URL}/archive/${user_id}`).then(res => res.data);
}

export function updateTask(task_id, updates) {
  return axios.patch(`${BASE_URL}/${task_id}`, updates);
}

export function deleteTask(task_id) {
  return axios.delete(`${BASE_URL}/${task_id}`);
}

export function getAssignees(task_id) {
  return axios.get(`${BASE_URL}/${task_id}/assignees`).then(res => res.data);
}

export function updateAssignee(task_id, user_id, completed) {
  const url = `${BASE_URL}/${task_id}/assignees`;
  return completed
    ? axios.post(url, { user_id })
    : axios.delete(`${url}/${user_id}`);
}

// ✅ These are the missing exports your frontend expected:
export function addAssignee(task_id, user_id) {
  return axios.post(`${BASE_URL}/${task_id}/assignees`, { user_id });
}

export function removeAssignee(task_id, user_id) {
  return axios.delete(`${BASE_URL}/${task_id}/assignees/${user_id}`);
}
