import { Component, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { DateRangeFields } from '../date-range-fields/date-range-fields';

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-date-range-form',
  standalone: true,
  imports: [ReactiveFormsModule, DateRangeFields, UiButton, UiIcon],
  templateUrl: './date-range-form.html',
})
export class DateRangeForm {
  @Output() onSearch = new EventEmitter<DateRangeValue>();

  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    start_date: [null, Validators.required],
    end_date: [null, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { start_date, end_date } = this.form.value;
    this.onSearch.emit({ startDate: start_date, endDate: end_date });
  }
}
