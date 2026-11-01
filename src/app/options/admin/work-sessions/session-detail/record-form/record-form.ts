import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SessionWindow } from '../../../../../common/functions/record-time-validators';
import { RecordKind } from './base-record-form';
import { ProductionRecordForm } from './production-record-form';
import { StampingRecordForm } from './stamping-record-form';
import { BreakRecordForm } from './break-record-form';
import { DowntimeRecordForm } from './downtime-record-form';

export type { RecordKind } from './base-record-form';

// Picks the edit form that matches the kind of record chosen in the session accordion.
@Component({
  selector: 'app-record-form',
  imports: [ProductionRecordForm, StampingRecordForm, BreakRecordForm, DowntimeRecordForm],
  templateUrl: './record-form.html',
})
export class RecordForm {
  @Input({ required: true }) kind!: RecordKind;
  @Input({ required: true }) data!: Record<string, any>;
  @Input() session: SessionWindow | null = null;
  @Output() saved = new EventEmitter<void>();
}
