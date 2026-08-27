import { Component, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { TimeRangeFields } from '../time-range-fields/time-range-fields';

export interface TimeRangeFormValue {
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-time-range-form',
  standalone: true,
  imports: [ReactiveFormsModule, TimeRangeFields, UiButton, UiIcon],
  templateUrl: './time-range-form.html',
})
export class TimeRangeForm {
  @Output() onSearch = new EventEmitter<TimeRangeFormValue>();

  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    start_time: [null, Validators.required],
    end_time: [null, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { start_time, end_time } = this.form.value;
    this.onSearch.emit({ startTime: start_time, endTime: end_time });
  }
}
