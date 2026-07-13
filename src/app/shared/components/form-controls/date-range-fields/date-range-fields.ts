import { Component, Input, OnInit, inject } from '@angular/core';
import { ControlContainer, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { UiFormField } from '../../../elements/ui-form-field/ui-form-field';
import { UiDatePicker } from '../../../elements/ui-date-picker/ui-date-picker';

@Component({
  selector: 'app-date-range-fields',
  standalone: true,
  imports: [ReactiveFormsModule, UiFormField, UiDatePicker],
  templateUrl: './date-range-fields.html',
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
})
export class DateRangeFields implements OnInit {
  @Input() startCtrl: string = 'fecha_inicio';
  @Input() endCtrl: string = 'fecha_fin';

  private controlContainer = inject(ControlContainer);

  ngOnInit(): void {
    const form = this.controlContainer.control as FormGroup;
    form.get(this.startCtrl)!.valueChanges.subscribe(() => this._validate(false));
    form.get(this.endCtrl)!.valueChanges.subscribe(() => this._validate(true));
  }

  private _validate(markTouched: boolean): void {
    const form = this.controlContainer.control as FormGroup;
    const inicio = form.get(this.startCtrl)?.value;
    const fin = form.get(this.endCtrl)?.value;
    const finControl = form.get(this.endCtrl)!;

    if (inicio && fin && fin < inicio) {
      finControl.setErrors({ ...(finControl.errors ?? {}), fechaFinMenor: true });
      if (markTouched) finControl.markAsTouched();
    } else if (finControl.errors?.['fechaFinMenor']) {
      const { fechaFinMenor, ...rest } = finControl.errors;
      finControl.setErrors(Object.keys(rest).length ? rest : null);
    }
  }
}
