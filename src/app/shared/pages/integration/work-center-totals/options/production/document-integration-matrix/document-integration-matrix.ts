import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, model, output, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { ProductionOrder } from '../../../../../../../models/production/production-order';
import { SkuDetail } from '../../../../../../../models/production/sku-detail';
import { UiHourInput } from '../../../../../../elements/ui-hour-input/ui-hour-input';
import { buildColorSizeMatrix } from '../../../../../../components/production/tables/production-orders-table/color-size-matrix';
import {
  CELL_SELECTED_CLASSES,
  CELL_STATE_CLASSES,
  CELL_STATE_LABELS,
  isRealSku,
  pendingRecords,
  producedUnits,
  skuCellState,
  SkuCellState,
} from '../integration-state';

// Units and time (as shown in the inputs) of the SKUs picked in one OP.
export interface SelectionSummary {
  units: number;
  hours: number;
  minutes: number;
}

// Confección view detail (origin_id = 1): color x size grid of the OP where every SKU shows
// whether it was already integrated, is ready to be integrated (selectable) or is still being
// produced. Same pivot as ProductionOrdersTable (buildColorSizeMatrix).
@Component({
  selector: 'app-document-integration-matrix',
  imports: [DecimalPipe, ReactiveFormsModule, UiHourInput],
  templateUrl: './document-integration-matrix.html',
})
export class DocumentIntegrationMatrix {
  readonly document = input.required<WorkCenterDocument>();
  // skuRowId of the SKUs picked by the user; two-way bindable so a parent can use it as a multi-select.
  readonly selectedSkuIds = model<number[]>([]);
  // Units and time of the selection; emitted when the selection or the time inputs change.
  readonly selectionSummary = output<SelectionSummary>();

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
    const counts: Record<SkuCellState, number> = { integrated: 0, ready: 0, complete: 0, open: 0, partial: 0, none: 0 };
    (this.matrix()?.skuColors ?? []).forEach((row) =>
      row.skus.filter((sku) => this.isRealSku(sku)).forEach((sku) => counts[this.state(sku)]++),
    );
    return counts;
  });

  // skuRowId of every cell ready to integrate.
  private readonly readyIds = computed(() =>
    (this.matrix()?.skuColors ?? [])
      .flatMap((row) => row.skus)
      .filter((sku) => this.isRealSku(sku) && this.isSelectable(sku))
      .map((sku) => sku.skuRowId),
  );

  // Cells of this matrix the user picked.
  protected readonly selectedSkus = computed(() =>
    (this.matrix()?.skuColors ?? [])
      .flatMap((row) => row.skus)
      .filter((sku) => this.isRealSku(sku) && this.selectedSkuIds().includes(sku.skuRowId)),
  );

  protected readonly selectedUnits = computed(() =>
    this.selectedSkus().reduce((sum, sku) => sum + Number(sku.completedQty), 0),
  );

  // Seconds per unit of the OP: seconds_by_unit plus additional_seconds_by_unit (either may be null).
  protected readonly secondsPerUnit = computed(
    () => Number(this.document().seconds_by_unit ?? 0) + Number(this.document().additional_seconds_by_unit ?? 0),
  );

  // Completed units of the selection x seconds per unit, as hours and minutes (rounded to the minute).
  private readonly defaultTime = computed(() => {
    const totalMinutes = Math.round((this.selectedUnits() * this.secondsPerUnit()) / 60);
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  });

  // Editable time inputs; reloaded with the calculated value every time a cell is selected or deselected.
  protected readonly hoursControl = new FormControl<number | null>(0);
  protected readonly minutesControl = new FormControl<number | null>(0);

  constructor() {
    effect(() => {
      this.selectedSkuIds(); // also reload when the selection changes but the calculated time does not
      const { hours, minutes } = this.defaultTime();
      const units = this.selectedUnits();
      untracked(() => {
        this.hoursControl.setValue(hours);
        this.minutesControl.setValue(minutes);
        this.emitSummary(units);
      });
    });

    // Manual edits of the time also reach the parent.
    merge(this.hoursControl.valueChanges, this.minutesControl.valueChanges)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.emitSummary(this.selectedUnits()));
  }

  private emitSummary(units: number): void {
    this.selectionSummary.emit({
      units,
      hours: this.hoursControl.value ?? 0,
      minutes: this.minutesControl.value ?? 0,
    });
  }

  protected readonly isRealSku = isRealSku;
  protected readonly state = skuCellState;

  protected isSelected(sku: SkuDetail): boolean {
    return this.selectedSkuIds().includes(sku.skuRowId);
  }

  // Only cells ready to integrate can be picked.
  protected isSelectable(sku: SkuDetail): boolean {
    return this.state(sku) === 'ready';
  }

  protected toggleSelected(sku: SkuDetail): void {
    if (!this.isSelectable(sku)) return;
    this.selectedSkuIds.update((ids) =>
      ids.includes(sku.skuRowId) ? ids.filter((id) => id !== sku.skuRowId) : [...ids, sku.skuRowId],
    );
  }

  // Legend chip "Por integrar": selects every ready cell, or clears them when all are already selected.
  protected toggleAllReady(): void {
    const ready = this.readyIds();
    const allSelected = ready.every((id) => this.selectedSkuIds().includes(id));
    this.selectedSkuIds.update((ids) =>
      allSelected ? ids.filter((id) => !ready.includes(id)) : [...new Set([...ids, ...ready])],
    );
  }

  protected cellClasses(sku: SkuDetail): string {
    return this.isSelectable(sku) && this.isSelected(sku) ? CELL_SELECTED_CLASSES : CELL_STATE_CLASSES[this.state(sku)];
  }

  protected producedQty(sku: SkuDetail): number {
    return producedUnits(sku);
  }

  protected tooltip(sku: SkuDetail): string {
    if (!this.isRealSku(sku)) return '';
    const base = `${CELL_STATE_LABELS[this.state(sku)]} · producido ${this.producedQty(sku)} / ordenado ${sku.orderedQty}`;
    const pending = pendingRecords(sku).map((record) => record.id);
    return pending.length ? `${base} · registros por integrar: ${pending.join(', ')}` : base;
  }
}
