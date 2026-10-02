import { Component, Input, OnInit, inject } from '@angular/core';
import { AbstractControl, ControlContainer, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { DialogService } from '../../../../services/common/dialog-service';
import { exceedsOneMonth } from '../../../../common/functions/date-utils';
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
  // Si es true, un rango mayor a un mes avisa y deja inválido el formulario.
  @Input() limitToOneMonth: boolean = false;

  private controlContainer = inject(ControlContainer);
  private dialogService = inject(DialogService);
  // Evita repetir el aviso mientras el rango siga excediendo un mes.
  private exceededMonth = false;

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

    if (this.limitToOneMonth) this._validateOneMonth(finControl, inicio, fin);
  }

  // Más de un mes: avisa una vez y deja el error en la fecha final (el formulario queda
  // inválido, así el botón de consultar se bloquea).
  private _validateOneMonth(finControl: AbstractControl, inicio?: string, fin?: string): void {
    const exceeds = !!inicio && !!fin && fin >= inicio && exceedsOneMonth(inicio, fin);

    if (exceeds) {
      finControl.setErrors({ ...(finControl.errors ?? {}), rangoMayorUnMes: true });
      if (!this.exceededMonth) {
        this.dialogService.openToast('Aviso', 'El rango seleccionado supera un mes.', 'triangleExclamation');
      }
    } else if (finControl.errors?.['rangoMayorUnMes']) {
      const { rangoMayorUnMes, ...rest } = finControl.errors;
      finControl.setErrors(Object.keys(rest).length ? rest : null);
    }
    this.exceededMonth = exceeds;
  }
}
