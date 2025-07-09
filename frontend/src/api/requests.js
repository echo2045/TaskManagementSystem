import apiClient from './apiClient';

export const getSupervisors = async () => {
  const response = await apiClient.get('/requests/supervisors');
  return response.data;
};

export const createTaskRequest = async (request) => {
  const response = await apiClient.post('/requests', request);
  return response.data;
};

export const updateTaskRequest = async (requestId, status) => {
  const response = await apiClient.patch(`/requests/${requestId}`, { status });
  return response.data;
};