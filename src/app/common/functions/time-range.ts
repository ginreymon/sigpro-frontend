// Compartido entre app-quantity-duration-modal y app-quantity-modal (tab Horario):
// ambos calculan una duración a partir de un rango de horas "HH:mm".
export function timeStringToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function durationMinutesBetween(
  start: string | null | undefined,
  end: string | null | undefined,
): number | null {
  const startMinutes = timeStringToMinutes(start);
  const endMinutes = timeStringToMinutes(end);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return null;
  return endMinutes - startMinutes;
}

// Resta minutes a hhmm ("HH:mm") y devuelve el resultado en el mismo
// formato. null si hhmm es inválido o el resultado se sale del día
// (no soporta cruzar medianoche, igual límite que durationMinutesBetween).
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

// record_start/record_end llegan del backend sin sufijo de zona horaria —
// se asume UTC (igual que en balance-modal/stamping-balance-modal) para que
// el DatePipe la convierta a hora local en vez de interpretarla como local.
export function toLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const iso = value.endsWith('Z') || value.includes('+') ? value : value + 'Z';
  return new Date(iso);
}
