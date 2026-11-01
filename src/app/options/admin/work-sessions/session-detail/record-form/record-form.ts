import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '../../../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../../shared/elements/ui-input/ui-input';
import { UiDecimalInput } from '../../../../../shared/elements/ui-decimal-input/ui-decimal-input';
import { UiTextarea } from '../../../../../shared/elements/ui-textarea/ui-textarea';
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
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiDecimalInput, UiTextarea, UiCheckbox],
  templateUrl: './record-form.html',
})
export class RecordForm implements OnInit {
  @Input({ required: true }) kind!: RecordKind;
  @Input({ required: true }) data!: Record<string, any>;
  @Output() saved = new EventEmitter<void>();

  protected groups: Group[] = [];
  protected form = new FormGroup({});

  // Read-only context so the user knows which record is open.
  protected get summary(): string {
    const d = this.data;
    if (this.kind === 'production') return `OP ${d['op_type'] ?? ''} ${d['op_number'] ?? ''} · ${d['sku']?.description ?? 'Sin SKU'}`;
    if (this.kind === 'stamping') return `OP ${d['op_type'] ?? ''} ${d['op_number'] ?? ''} · ${d['stamping_reference']?.reference_code ?? 'Sin referencia'}`;
    return `Pausa #${d['id']}`;
  }

  ngOnInit(): void {
    this.groups = GROUPS[this.kind];
    for (const f of this.groups.flatMap((g) => g.fields)) {
      const v = this.data[f.name];
      const value = f.type === 'datetime' && v ? formatDate(v, DATETIME, 'en-US') : (v ?? (f.type === 'switch' ? false : null));
      const required = f.name === 'start_time' ? [Validators.required] : f.type === 'decimal' ? [Validators.min(0)] : [];
      this.form.addControl(f.name, new FormControl({ value, disabled: !!f.readonly }, required));
    }
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) this.saved.emit();
  }
}
