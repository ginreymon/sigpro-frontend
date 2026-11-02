/**
 * Window of +/- windowSeconds around each full hour (used both by
 * app-shift-hourly-record and by the save gate of app-stamping-record).
 */
export function isWithinHourlyWindow(windowSeconds: number, now: Date = new Date()): boolean {
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
  const nextHour = new Date(hourStart.getTime() + 3600_000);
  const remainingSeconds = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
  const elapsedInHour = Math.floor((now.getTime() - hourStart.getTime()) / 1000);
  return (remainingSeconds <= windowSeconds && remainingSeconds > 0) || elapsedInHour <= windowSeconds;
}

/** HH:mm bounds of the registration window around the coming full hour. */
export function hourlyWindowRange(windowSeconds: number, now: Date = new Date()): { start: string; end: string } {
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
  const nextHour = new Date(hourStart.getTime() + 3600_000);
  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return {
    start: fmt(new Date(nextHour.getTime() - windowSeconds * 1000)),
    end: fmt(new Date(nextHour.getTime() + windowSeconds * 1000)),
  };
}
