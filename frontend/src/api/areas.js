// frontend/src/api/areas.js
import apiClient from './apiClient';

const BASE_URL = 'http://localhost:5000/api/areas';

// Create a new area
export function createArea(name, created_by) {
  return apiClient.post('/areas', { name, created_by });
}

// Get all areas, with optional filter for active/inactive
export function getAllAreas(active = null) {
  let url = '/areas';
  if (active !== null) {
    url += `?active=${active}`;
  }
  return apiClient.get(url).then(res => res.data);
}

// Mark an area as complete
export function markAreaComplete(area_id) {
  return apiClient.patch(`/areas/${area_id}/complete`);
}

// Delete an area
export function deleteArea(area_id) {
  return apiClient.delete(`/areas/${area_id}`);
}

// Update area name
export function updateArea(area_id, newName) {
  return apiClient.patch(`/areas/${area_id}`, { name: newName });
}
