import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { UiFormField } from '../../../elements/ui-form-field/ui-form-field';
import { UiTimeRangePicker } from '../../../elements/ui-time-range-picker/ui-time-range-picker';

@Component({
  selector: 'app-time-range-fields',
  standalone: true,
  imports: [ReactiveFormsModule, UiFormField, UiTimeRangePicker],
  templateUrl: './time-range-fields.html',
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
})
export class TimeRangeFields implements OnInit, OnChanges {
  @Input() startCtrl: string = 'start_time';
  @Input() endCtrl: string = 'end_time';

  // Prellenan sus respectivos controles si llegan vacíos — p.ej. la hora
  // actual. No se sobrescriben si el form ya trae un valor (edición).
  @Input() initialStart: string | null = null;
  @Input() initialEnd: string | null = null;

  // Permiten bloquear cada picker por separado (p.ej. en edición, fijar el
  // inicio y solo dejar ajustar el fin) sin que el llamador tenga que
  // manipular los FormControl directamente.
  @Input() disableStart = false;
  @Input() disableEnd = false;

  private controlContainer = inject(ControlContainer);

  ngOnInit(): void {
    const form = this.controlContainer.control as FormGroup;
    const startControl = form.get(this.startCtrl)!;
    const endControl = form.get(this.endCtrl)!;

    if (this.initialStart && !startControl.value) {
      startControl.setValue(this.initialStart);
    }
    if (this.initialEnd && !endControl.value) {
      endControl.setValue(this.initialEnd);
    }

    this._applyDisabled(startControl, this.disableStart);
    this._applyDisabled(endControl, this.disableEnd);

    startControl.valueChanges.subscribe(() => this._validate(false));
    endControl.valueChanges.subscribe(() => this._validate(true));
  }

  ngOnChanges(changes: SimpleChanges): void {
    const form = this.controlContainer?.control as FormGroup | null;
    if (!form) return;

    if (changes['disableStart'] && !changes['disableStart'].firstChange) {
      this._applyDisabled(form.get(this.startCtrl)!, this.disableStart);
    }
    if (changes['disableEnd'] && !changes['disableEnd'].firstChange) {
      this._applyDisabled(form.get(this.endCtrl)!, this.disableEnd);
    }
  }

  private _applyDisabled(control: AbstractControl, disabled: boolean): void {
    if (disabled && control.enabled) control.disable({ emitEvent: false });
    else if (!disabled && control.disabled) control.enable({ emitEvent: false });
  }

  private _validate(markTouched: boolean): void {
    const form = this.controlContainer.control as FormGroup;
    const inicio = form.get(this.startCtrl)?.value;
    const fin = form.get(this.endCtrl)?.value;
    const finControl = form.get(this.endCtrl)!;

    if (inicio && fin && fin <= inicio) {
      finControl.setErrors({ ...(finControl.errors ?? {}), horaFinMenor: true });
      if (markTouched) finControl.markAsTouched();
    } else if (finControl.errors?.['horaFinMenor']) {
      const { horaFinMenor, ...rest } = finControl.errors;
      finControl.setErrors(Object.keys(rest).length ? rest : null);
    }
  }
}
