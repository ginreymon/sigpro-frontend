import { DecimalPipe } from '@angular/common';
import { Component, computed, input, model, output } from '@angular/core';
import { IntegrationReferenceSam, WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { CELL_SELECTED_CLASSES } from '../../production/integration-state';
import { IntegrationTimeInputs, SelectionSummary } from '../../../components/integration-time-inputs/integration-time-inputs';
import {
  pendingSamUnits,
  SAM_STATE_CLASSES,
  SAM_STATE_LABELS,
  SamIntegrationState,
  samIntegrationState,
} from '../stamping-integration-state';

// Estampación view detail (origin_id = 2): the whole OP as one block with the totals computed by the
// database (detail.totals = stamped / pending / total divided by stamping_factor). Picking the block
// selects every SAM of the OP that still has records to integrate; same contract as the Confección
// matrix (selection model + selectionSummary output).
@Component({
  selector: 'app-document-integration-stamping',
  imports: [DecimalPipe, IntegrationTimeInputs],
  templateUrl: './document-integration-stamping.html',
})
export class DocumentIntegrationStamping {
  readonly document = input.required<WorkCenterDocument>();
  // id of the SAMs picked by the user (all the ready ones when the OP is picked); two-way bindable.
  readonly selectedSamIds = model<number[]>([]);
  // Units and time of the selection; emitted when the selection or the time inputs change.
  readonly selectionSummary = output<SelectionSummary>();

  protected readonly sams = computed<IntegrationReferenceSam[]>(() => this.document().detail?.referenceSams ?? []);
  protected readonly totals = computed(() => this.document().detail?.totals ?? null);
  protected readonly factor = computed(() => this.document().detail?.stamping_factor ?? null);

  // SAMs with records still to be integrated.
  private readonly readySams = computed(() => this.sams().filter((sam) => samIntegrationState(sam) === 'ready'));

  // State of the OP: ready if any SAM can be integrated, integrated if all the SAMs with records were.
  protected readonly state = computed<SamIntegrationState>(() => {
    if (this.readySams().length) return 'ready';
    return this.sams().some((sam) => samIntegrationState(sam) === 'integrated') ? 'integrated' : 'none';
  });
  protected readonly stateLabel = computed(() => SAM_STATE_LABELS[this.state()]);

  protected readonly isSelectable = computed(() => this.state() === 'ready');

  protected readonly isSelected = computed(
    () => this.isSelectable() && this.readySams().every((sam) => this.selectedSamIds().includes(sam.id)),
  );

  // Units that would be integrated by picking the OP.
  protected readonly pendingUnits = computed(() => this.readySams().reduce((sum, sam) => sum + pendingSamUnits(sam), 0));

  // Units of the picked SAMs, for the time inputs.
  protected readonly selectedUnits = computed(() =>
    this.readySams()
      .filter((sam) => this.selectedSamIds().includes(sam.id))
      .reduce((sum, sam) => sum + pendingSamUnits(sam), 0),
  );

  // Seconds per unit of the OP: seconds_by_unit plus additional_seconds_by_unit (either may be null).
  protected readonly secondsPerUnit = computed(
    () => Number(this.document().seconds_by_unit ?? 0) + Number(this.document().additional_seconds_by_unit ?? 0),
  );

  // "Por hacer" goes negative in the database when more than ordered was stamped; never shown below 0.
  protected readonly pendingQty = computed(() => Math.max(Number(this.totals()?.pending_qty ?? 0), 0));

  // Stamped share of the total, 0-100 (the bar and the percentage of the card).
  protected readonly progress = computed(() => {
    const t = this.totals();
    return t && Number(t.total_qty) > 0 ? Math.min(Math.max((Number(t.stamped_qty) / Number(t.total_qty)) * 100, 0), 100) : 0;
  });

  protected readonly blockClasses = computed(() =>
    this.isSelected() ? CELL_SELECTED_CLASSES : SAM_STATE_CLASSES[this.state()],
  );

  // Picks (or clears) the whole OP: every SAM with records to integrate.
  protected toggleOp(): void {
    if (!this.isSelectable()) return;
    this.selectedSamIds.set(this.isSelected() ? [] : this.readySams().map((sam) => sam.id));
  }
}
