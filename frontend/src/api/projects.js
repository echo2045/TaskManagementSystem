// frontend/src/api/projects.js
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/projects';

// Create a new project
export function createProject(name, created_by) {
  return axios.post(BASE_URL, { name, created_by });
}

// Get all projects, with optional filter for active/inactive
export function getAllProjects(active = null) {
  let url = BASE_URL;
  if (active !== null) {
    url += `?active=${active}`;
  }
  return axios.get(url).then(res => res.data);
}

// Mark a project as complete
export function markProjectComplete(project_id) {
  return axios.patch(`${BASE_URL}/${project_id}/complete`);
}

// Delete a project (cascades its tasks)
export function deleteProject(project_id) {
  return axios.delete(`${BASE_URL}/${project_id}`);
}

// Update project name
export function updateProject(project_id, newName) {
  return axios.patch(`${BASE_URL}/${project_id}`, { name: newName });
}
