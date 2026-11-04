import { Component, computed, inject, input, model, OnInit, output, signal } from '@angular/core';
import { erpIntegrableMax } from '../../../../../../../common/functions/erp-integration';
import { opSecondsPerUnit } from '../../../../../../../common/functions/tep-time';
import { AppConfigService } from '../../../../../../../services/core/app-config-service';
import { IntegrationReferenceSam, WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { IntegrationErpStatus } from '../../../components/integration-erp-status/integration-erp-status';
import { IntegrationQuantityInput } from '../../../components/integration-quantity-input/integration-quantity-input';
import { IntegrationTimeInputs, SelectionSummary } from '../../../components/integration-time-inputs/integration-time-inputs';

// Estampación view detail (origin_id = 2): the shared ERP status section (detail.totals = stamped divided by
// stamping_factor gives the quantity to integrate) and the shared single-quantity input, the same one Confección
// uses (Estampación has no size matrix). Any valid quantity selects every SAM of the OP; the quantity typed
// is what gets integrated (the backend picks the records up to it). Same contract as the Confección matrix
// (selection model + selectionSummary output).
@Component({
  selector: 'app-document-integration-stamping',
  imports: [IntegrationErpStatus, IntegrationQuantityInput, IntegrationTimeInputs],
  templateUrl: './document-integration-stamping.html',
})
export class DocumentIntegrationStamping implements OnInit {
  readonly document = input.required<WorkCenterDocument>();
  // id of the SAMs picked by the user (all of them once a quantity is typed); two-way bindable.
  readonly selectedSamIds = model<number[]>([]);
  // Quantity the OP had typed before the accordion was collapsed (restored when it reopens).
  readonly initialUnits = input(0);
  // Units and time of the selection; emitted when the selection or the time inputs change.
  readonly selectionSummary = output<SelectionSummary>();
  // The user tried to integrate: the time inputs show their errors.
  readonly submitted = input(false);

  protected readonly sams = computed<IntegrationReferenceSam[]>(() => this.document().detail?.referenceSams ?? []);
  protected readonly totals = computed(() => this.document().detail?.totals ?? null);

  // The quantity typed (once it is valid); the time is calculated from it.
  protected readonly typedUnits = signal(0);

  // Units of the selection, for the time inputs.
  protected readonly selectedUnits = computed(() => (this.selectedSamIds().length ? this.typedUnits() : 0));

  // TEP_TIME_CALCULATION_MODE: how the time of the integration is preloaded (same as Confección).
  protected readonly useRecordedTime = inject(AppConfigService).tepTimeUsesRecordedTime;

  protected readonly secondsPerUnit = computed(() => opSecondsPerUnit(this.document()));

  // Quantity already completed in the ERP.
  protected readonly erpExecutionQty = computed(() => Number(this.document().erp_completed_quantity ?? 0));

  // "Por integrar" of the OP: the ERP limit, the same rule as Confección (erpIntegrableMax); the stamped
  // quantity not yet completed in the ERP (stamped - erp completed) only when the ERP sends no quantities.
  protected readonly toIntegrateQty = computed(() =>
    erpIntegrableMax(this.document(), Math.max(Number(this.totals()?.stamped_qty ?? 0) - this.erpExecutionQty(), 0)),
  );

  // Coming back to an OP with a quantity already typed (accordion re-expanded): show it again.
  ngOnInit(): void {
    if (this.initialUnits() > 0) this.typedUnits.set(this.initialUnits());
  }

  // Quantity typed in the shared input (null = empty or invalid): picks every SAM of the OP, or clears the selection.
  protected applyQuantity(quantity: number | null): void {
    this.typedUnits.set(quantity ?? 0);
    this.selectedSamIds.set(quantity === null ? [] : this.sams().map((sam) => sam.id));
  }
}
