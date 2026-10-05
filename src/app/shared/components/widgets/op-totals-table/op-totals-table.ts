import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { SimpleTable } from '../../table/simple-table/simple-table';
import { OrderToBeOutboundDetail } from '../../../../models/integration/order-to-be-outbound';

type TimeForm = FormGroup<{ h: FormControl<number | null>; m: FormControl<number | null> }>;

// Al menos uno de los dos campos debe tener valor (el otro cuenta como 0).
function timeRequired(group: AbstractControl): ValidationErrors | null {
  const { h, m } = group.value;
  return h == null && m == null ? { timeRequired: true } : null;
}

@Component({
  selector: 'app-op-totals-table',
  imports: [ReactiveFormsModule, SimpleTable],
  templateUrl: './op-totals-table.html',
  styleUrl: './op-totals-table.css',
})
export class OpTotalsTable {
  @Input() detail: OrderToBeOutboundDetail[] = [];
  // Horas decimales por op_rowid. El padre las guarda y las vuelve a pasar,
  // así varias instancias de la tabla muestran los mismos valores. Vacío = inválido.
  @Input() hours: Partial<Record<number, string>> = {};
  @Output() hoursChange = new EventEmitter<Partial<Record<number, string>>>();

  // Un formulario (horas + minutos) por OP. Se conserva lo digitado porque el padre
  // solo recibe el total decimal y recomponerlo al teclear movería los valores.
  private forms: Partial<Record<number, TimeForm>> = {};

  protected timeForm(opRowid: number): TimeForm {
    return (this.forms[opRowid] ??= this.createForm(opRowid));
  }

  // Marca como tocados los campos de todas las OP (para mostrar sus errores) y
  // dice si el tiempo de todas es válido.
  validate(): boolean {
    this.detail.forEach((item) => this.timeForm(item.op_rowid).markAllAsTouched());
    return this.detail.every((item) => this.timeForm(item.op_rowid).valid);
  }

  protected showError(form: TimeForm): boolean {
    return form.invalid && (form.touched || form.dirty);
  }

  protected errorMessage(form: TimeForm): string {
    const { h, m } = form.controls;
    if (h.hasError('min') || m.hasError('min')) return 'No puede ser negativo.';
    if (m.hasError('max')) return 'Los minutos deben ser de 0 a 59.';
    return 'Ingrese horas o minutos.';
  }

  private createForm(opRowid: number): TimeForm {
    const minutes = this.initialMinutes(opRowid);
    const form: TimeForm = new FormGroup(
      {
        h: new FormControl<number | null>(minutes == null ? null : Math.floor(minutes / 60), [Validators.min(0)]),
        m: new FormControl<number | null>(minutes == null ? null : minutes % 60, [Validators.min(0), Validators.max(59)]),
      },
      { validators: timeRequired },
    );
    form.valueChanges.subscribe(() => this.emitTotal(opRowid, form));
    return form;
  }

  private initialMinutes(opRowid: number): number | null {
    const raw = this.hours[opRowid];
    if (!raw?.trim() || isNaN(Number(raw))) return null;
    return Math.round(Number(raw) * 60);
  }

  // Inválido (vacío, negativo o minutos > 59) se envía vacío: el padre lo trata como faltante.
  private emitTotal(opRowid: number, form: TimeForm): void {
    const { h, m } = form.getRawValue();
    const total = form.valid ? String(Math.round(((h ?? 0) + (m ?? 0) / 60) * 100) / 100) : '';
    this.hoursChange.emit({ ...this.hours, [opRowid]: total });
  }
}
