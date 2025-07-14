// frontend/src/api/areas.js
import axios from 'axios';

const BASE_URL = 'http://192.168.10.47:1080/api/areas';

// Create a new area
export function createArea(name, created_by) {
  return axios.post(BASE_URL, { name, created_by });
}

// Get all areas, with optional filter for active/inactive
export function getAllAreas(active = null) {
  let url = BASE_URL;
  if (active !== null) {
    url += `?active=${active}`;
  }
  return axios.get(url).then(res => res.data);
}

// Mark an area as complete
export function markAreaComplete(area_id) {
  return axios.patch(`${BASE_URL}/${area_id}/complete`);
}

// Delete an area
export function deleteArea(area_id) {
  return axios.delete(`${BASE_URL}/${area_id}`);
}

// Update area name
export function updateArea(area_id, newName) {
  return axios.patch(`${BASE_URL}/${area_id}`, { name: newName });
}
