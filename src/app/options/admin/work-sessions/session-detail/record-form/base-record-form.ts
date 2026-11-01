import { formatDate } from '@angular/common';
import { Directive, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { endNotBeforeStartValidator, SessionWindow, withinSessionValidator } from '../../../../../common/functions/record-time-validators';
import { UiFormField } from '../../../../../shared/elements/ui-form-field/ui-form-field';
import { UiDatePicker } from '../../../../../shared/elements/ui-date-picker/ui-date-picker';
import { UiInput } from '../../../../../shared/elements/ui-input/ui-input';
import { UiDecimalInput } from '../../../../../shared/elements/ui-decimal-input/ui-decimal-input';
import { UiTextarea } from '../../../../../shared/elements/ui-textarea/ui-textarea';
import { UiDisclosure } from '../../../../../shared/elements/ui-disclosure/ui-disclosure';
import { UiErrorMessage } from '../../../../../shared/elements/ui-error-message/ui-error-message';
import { UiCheckbox } from '../../../../../shared/elements/ui-checkbox/ui-checkbox';
import { localInputToUtcIso } from '../../../../../common/functions/date-utils';
import { apiErrorDetail } from '../../../../../common/functions/api-error';
import { LoaderService } from '../../../../../services/common/loader-service';
import { BaseCrudService } from '../../../../../services/common/base-crud-service';
import { DialogService } from '../../../../../services/common/dialog-service';

export type RecordKind = 'production' | 'stamping' | 'break' | 'downtime';

export interface Field {
  name: string;
  label: string;
  type: 'datetime' | 'decimal' | 'text' | 'textarea' | 'switch';
  readonly?: boolean;
}

export interface Group {
  legend: string;
  fields: Field[];
}

export const START: Field = { name: 'start_time', label: 'Hora de inicio', type: 'datetime' };
export const END: Field = { name: 'end_time', label: 'Hora de fin', type: 'datetime' };
// Ordered and planned quantities come from the OP: always read-only.
export const ORDERED: Field = { name: 'ordered_quantity', label: 'Cantidad ordenada', type: 'decimal', readonly: true };
export const COMPLETED: Field = { name: 'completed_quantity', label: 'Cantidad completada', type: 'decimal' };
export const TEP: Group = {
  legend: 'Estado',
  fields: [{ name: 'tep_processed', label: 'Procesado en TEP', type: 'switch' }],
};

// Imports of every record form component (they all share base-record-form.html).
export const RECORD_FORM_IMPORTS = [
  ReactiveFormsModule,
  UiFormField,
  UiInput,
  UiDatePicker,
  UiDecimalInput,
  UiTextarea,
  UiCheckbox,
  UiDisclosure,
  UiErrorMessage,
];

const DATETIME = "yyyy-MM-dd'T'HH:mm";

// Common behaviour of the record edit forms (one component per kind of record): builds the reactive form
// from `groups` and saves with PATCH. Each kind sets its groups, service, summary and its own validations.
@Directive()
export abstract class BaseRecordForm implements OnInit {
  protected dialogService = inject(DialogService);
  private loader = inject(LoaderService);

  @Input({ required: true }) data!: Record<string, any>;
  // Session that contains the record: kinds with date validators check against its interval.
  @Input() session: SessionWindow | null = null;
  @Output() saved = new EventEmitter<void>();

  protected abstract groups: Group[];
  protected abstract service: BaseCrudService<any>;
  // Read-only context so the user knows which record is open.
  protected abstract get summary(): string;

  protected form = new FormGroup<Record<string, FormControl>>({});
  // Downtimes created by a manual-duration batch list their ids here (see DowntimeRecordForm).
  protected recordIds: (string | number)[] | null = null;

  protected get exceedsMax(): { max: number; total: number } | null {
    return this.form.errors?.['exceedsMax'] ?? null;
  }

  ngOnInit(): void {
    for (const f of this.groups.flatMap((g) => g.fields)) {
      const v = this.data[f.name];
      const value = f.type === 'datetime' && v ? formatDate(v, DATETIME, 'en-US') : (v ?? (f.type === 'switch' ? false : null));
      this.form.addControl(f.name, new FormControl({ value, disabled: !!f.readonly }, this.validatorsFor(f)));
    }
    this.afterInit();
    // Date inputs: inside the session that contains the record (not in the future while it is active, between
    // started_at and ended_at once it is closed) and the end time not before the start time.
    for (const name of ['start_time', 'end_time', 'resumed_at']) {
      this.form.get(name)?.addValidators(withinSessionValidator(() => this.session));
    }
    this.form.get('end_time')?.addValidators(endNotBeforeStartValidator());
    this.form.get('start_time')?.valueChanges.subscribe(() => this.form.get('end_time')?.updateValueAndValidity());
    Object.values(this.form.controls).forEach((c) => c.updateValueAndValidity({ emitEvent: false }));
  }

  protected validatorsFor(f: Field): ValidatorFn[] {
    return f.name === 'start_time' ? [Validators.required] : f.type === 'decimal' ? [Validators.min(0)] : [];
  }

  // Hook: form-level validators or extra loading once the controls exist.
  protected afterInit(): void {}

  protected canSave(): boolean {
    return this.form.valid;
  }

  // Only the editable controls (disabled ones are left out).
  protected payload(): Record<string, any> {
    return Object.fromEntries(
      Object.entries(this.form.value as Record<string, any>)
        .filter(([name]) => !(name === 'custom_reason' && this.recordIds))
        .map(([name, v]) => [name, v === '' ? null : /_time$|_at$/.test(name) && v ? localInputToUtcIso(v) : v]),
    );
  }

  // Hook: kinds that need a different request (e.g. PUT) override it.
  protected request(payload: Record<string, any>): Observable<unknown> {
    return this.service.patch(this.data['id'], payload);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (!this.canSave()) return;
    // Same flow as the other save views: loader while saving, then a toast with the result.
    this.loader.showLoader();
    this.request(this.payload()).subscribe({
      next: () => {
        this.loader.hideLoader();
        this.dialogService.openToast('Registro', 'Se actualizó correctamente.', 'check');
        this.saved.emit();
      },
      error: (err) => {
        this.loader.hideLoader();
        this.dialogService.openToast('Error', apiErrorDetail(err, 'No se pudo guardar el registro.'), 'error');
      },
    });
  }
}
