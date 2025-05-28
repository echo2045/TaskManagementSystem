import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/areas';

// Create a new area
export function createArea(name, created_by) {
  return axios.post(BASE_URL, { name, created_by });
}

// Get all areas, with optional active filter
export function getAllAreas(active = null) {
  let url = BASE_URL;
  if (active !== null) {
    url += `?active=${active}`;
  }
  return axios.get(url).then(res => res.data);
}

// Mark an area as complete/incomplete
export function markAreaComplete(area_id, isCompleted) {
  return axios.patch(`${BASE_URL}/${area_id}/complete`, { is_completed: isCompleted });
}

// Delete an area (cascades its tasks)
export function deleteArea(area_id) {
  return axios.delete(`${BASE_URL}/${area_id}`);
}
