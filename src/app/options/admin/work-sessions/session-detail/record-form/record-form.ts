import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '../../../../../shared/elements/ui-form-field/ui-form-field';
import { UiDatePicker } from '../../../../../shared/elements/ui-date-picker/ui-date-picker';
import { UiInput } from '../../../../../shared/elements/ui-input/ui-input';
import { UiDecimalInput } from '../../../../../shared/elements/ui-decimal-input/ui-decimal-input';
import { UiTextarea } from '../../../../../shared/elements/ui-textarea/ui-textarea';
import { UiDisclosure } from '../../../../../shared/elements/ui-disclosure/ui-disclosure';
import { UiCheckbox } from '../../../../../shared/elements/ui-checkbox/ui-checkbox';

export type RecordKind = 'production' | 'stamping' | 'break';

interface Field {
  name: string;
  label: string;
  type: 'datetime' | 'decimal' | 'text' | 'textarea' | 'switch';
  readonly?: boolean;
}

interface Group {
  legend: string;
  fields: Field[];
}

const DATETIME = "yyyy-MM-dd'T'HH:mm";

const start: Field = { name: 'start_time', label: 'Hora de inicio', type: 'datetime' };
const end: Field = { name: 'end_time', label: 'Hora de fin', type: 'datetime' };
// Ordered and planned quantities come from the OP: always read-only.
const ordered: Field = { name: 'ordered_quantity', label: 'Cantidad ordenada', type: 'decimal', readonly: true };
const completed: Field = { name: 'completed_quantity', label: 'Cantidad completada', type: 'decimal' };
const tep: Group = {
  legend: 'Estado',
  fields: [{ name: 'tep_processed', label: 'Procesado en TEP', type: 'switch' }],
};

// UI only: the forms show the selected record and do not save anything yet.
const GROUPS: Record<RecordKind, Group[]> = {
  production: [
    { legend: 'Tiempos', fields: [start, end] },
    {
      legend: 'Cantidades',
      fields: [
        ordered,
        { name: 'planned_quantity', label: 'Cantidad planificada', type: 'decimal', readonly: true },
        completed,
        { name: 'scrap_quantity', label: 'Cantidad de desecho', type: 'decimal' },
        { name: 'rejected_quantity', label: 'Cantidad rechazada', type: 'decimal' },
      ],
    },
    tep,
  ],
  stamping: [
    { legend: 'Tiempos', fields: [start, end] },
    { legend: 'Cantidades', fields: [ordered, completed] },
    tep,
  ],
  break: [
    {
      legend: 'Tiempos',
      fields: [start, end, { name: 'resumed_at', label: 'Reanudado el', type: 'datetime' }],
    },
    {
      legend: 'Motivo',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text' },
        { name: 'custom_reason', label: 'Motivo personalizado', type: 'textarea' },
      ],
    },
  ],
};

// Edit form of one record picked in the session accordion (confección, estampación or pausa).
@Component({
  selector: 'app-record-form',
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiDatePicker, UiDecimalInput, UiTextarea, UiCheckbox, UiDisclosure],
  templateUrl: './record-form.html',
})
export class RecordForm implements OnInit {
  @Input({ required: true }) kind!: RecordKind;
  @Input({ required: true }) data!: Record<string, any>;
  @Output() saved = new EventEmitter<void>();

  protected groups: Group[] = [];
  protected form = new FormGroup({});
  // A downtime created by a manual-duration batch stores {"record_ids": [...]} in custom_reason
  // (object, or its JSON text) instead of free text: those ids are shown in a disclosure.
  protected recordIds: (string | number)[] | null = null;

  // Read-only context so the user knows which record is open.
  protected get summary(): string {
    const d = this.data;
    if (this.kind === 'production') return [`OP ${d['op_number'] ?? ''}`, d['sku']?.reference, d['sku']?.color, d['sku']?.size].filter(Boolean).join(' · ');
    if (this.kind === 'stamping') return `${d['op_type'] ?? ''} ${d['op_number'] ?? ''} · ${d['stamping_reference']?.reference_code ?? 'Sin referencia'}`;
    return `Pausa #${d['id']}`;
  }

  ngOnInit(): void {
    this.groups = GROUPS[this.kind];
    this.recordIds = this.batchRecordIds(this.data['custom_reason']);
    for (const f of this.groups.flatMap((g) => g.fields)) {
      const v = f.name === 'custom_reason' && this.recordIds ? null : this.data[f.name];
      const value = f.type === 'datetime' && v ? formatDate(v, DATETIME, 'en-US') : (v ?? (f.type === 'switch' ? false : null));
      const required = f.name === 'start_time' ? [Validators.required] : f.type === 'decimal' ? [Validators.min(0)] : [];
      this.form.addControl(f.name, new FormControl({ value, disabled: !!f.readonly }, required));
    }
  }

  private batchRecordIds(reason: unknown): (string | number)[] | null {
    let value = reason;
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        value = JSON.parse(value);
      } catch {
        return null; // plain text that merely starts with "{"
      }
    }
    const ids = (value as { record_ids?: unknown } | null)?.record_ids;
    return Array.isArray(ids) ? ids : null;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) this.saved.emit();
  }
}
