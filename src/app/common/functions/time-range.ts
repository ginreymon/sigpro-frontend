// "HH:mm" time helpers.
export function timeStringToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

// Subtracts minutes from hhmm ("HH:mm"), returning the same format. null if
// hhmm is invalid or the result leaves the day (midnight crossing unsupported).
export function timeMinusMinutes(hhmm: string | null | undefined, minutes: number): string | null {
  const total = timeStringToMinutes(hhmm);
  if (total === null || !Number.isFinite(minutes)) return null;
  const result = total - minutes;
  if (result < 0 || result > 1439) return null;
  const hh = Math.floor(result / 60).toString().padStart(2, '0');
  const mm = (result % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatMinutesAsHHmm(minutes: number | null): string {
  if (minutes === null) return '--:--';
  const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mm = (minutes % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

// Seconds as HH:MM, rounded to the nearest minute. '--:--' when there is no value.
export function formatSecondsAsHHmm(seconds: number | null | undefined): string {
  return formatMinutesAsHHmm(seconds == null ? null : Math.round(seconds / 60));
}

// record_start/record_end llegan del backend sin sufijo de zona horaria —
// se asume UTC (igual que en balance-modal/stamping-balance-modal) para que
// el DatePipe la convierta a hora local en vez de interpretarla como local.
export function toLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const iso = value.endsWith('Z') || value.includes('+') ? value : value + 'Z';
  return new Date(iso);
}
