// frontend/src/api/projects.js
import apiClient from './apiClient';

const BASE_URL = 'http://localhost:5000/api/projects';

// Create a new project
export function createProject(name, created_by) {
  return apiClient.post('/projects', { name, created_by });
}

// Get all projects, with optional filter for active/inactive
export function getAllProjects(active = null) {
  let url = '/projects';
  if (active !== null) {
    url += `?active=${active}`;
  }
  return apiClient.get(url).then(res => res.data);
}

// Mark a project as complete
export function markProjectComplete(project_id) {
  return apiClient.patch(`/projects/${project_id}/complete`);
}

// Delete a project (cascades its tasks)
export function deleteProject(project_id) {
  return apiClient.delete(`/projects/${project_id}`);
}

// Update project name
export function updateProject(project_id, newName) {
  return apiClient.patch(`/projects/${project_id}`, { name: newName });
}
