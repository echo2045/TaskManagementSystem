import axios from 'axios';

export function createProject(name, created_by) {
  return axios.post('http://localhost:5000/api/projects', { name, created_by });
}

export function getAllProjects() {
  return axios.get('http://localhost:5000/api/projects').then(res => res.data);
}
