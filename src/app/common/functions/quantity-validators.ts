import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Shared by app-quantity-modal and the work-sessions record form.
const QUANTITY_FIELDS = ['completed_quantity', 'rejected_quantity', 'scrap_quantity'];

// Whole units only; empty values are left to Validators.required.
export function integerValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number.isInteger(Number(value)) ? null : { notInteger: true };
}

// Group validator: completed + rejected + scrap cannot exceed `getMax()` (null = limit not known yet).
export function exceedsMaxValidator(getMax: () => number | null): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const max = getMax();
    const total = QUANTITY_FIELDS.reduce((sum, name) => sum + (Number(group.get(name)?.value) || 0), 0);
    return max !== null && total > max ? { exceedsMax: { max, total } } : null;
  };
}
