export const formatToIST = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return 'Not scheduled';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date) + ' IST';
};

export const formatRelativeIST = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const isPast = diffMs > 0;
  const absDiff = Math.abs(diffMs);

  const mins = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return isPast ? `${mins}m ago` : `in ${mins}m`;
  if (hours < 24) return isPast ? `${hours}h ago` : `in ${hours}h`;
  if (days < 7) return isPast ? `${days}d ago` : `in ${days}d`;

  return formatToIST(date);
};

export const toLocalDatetimeInput = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  // Convert to local YYYY-MM-DDTHH:mm string for datetime-local input
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const isFutureDate = (dateInput: string | Date): boolean => {
  return new Date(dateInput).getTime() > Date.now();
};

export const padZero = (n: number): string => n.toString().padStart(2, '0');

export const getISTParts = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';

  const year = parseInt(get('year'), 10);
  const month = parseInt(get('month'), 10);
  const day = parseInt(get('day'), 10);
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(get('minute'), 10);

  const dateStr = `${year}-${padZero(month)}-${padZero(day)}`;
  const timeStr = `${padZero(hour)}:${padZero(minute)}`;

  return { year, month, day, hour, minute, dateStr, timeStr };
};

export const combineDateAndTimeIST = (dateStr?: string, timeStr?: string): string | undefined => {
  if (!dateStr) return undefined;
  const effectiveTime = timeStr || '09:00';
  const istString = `${dateStr}T${effectiveTime}:00+05:30`;
  const d = new Date(istString);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

export const formatDateOnlyIST = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export const formatTimeOnlyIST = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d) + ' IST';
};
