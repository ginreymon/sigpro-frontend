/**
 * Ventana de +/- windowSeconds alrededor de cada hora en punto (usada tanto por
 * app-shift-hourly-record como por el gate de guardado de app-stamping-record).
 */
export function isWithinHourlyWindow(windowSeconds: number, now: Date = new Date()): boolean {
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
  const nextHour = new Date(hourStart.getTime() + 3600_000);
  const remainingSeconds = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
  const elapsedInHour = Math.floor((now.getTime() - hourStart.getTime()) / 1000);
  return (remainingSeconds <= windowSeconds && remainingSeconds > 0) || elapsedInHour <= windowSeconds;
}
