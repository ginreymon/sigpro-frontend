import { Component, Input, OnInit, Output, EventEmitter, inject } from '@angular/core';
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
export class DateRangeForm implements OnInit {
  @Output() onSearch = new EventEmitter<DateRangeValue>();
  // Fechas con las que arranca el formulario (opcional).
  @Input() initialRange: DateRangeValue | null = null;
  // Bloquea Consultar cuando el rango supera un mes.
  @Input() limitToOneMonth: boolean = false;

  // Disables Consultar while a request is in flight, so it cannot be double-submitted.
  @Input() loading: boolean = false;

  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    start_date: [null, Validators.required],
    end_date: [null, Validators.required],
  });

  ngOnInit(): void {
    if (this.initialRange) {
      this.form.patchValue({
        start_date: this.initialRange.startDate,
        end_date: this.initialRange.endDate,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const { start_date, end_date } = this.form.value;
    this.onSearch.emit({ startDate: start_date, endDate: end_date });
  }
}
