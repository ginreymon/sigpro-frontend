import { Component, Input } from '@angular/core';
import { BreakRecordTemplate } from './break-record-template';
import { DowntimeRecordTemplate } from './downtime-record-template';
import { ProductionRecordTemplate } from './production-record-template';
import { StampingRecordTemplate } from './stamping-record-template';

export type EditableKind = 'production' | 'stamping' | 'break' | 'downtime';
export interface EditTarget {
  kind: EditableKind;
  record: Record<string, any>;
}

const TITLES: Record<EditableKind, string> = {
  production: 'Confección',
  stamping: 'Estampación',
  break: 'Pausa',
  downtime: 'Paro',
};

// Picks the edit template that matches the kind of record the user clicked.
@Component({
  selector: 'app-record-edit-panel',
  imports: [ProductionRecordTemplate, StampingRecordTemplate, BreakRecordTemplate, DowntimeRecordTemplate],
  template: `
    <h4 class="text-xl font-semibold text-gray-700 mb-3">Editar {{ title.toLowerCase() }} #{{ target.record['id'] }}</h4>
    @switch (target.kind) {
      @case ('production') { <app-production-record-template [record]="target.record" /> }
      @case ('stamping') { <app-stamping-record-template [record]="target.record" /> }
      @case ('break') { <app-break-record-template [record]="target.record" /> }
      @case ('downtime') { <app-downtime-record-template [record]="target.record" /> }
    }
  `,
})
export class RecordEditPanel {
  @Input({ required: true }) target!: EditTarget;

  protected get title() {
    return TITLES[this.target.kind];
  }
}
