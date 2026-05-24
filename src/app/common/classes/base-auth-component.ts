import { signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { getInputClasses } from '../functions/get-input-classes';

export class BaseAuthComponent {
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword: boolean = false;

  setShowPassword(value: boolean) {
    this.showPassword = value;
  }

  getInputClasses(control: AbstractControl | null, misMatch: boolean = false) {
    return getInputClasses(control, misMatch, 'w-full py-1 pl-3 pr-10');
  }
}
