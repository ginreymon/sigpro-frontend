import { DecimalPipe } from '@angular/common';
import { Component, computed, input, model, output } from '@angular/core';
import { IntegrationReferenceSam, WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { CELL_SELECTED_CLASSES } from '../../production/integration-state';
import { IntegrationTimeInputs, SelectionSummary } from '../../../components/integration-time-inputs/integration-time-inputs';
import {
  pendingSamUnits,
  samOrderedQty,
  samPendingQty,
  SAM_STATE_CLASSES,
  SAM_STATE_LABELS,
  SamIntegrationState,
  samIntegrationState,
} from '../stamping-integration-state';

// Estampación view detail (origin_id = 2): one card per candidate SAM of the OP with its stamped /
// pending quantities and its stamping records. A SAM with records still to be integrated can be
// picked; same contract as the Confección matrix (selection model + selectionSummary output).
@Component({
  selector: 'app-document-integration-stamping',
  imports: [DecimalPipe, IntegrationTimeInputs],
  templateUrl: './document-integration-stamping.html',
})
export class DocumentIntegrationStamping {
  readonly document = input.required<WorkCenterDocument>();
  // id of the SAMs picked by the user; two-way bindable so a parent can use it as a multi-select.
  readonly selectedSamIds = model<number[]>([]);
  // Units and time of the selection; emitted when the selection or the time inputs change.
  readonly selectionSummary = output<SelectionSummary>();

  protected readonly samStates = Object.keys(SAM_STATE_LABELS) as SamIntegrationState[];
  protected readonly stateLabels = SAM_STATE_LABELS;
  protected readonly stateClasses = SAM_STATE_CLASSES;
  protected readonly selectedClasses = CELL_SELECTED_CLASSES;
  protected readonly state = samIntegrationState;
  protected readonly pendingUnits = pendingSamUnits;
  protected readonly orderedQty = samOrderedQty;
  protected readonly pendingQty = samPendingQty;

  protected readonly sams = computed<IntegrationReferenceSam[]>(() => this.document().detail?.referenceSams ?? []);

  protected readonly counts = computed(() => {
    const counts: Record<SamIntegrationState, number> = { integrated: 0, ready: 0, none: 0 };
    this.sams().forEach((sam) => counts[this.state(sam)]++);
    return counts;
  });

  private readonly readyIds = computed(() => this.sams().filter((sam) => this.isSelectable(sam)).map((sam) => sam.id));

  protected readonly selectedSams = computed(() => this.sams().filter((sam) => this.selectedSamIds().includes(sam.id)));

  protected readonly selectedUnits = computed(() =>
    this.selectedSams().reduce((sum, sam) => sum + this.pendingUnits(sam), 0),
  );

  // Seconds per unit of the OP: seconds_by_unit plus additional_seconds_by_unit (either may be null).
  protected readonly secondsPerUnit = computed(
    () => Number(this.document().seconds_by_unit ?? 0) + Number(this.document().additional_seconds_by_unit ?? 0),
  );

  protected isSelected(sam: IntegrationReferenceSam): boolean {
    return this.selectedSamIds().includes(sam.id);
  }

  // Only SAMs with records still to be integrated can be picked.
  protected isSelectable(sam: IntegrationReferenceSam): boolean {
    return this.state(sam) === 'ready';
  }

  protected toggleSelected(sam: IntegrationReferenceSam): void {
    if (!this.isSelectable(sam)) return;
    this.selectedSamIds.update((ids) => (ids.includes(sam.id) ? ids.filter((id) => id !== sam.id) : [...ids, sam.id]));
  }

  // Legend chip "Por integrar": selects every ready SAM, or clears them when all are already selected.
  protected toggleAllReady(): void {
    const ready = this.readyIds();
    const allSelected = ready.every((id) => this.selectedSamIds().includes(id));
    this.selectedSamIds.update((ids) =>
      allSelected ? ids.filter((id) => !ready.includes(id)) : [...new Set([...ids, ...ready])],
    );
  }

  protected cardClasses(sam: IntegrationReferenceSam): string {
    return this.isSelectable(sam) && this.isSelected(sam) ? this.selectedClasses : this.stateClasses[this.state(sam)];
  }
}
