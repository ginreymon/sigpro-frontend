import { DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { UiBadge } from '../../../../shared/elements/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { WorkSessionExplorerRow } from '../../../../models/dashboard/work-session-explorer';
import { ProductionRecordService } from '../../../../services/production/production-record-service';
import { StampingRecordService } from '../../../../services/stamping/stamping-record-service';
import { WorkBreakRecordService } from '../../../../services/production/work-break-record-service';
import { WorkSessionActivityService } from '../../../../services/production/work-session-activity-service';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { EditorField, RecordEditor } from '../record-editor/record-editor';

const START_FIELD: EditorField = { key: 'started_at', label: 'Inicio', type: 'datetime' };
const END_FIELD: EditorField = { key: 'ended_at', label: 'Fin', type: 'datetime' };

// Detail of one work session: every nested block of the JSON, editable where the API allows it.
// Read-only on purpose: ids, audit fields, catalog objects (module, SKU, SAM), employees,
// shift snapshots and downtimes (no endpoint to edit them).
@Component({
  selector: 'app-session-detail',
  imports: [DatePipe, RecordEditor, UiBadge, UiButton],
  templateUrl: './session-detail.html',
})
export class SessionDetail {
  private sessionService = inject(WorkSessionService);
  private activityService = inject(WorkSessionActivityService);
  private productionRecordService = inject(ProductionRecordService);
  private stampingRecordService = inject(StampingRecordService);
  private breakRecordService = inject(WorkBreakRecordService);

  @Input({ required: true }) session!: WorkSessionExplorerRow;
  @Output() closed = new EventEmitter<void>();

  // An open item has no end yet: only its start is editable (setting an end would close it).
  protected readonly startOnly: EditorField[] = [START_FIELD];
  protected readonly startAndEnd: EditorField[] = [START_FIELD, END_FIELD];
  protected readonly productionFields: EditorField[] = [
    { key: 'completed_quantity', label: 'Completada', type: 'number' },
    { key: 'scrap_quantity', label: 'Desecho', type: 'number' },
    { key: 'rejected_quantity', label: 'Rechazada', type: 'number' },
  ];
  protected readonly stampingFields: EditorField[] = [
    { key: 'completed_quantity', label: 'Completada (piezas)', type: 'number' },
  ];
  protected readonly breakFields: EditorField[] = [
    { key: 'start_time', label: 'Inicio', type: 'datetime' },
    { key: 'end_time', label: 'Fin', type: 'datetime' },
  ];
  // Saving a record resets its TEP state, so processed records stay locked.
  protected readonly tepLock = 'Registro ya procesado en TEP: no se puede editar.';

  protected saveSession = (payload: Record<string, any>) =>
    this.sessionService.patch(this.session.id, payload);
  protected saveActivity = (id: number) => (payload: Record<string, any>) =>
    this.activityService.patch(id, payload);
  protected saveProduction = (id: number) => (payload: Record<string, any>) =>
    this.productionRecordService.patch(id, payload);
  protected saveStamping = (id: number) => (payload: Record<string, any>) =>
    this.stampingRecordService.patch(id, payload);
  protected saveBreak = (id: number) => (payload: Record<string, any>) =>
    this.breakRecordService.patch(id, payload);

  // The shift snapshots belong to the session but the JSON repeats them in every activity.
  protected get shifts() {
    return this.session.session_activities?.[0]?.work_shift_snapshots ?? [];
  }
}
