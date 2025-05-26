import axios from 'axios';

export function createArea(name, created_by) {
  return axios.post('http://localhost:5000/api/areas', { name, created_by });
}

export function getAllAreas() {
  return axios.get('http://localhost:5000/api/areas').then(res => res.data);
}
