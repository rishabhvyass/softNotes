export function formatHeaderDate(date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function relativeDate(iso: string, now = new Date()): string {
  const value = new Date(iso);
  const deltaMs = now.getTime() - value.getTime();
  const minutes = Math.max(0, Math.round(deltaMs / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat(undefined, {day: 'numeric', month: 'short'}).format(value);
}

export function notePeriodLabel(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Morning note';
  if (hour < 18) return 'Afternoon note';
  return 'Evening note';
}

