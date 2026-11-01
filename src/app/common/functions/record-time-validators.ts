import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Interval of the work session that contains a record; ended_at null = the session is still active.
export interface SessionWindow {
  started_at: string;
  ended_at: string | null;
}

// Form values are local "yyyy-MM-ddTHH:mm"; the session dates are UTC ISO and may carry 7 fractional digits.
const toDate = (value: string) => new Date(value.replace(/(\.\d{3})\d+/, '$1'));
const floorToMinute = (d: Date) => new Date(d.getTime() - (d.getTime() % 60000));

// Control validator for the end time: it cannot be before the start time (same error key the form field already shows).
export function endNotBeforeStartValidator(startName = 'start_time'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const start = control.parent?.get(startName)?.value;
    return start && control.value && toDate(start) > toDate(control.value) ? { fechaFinMenor: true } : null;
  };
}

// Control validator: active session -> the date cannot be in the future; closed session -> it must fall
// inside [started_at, ended_at]. `getSession` returns null when the session is unknown (no check).
export function withinSessionValidator(getSession: () => SessionWindow | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const session = getSession();
    if (!session || !control.value) return null;
    const value = toDate(control.value);
    if (!session.ended_at) return value > new Date() ? { afterNow: true } : null;
    const from = floorToMinute(toDate(session.started_at));
    const to = toDate(session.ended_at);
    return value < from || value > to ? { outsideSession: { from, to } } : null;
  };
}
