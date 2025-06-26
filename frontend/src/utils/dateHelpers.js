export function toUtcIsoDate(localDateString) {
  const [year, month, day] = localDateString.split('-');
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString();
}
