/**
 * Date utility functions for consistent UTC conversion across the app.
 *
 * All query dates must be sent as UTC ISO strings (with Z) so the server
 * receives correct timestamps regardless of the user's local timezone.
 *
 * Background: data is stored in UTC (datetimeoffset +00:00). The browser
 * runs in local time (e.g. Colombia UTC-5). Sending naive ISO strings
 * would cause a 5-hour offset in query results.
 */

/**
 * Converts a shift time string (HH:MM:SS) to a UTC ISO datetime string,
 * using today's local date as the base.
 *
 * @param timeStr    - Time string in HH:MM:SS (or HH:MM:SS.ffffff) format
 * @param extraHours - Extra hours to add (e.g. buffer after shift end)
 *
 * @example (UTC-5 / Colombia, today = 2026-05-27)
 *   shiftTimeToUtcIso('06:00:00')     → '2026-05-27T11:00:00.000Z'
 *   shiftTimeToUtcIso('14:00:00')     → '2026-05-27T19:00:00.000Z'
 *   shiftTimeToUtcIso('22:00:00', 8)  → '2026-05-28T11:00:00.000Z'
 */
export function shiftTimeToUtcIso(timeStr: string, extraHours = 0): string {
  const [h, m, s] = timeStr.slice(0, 8).split(':').map(Number);
  const d = new Date();
  d.setHours(h + extraHours, m, s, 0);
  return d.toISOString();
}

/**
 * Returns today's date in YYYY-MM-DD format using the browser's LOCAL timezone.
 *
 * Unlike `new Date().toISOString().slice(0, 10)` which uses UTC date,
 * this returns the correct local date (important near midnight in UTC-5).
 *
 * @example (at 23:30 local UTC-5 = 04:30 UTC next day)
 *   localTodayStr()                          → '2026-05-27'  ✓ local date
 *   new Date().toISOString().slice(0, 10)    → '2026-05-28'  ✗ UTC date
 */
export function localTodayStr(): string {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  const d   = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MONTH_NAMES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * Current month's name in Spanish, capitalized (e.g. "Agosto").
 */
export function currentMonthLabel(): string {
  const name = MONTH_NAMES_ES[new Date().getMonth()];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Date range from the 1st of the current month through today (YYYY-MM-DD, local time).
 */
export function currentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const endDate = now.toISOString().slice(0, 10);
  return { startDate, endDate };
}

/**
 * True when the range YYYY-MM-DD → YYYY-MM-DD spans more than one calendar month
 * (e.g. 2026-05-27 → 2026-06-27 is one month; → 2026-06-28 is more).
 */
export function exceedsOneMonth(startStr: string, endStr: string): boolean {
  const [y, m, d] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  return new Date(ey, em - 1, ed) > new Date(y, m, d);
}
