import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { WorkCenterDocument } from '../../../../../../models/integration/order-by-work-center';
import { UiBadge } from '../../../../../elements/ui-badge/ui-badge';

// "Estado en ERP" section shared by the Confección and Estampación integration views: the ERP operation state
// and the executed / completed quantities. Whatever is projected (e.g. the integration-mode menu) goes at the end.
@Component({
  selector: 'app-integration-erp-status',
  imports: [DecimalPipe, UiBadge],
  templateUrl: './integration-erp-status.html',
})
export class IntegrationErpStatus {
  readonly document = input.required<WorkCenterDocument>();

  // ERP operation state: the API can send 0 / 1 / true / false (typed as number); null or undefined
  // means the ERP reported nothing, so no state is shown.
  protected readonly erpCompleted = computed<boolean | null>(() => {
    const value: unknown = this.document().erp_completed_operation;
    if (value === null || value === undefined) return null;
    return value === true || value === 1 || value === '1' || value === 'true';
  });
}
