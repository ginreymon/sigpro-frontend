import { Component, inject, Input } from '@angular/core';
import { EditorField, RecordEditor } from '../record-editor/record-editor';
import { ProductionRecordService } from '../../../../services/production/production-record-service';

const FIELDS: EditorField[] = [
  { key: 'start_time', label: 'Inicio', type: 'datetime' },
  { key: 'end_time', label: 'Fin', type: 'datetime' },
  { key: 'completed_quantity', label: 'Completada', type: 'number' },
  { key: 'scrap_quantity', label: 'Desecho', type: 'number' },
  { key: 'rejected_quantity', label: 'Rechazada', type: 'number' },
];

// Edit template for one production record of a work session activity.
@Component({
  selector: 'app-production-record-template',
  imports: [RecordEditor],
  template: `<app-record-editor [fields]="fields" [record]="record" [save]="save" [lockedReason]="locked"></app-record-editor>`,
})
export class ProductionRecordTemplate {
  private service = inject(ProductionRecordService);

  @Input({ required: true }) record!: Record<string, any>;

  protected readonly fields = FIELDS;
  protected get locked(): string | null {
    return this.record['tep_processed'] ? 'Ya fue procesado en TEP: no se puede editar.' : null;
  }
  protected readonly save = (payload: Record<string, any>) => this.service.patch(this.record['id'], payload);
}
