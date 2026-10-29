import { Component, computed, input, model, output } from '@angular/core';
import { WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { ProductionOrder } from '../../../../../../../models/production/production-order';
import { SkuDetail } from '../../../../../../../models/production/sku-detail';
import { buildColorSizeMatrix } from '../../../../../../components/production/tables/production-orders-table/color-size-matrix';
import { isRealSku, pendingRecords, quantityToIntegrate, skuCellState } from '../integration-state';
import {
  CELL_SELECTED_CLASSES,
  CELL_SELECTED_PARTIAL_CLASSES,
  CELL_STATE_CLASSES,
  CELL_STATE_LABELS,
  SkuCellState,
} from '../../../components/integration-cell-style';
import { IntegrationTimeInputs, SelectionSummary } from '../../../components/integration-time-inputs/integration-time-inputs';

// Confección view detail (origin_id = 1): color x size grid of the OP where every SKU shows
// whether it was already integrated, is ready to be integrated (selectable) or is still being
// produced. Same pivot as ProductionOrdersTable (buildColorSizeMatrix).
@Component({
  selector: 'app-document-integration-matrix',
  imports: [IntegrationTimeInputs],
  templateUrl: './document-integration-matrix.html',
})
export class DocumentIntegrationMatrix {
  readonly document = input.required<WorkCenterDocument>();
  // skuRowId of the SKUs picked by the user; two-way bindable so a parent can use it as a multi-select.
  readonly selectedSkuIds = model<number[]>([]);
  // Units and time of the selection; emitted when the selection or the time inputs change.
  readonly selectionSummary = output<SelectionSummary>();
  // The user tried to integrate: the time inputs show their errors.
  readonly submitted = input(false);
  // Display only (e.g. the detail of a sent submission): no cell can be picked and nothing is integrated.
  readonly readOnly = input(false);

  // `open` and `complete` are not listed in the legend; their cells keep their own look.
  protected readonly legend = (Object.keys(CELL_STATE_LABELS) as SkuCellState[])
    .filter((state) => state !== 'open' && state !== 'complete')
    .map((state) => ({
      state,
      label: CELL_STATE_LABELS[state],
      classes: CELL_STATE_CLASSES[state],
    }));

  protected readonly matrix = computed(() => {
    const colorRows = this.document().detail?.colorRows;
    return colorRows?.length ? buildColorSizeMatrix({ colorRows } as ProductionOrder) : null;
  });

  protected readonly counts = computed(() => {
    const counts: Record<SkuCellState, number> = { integrated: 0, ready: 0, complete: 0, open: 0, partial: 0, warning: 0, none: 0 };
    (this.matrix()?.skuColors ?? []).forEach((row) =>
      row.skus.filter((sku) => this.isRealSku(sku)).forEach((sku) => counts[this.state(sku)]++),
    );
    return counts;
  });

  // skuRowId of every selectable cell, by state (ready / partial).
  private selectableIds(state: SkuCellState): number[] {
    return (this.matrix()?.skuColors ?? [])
      .flatMap((row) => row.skus)
      .filter((sku) => this.isRealSku(sku) && this.state(sku) === state && this.isSelectable(sku))
      .map((sku) => sku.skuRowId);
  }

  // Cells of this matrix the user picked.
  protected readonly selectedSkus = computed(() =>
    (this.matrix()?.skuColors ?? [])
      .flatMap((row) => row.skus)
      .filter((sku) => this.isRealSku(sku) && this.selectedSkuIds().includes(sku.skuRowId)),
  );

  protected readonly selectedUnits = computed(() =>
    this.selectedSkus().reduce((sum, sku) => sum + quantityToIntegrate(sku), 0),
  );

  // Seconds per unit of the OP: seconds_by_unit plus additional_seconds_by_unit (either may be null).
  protected readonly secondsPerUnit = computed(
    () => Number(this.document().seconds_by_unit ?? 0) + Number(this.document().additional_seconds_by_unit ?? 0),
  );

  protected readonly isRealSku = isRealSku;
  protected readonly state = skuCellState;

  protected isSelected(sku: SkuDetail): boolean {
    return this.selectedSkuIds().includes(sku.skuRowId);
  }

  // Only cells with a quantity left to integrate can be picked: ready (completes the SKU) or partial
  // (integrates what is recorded, the SKU stays incomplete). The SKU must list records.
  protected isSelectable(sku: SkuDetail): boolean {
    if (this.readOnly() || !sku.records?.length || quantityToIntegrate(sku) <= 0) return false;
    const state = this.state(sku);
    return state === 'ready' || state === 'partial';
  }

  protected toggleSelected(sku: SkuDetail): void {
    if (!this.isSelectable(sku)) return;
    this.selectedSkuIds.update((ids) =>
      ids.includes(sku.skuRowId) ? ids.filter((id) => id !== sku.skuRowId) : [...ids, sku.skuRowId],
    );
  }

  // Legend chips "Por integrar" / "Parcial": select every selectable cell of that state, or clear
  // them when all are already selected.
  protected toggleAllSelectable(state: SkuCellState): void {
    const selectable = this.selectableIds(state);
    const allSelected = selectable.every((id) => this.selectedSkuIds().includes(id));
    this.selectedSkuIds.update((ids) =>
      allSelected ? ids.filter((id) => !selectable.includes(id)) : [...new Set([...ids, ...selectable])],
    );
  }

  protected isBulkSelectState(state: SkuCellState): boolean {
    return state === 'ready' || state === 'partial';
  }

  protected cellClasses(sku: SkuDetail): string {
    if (!this.isSelectable(sku)) return CELL_STATE_CLASSES[this.state(sku)];
    if (!this.isSelected(sku)) return `${CELL_STATE_CLASSES[this.state(sku)]} cursor-pointer`;
    return this.state(sku) === 'partial' ? CELL_SELECTED_PARTIAL_CLASSES : CELL_SELECTED_CLASSES;
  }

  // Quantity the cell adds to the next integration (never negative).
  protected toIntegrateQty(sku: SkuDetail): number {
    return Math.max(0, quantityToIntegrate(sku));
  }

  protected tooltip(sku: SkuDetail): string {
    if (!this.isRealSku(sku)) return '';
    const base = `${CELL_STATE_LABELS[this.state(sku)]} · por integrar ${this.toIntegrateQty(sku)} / ordenado ${sku.orderedQty}`;
    const pending = pendingRecords(sku).map((record) => record.id);
    return pending.length ? `${base} · registros por integrar: ${pending.join(', ')}` : base;
  }
}
