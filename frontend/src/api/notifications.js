// src/api/notifications.js
import apiClient from './apiClient';

// Fetch all notifications for a given user
export const getNotificationsForUser = userId =>
  apiClient.get(`/notifications/user/${userId}`)
     .then(res => res.data);

// Delete (dismiss) a notification by its ID
export const deleteNotification = notificationId =>
  apiClient.delete(`/notifications/${notificationId}`)
     .then(res => res.data);
