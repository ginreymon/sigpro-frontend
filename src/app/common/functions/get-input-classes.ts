import { AbstractControl } from '@angular/forms';

export function getInputClasses(control?: AbstractControl | null, misMatch: boolean = false, extraClasses?: string): string {
  const base = `rounded border text-base outline-none text-gray-700 leading-8 transition-colors duration-200 ease-in-out focus:ring-2 ${extraClasses}`;

  if (!control) return base;

  const isError = (control.invalid && control.touched) || misMatch;

  const validClasses = 'border-gray-300 focus:border-brand-500 focus:ring-brand-200';
  const errorClasses = 'border-red-500 focus:border-red-500 focus:ring-red-200';

  return `${base} ${isError ? errorClasses : validClasses}`;
}