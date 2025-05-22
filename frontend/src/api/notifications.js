// src/api/notifications.js
import axios from 'axios';

const API = axios.create({
  baseURL: '/api/notifications',
  withCredentials: true,
});

// Attach JWT from sessionStorage on every request
API.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fetch all notifications for a given user
export const getNotificationsForUser = userId =>
  API.get(`/user/${userId}`)
     .then(res => res.data);

// Delete (dismiss) a notification by its ID
export const deleteNotification = notificationId =>
  API.delete(`/${notificationId}`)
     .then(res => res.data);
