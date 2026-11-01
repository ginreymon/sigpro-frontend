import { Component, inject } from '@angular/core';
import { ModuleDowntimeService } from '../../../../../services/production/module-downtime-service';
import { BaseRecordForm, RECORD_FORM_IMPORTS } from './base-record-form';
import { BREAK_GROUPS } from './break-record-form';

// Edit form of a paro (module downtime).
@Component({
  selector: 'app-downtime-record-form',
  imports: RECORD_FORM_IMPORTS,
  templateUrl: './base-record-form.html',
})
export class DowntimeRecordForm extends BaseRecordForm {
  protected service = inject(ModuleDowntimeService);
  protected groups = BREAK_GROUPS;

  protected get summary(): string {
    return `Paro #${this.data['id']}`;
  }

  // A downtime created by a manual-duration batch stores {"record_ids": [...]} in custom_reason
  // (object, or its JSON text) instead of free text: those ids are shown in a disclosure.
  protected override afterInit(): void {
    this.recordIds = this.batchRecordIds(this.data['custom_reason']);
    if (this.recordIds) this.form.get('custom_reason')?.setValue(null);
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
}
