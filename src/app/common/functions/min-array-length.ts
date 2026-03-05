import { AbstractControl, ValidationErrors } from '@angular/forms';

export function minArrayLength(min: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || value.length < min) {
      return { minArrayLength: { requiredLength: min } };
    }

    return null;
  };
}