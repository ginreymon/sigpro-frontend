import { Component, inject, Input } from '@angular/core';
import { EditorField, RecordEditor } from '../record-editor/record-editor';
import { WorkBreakRecordService } from '../../../../services/production/work-break-record-service';

const FIELDS: EditorField[] = [
  { key: 'start_time', label: 'Inicio', type: 'datetime' },
  { key: 'end_time', label: 'Fin', type: 'datetime' },
];

// Edit template for one break of a work session activity.
@Component({
  selector: 'app-break-record-template',
  imports: [RecordEditor],
  template: `<app-record-editor [fields]="fields" [record]="record" [save]="save"></app-record-editor>`,
})
export class BreakRecordTemplate {
  private service = inject(WorkBreakRecordService);

  @Input({ required: true }) record!: Record<string, any>;

  protected readonly fields = FIELDS;
  protected readonly save = (payload: Record<string, any>) => this.service.patch(this.record['id'], payload);
}
