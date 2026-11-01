import { Component, inject, Input } from '@angular/core';
import { EditorField, RecordEditor } from '../record-editor/record-editor';
import { ModuleDowntimeService } from '../../../../services/production/module-downtime-service';

const FIELDS: EditorField[] = [
  { key: 'start_time', label: 'Inicio', type: 'datetime' },
  { key: 'end_time', label: 'Fin', type: 'datetime' },
];

// Edit template for one downtime of a work session activity.
@Component({
  selector: 'app-downtime-record-template',
  imports: [RecordEditor],
  template: `<app-record-editor [fields]="fields" [record]="record" [save]="save"></app-record-editor>`,
})
export class DowntimeRecordTemplate {
  private service = inject(ModuleDowntimeService);

  @Input({ required: true }) record!: Record<string, any>;

  protected readonly fields = FIELDS;
  protected readonly save = (payload: Record<string, any>) => this.service.patch(this.record['id'], payload);
}
