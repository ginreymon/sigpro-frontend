import { DecimalPipe } from '@angular/common';
import { Component, computed, input, model, output } from '@angular/core';
import { IntegrationReferenceSam, WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { CELL_SELECTED_CLASSES } from '../../../components/integration-cell-style';
import { IntegrationTimeInputs, SelectionSummary } from '../../../components/integration-time-inputs/integration-time-inputs';
import { SAM_STATE_CLASSES, SAM_STATE_LABELS, SamIntegrationState } from '../stamping-integration-state';

// Estampación view detail (origin_id = 2): the whole OP as one selector cell with the totals computed by the
// database (detail.totals = stamped / pending / total divided by stamping_factor). Picking the cell
// selects every SAM of the OP; same contract as the Confección matrix (selection model + selectionSummary output).
@Component({
  selector: 'app-document-integration-stamping',
  imports: [DecimalPipe, IntegrationTimeInputs],
  templateUrl: './document-integration-stamping.html',
})
export class DocumentIntegrationStamping {
  readonly document = input.required<WorkCenterDocument>();
  // id of the SAMs picked by the user (all of them when the OP is picked); two-way bindable.
  readonly selectedSamIds = model<number[]>([]);
  // Units and time of the selection; emitted when the selection or the time inputs change.
  readonly selectionSummary = output<SelectionSummary>();
  // The user tried to integrate: the time inputs show their errors.
  readonly submitted = input(false);

  protected readonly sams = computed<IntegrationReferenceSam[]>(() => this.document().detail?.referenceSams ?? []);
  protected readonly totals = computed(() => this.document().detail?.totals ?? null);

  // The OP is a selector that can be picked only if there is something to integrate (stamped - erp completed > 0)
  // and the ERP quantity to execute is covered: erp_execution <= erp_completed + (stamped - erp_completed).
  protected readonly isSelectable = computed(
    () => this.toIntegrateQty() > 0 && this.erpExecutionLimit() <= this.erpExecutionQty() + this.toIntegrateQty(),
  );

  // Picked when every SAM of the OP is in the selection.
  protected readonly isSelected = computed(
    () => this.isSelectable() && this.sams().every((sam) => this.selectedSamIds().includes(sam.id)),
  );

  // Units of the OP to integrate once picked (stamped - erp completed), for the time inputs.
  protected readonly selectedUnits = computed(() => (this.isSelected() ? this.toIntegrateQty() : 0));

  // Seconds per unit of the OP: seconds_by_unit plus additional_seconds_by_unit (either may be null).
  protected readonly secondsPerUnit = computed(
    () => Number(this.document().seconds_by_unit ?? 0) + Number(this.document().additional_seconds_by_unit ?? 0),
  );

  // "Por hacer" goes negative in the database when more than ordered was stamped; never shown below 0.
  protected readonly pendingQty = computed(() => Math.max(Number(this.totals()?.pending_qty ?? 0), 0));

  // Quantity already completed in the ERP.
  protected readonly erpExecutionQty = computed(() => Number(this.document().erp_completed_quantity ?? 0));

  // Quantity the ERP expects to execute for the OP ("A ejecutar").
  private readonly erpExecutionLimit = computed(() => Number(this.document().erp_execution_quantity ?? 0));

  // Stamped quantity not yet completed in the ERP (stamped - erp completed); the OP block shows only if > 0.
  protected readonly toIntegrateQty = computed(() =>
    Math.max(Number(this.totals()?.stamped_qty ?? 0) - this.erpExecutionQty(), 0),
  );

  private readonly displayState = computed<SamIntegrationState>(() => (this.isSelectable() ? 'ready' : 'none'));

  protected readonly blockClasses = computed(() =>
    this.isSelected() ? CELL_SELECTED_CLASSES : SAM_STATE_CLASSES[this.displayState()],
  );

  // Same tooltip format as the Confección cells: state, stamped and ordered units.
  protected readonly tooltip = computed(
    () => `${SAM_STATE_LABELS[this.displayState()]} · estampado ${this.totals()?.stamped_qty ?? 0} / ordenado ${this.totals()?.total_qty ?? 0}`,
  );

  // Picks (or clears) the whole OP: every SAM of the OP goes in or out of the selection.
  protected toggleOp(): void {
    if (!this.isSelectable()) return;
    this.selectedSamIds.set(this.isSelected() ? [] : this.sams().map((sam) => sam.id));
  }
}
