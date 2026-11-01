import { Component, inject } from '@angular/core';
import { WorkBreakRecordService } from '../../../../../services/production/work-break-record-service';
import { BaseRecordForm, END, Group, RECORD_FORM_IMPORTS, START } from './base-record-form';

// Fields shared by pausas and paros (both have a name and a free-text reason).
export const BREAK_GROUPS: Group[] = [
  { legend: 'Tiempos', fields: [START, END, { name: 'resumed_at', label: 'Reanudado el', type: 'datetime' }] },
  {
    legend: 'Motivo',
    fields: [
      { name: 'name', label: 'Nombre', type: 'text' },
      { name: 'custom_reason', label: 'Motivo personalizado', type: 'textarea' },
    ],
  },
];

// Edit form of a pausa (work break record).
@Component({
  selector: 'app-break-record-form',
  imports: RECORD_FORM_IMPORTS,
  templateUrl: './base-record-form.html',
})
export class BreakRecordForm extends BaseRecordForm {
  protected service = inject(WorkBreakRecordService);
  protected groups = BREAK_GROUPS;

  protected get summary(): string {
    return `Pausa #${this.data['id']}`;
  }
}
