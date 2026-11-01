import { Component, inject } from '@angular/core';
import { StampingRecordService } from '../../../../../services/stamping/stamping-record-service';
import { BaseRecordForm, COMPLETED, END, Group, ORDERED, RECORD_FORM_IMPORTS, START, TEP } from './base-record-form';

// Edit form of an estampación record.
@Component({
  selector: 'app-stamping-record-form',
  imports: RECORD_FORM_IMPORTS,
  templateUrl: './base-record-form.html',
})
export class StampingRecordForm extends BaseRecordForm {
  protected service = inject(StampingRecordService);

  protected groups: Group[] = [
    { legend: 'Tiempos', fields: [START, END] },
    { legend: 'Cantidades', fields: [ORDERED, COMPLETED] },
    TEP,
  ];

  protected get summary(): string {
    const d = this.data;
    return `${d['op_type'] ?? ''} ${d['op_number'] ?? ''} · ${d['stamping_reference']?.reference_code ?? 'Sin referencia'}`;
  }
}
