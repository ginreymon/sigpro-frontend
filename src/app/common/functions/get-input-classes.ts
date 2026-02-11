import { AbstractControl } from '@angular/forms';

export function getInputClasses(control?: AbstractControl | null, misMatch: boolean = false): string {
  const base = 'w-full bg-white rounded border text-base outline-none text-gray-700 py-1 px-3 pr-10 leading-8 transition-colors duration-200 ease-in-out';

  if (!control) return base;

  const isError = (control.invalid && control.touched) || misMatch;

  const validClasses = 'border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
  const errorClasses = 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200';

  return `${base} ${isError ? errorClasses : validClasses}`;
}
