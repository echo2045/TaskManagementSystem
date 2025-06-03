// src/utils/getTaskColor.js

export function getTaskColor(importance, urgency) {
  const isImportant = importance > 5;
  const isUrgent = urgency > 5;

  if (isImportant && isUrgent) return 'do';         // Do: urgent & important
  if (isImportant && !isUrgent) return 'schedule';  // Schedule: important only
  if (!isImportant && isUrgent) return 'delegate';  // Delegate: urgent only
  return 'eliminate';                               // Eliminate: neither
}

export const borderColors = {
  do: '#E57373',       // Red
  schedule: '#81C784', // Green
  delegate: '#64B5F6', // Blue
  eliminate: '#FBC02D' // Yellow
};

export const interiorColors = {
  do: '#FFEBEE',       // very light red
  schedule: '#E8F5E9', // very light green
  delegate: '#E1F5FE', // lighter blue interior
  eliminate: '#FFFDE7' // lighter yellow interior
};
