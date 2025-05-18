export function getTaskColor(importance, urgency) {
  if (importance >= 4 && urgency >= 4) return 'do';         // Do: urgent & important
  if (importance >= 4 && urgency < 4) return 'schedule';    // Schedule: important only
  if (importance < 4 && urgency >= 4) return 'delegate';    // Delegate: urgent only
  return 'eliminate';                                       // Eliminate: neither
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
