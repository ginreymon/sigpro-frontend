import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, HostListener, inject, input, model, OnInit, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiBadge } from '../../../../../../elements/ui-badge/ui-badge';
import { UiErrorMessage } from '../../../../../../elements/ui-error-message/ui-error-message';
import { UiIcon } from '../../../../../../elements/ui-icon/ui-icon';
import { UiInput } from '../../../../../../elements/ui-input/ui-input';
import { WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { ProductionOrder } from '../../../../../../../models/production/production-order';
import { SkuDetail } from '../../../../../../../models/production/sku-detail';
import { buildColorSizeMatrix } from '../../../../../../components/production/tables/production-orders-table/color-size-matrix';
import { isRealSku, pendingRecords, pickRecordsForQuantity, quantityToIntegrate, recordUnits, skuCellState } from '../integration-state';
import {
  CELL_SELECTED_CLASSES,
  CELL_SELECTED_PARTIAL_CLASSES,
  CELL_STATE_CLASSES,
  CELL_STATE_LABELS,
  SkuCellState,
} from '../../../components/integration-cell-style';
import { IntegrationTimeInputs, SelectionSummary } from '../../../components/integration-time-inputs/integration-time-inputs';

// Integer units only (the number input also lets "e", signs and decimals through).
const WHOLE_NUMBER = /^\d+$/;

export type IntegrationMode = 'matrix' | 'single';

// Confección view detail (origin_id = 1): color x size grid of the OP where every SKU shows
// whether it was already integrated, is ready to be integrated (selectable) or is still being
// produced. Same pivot as ProductionOrdersTable (buildColorSizeMatrix).
@Component({
  selector: 'app-document-integration-matrix',
  imports: [DecimalPipe, ReactiveFormsModule, IntegrationTimeInputs, UiBadge, UiErrorMessage, UiIcon, UiInput],
  templateUrl: './document-integration-matrix.html',
})
export class DocumentIntegrationMatrix implements OnInit {
  private static nextId = 0;
  // Unique per instance: several OPs can be expanded at once.
  protected readonly uid = DocumentIntegrationMatrix.nextId++;

  readonly document = input.required<WorkCenterDocument>();
  // skuRowId of the SKUs picked by the user; two-way bindable so a parent can use it as a multi-select.
  readonly selectedSkuIds = model<number[]>([]);
  // Single-quantity mode only: ids of the exact pending records picked (null = matrix mode, where every
  // pending record of the picked SKUs goes). Two-way bindable like selectedSkuIds; the parent keeps it so
  // it survives collapsing the accordion.
  readonly selectedRecordIds = model<number[] | null>(null);
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

  // ERP operation state: the API can send 0 / 1 / true / false (typed as number); null or undefined
  // means the ERP reported nothing, so no state is shown.
  protected readonly erpCompleted = computed<boolean | null>(() => {
    const value: unknown = this.document().erp_completed_operation;
    if (value === null || value === undefined) return null;
    return value === true || value === 1 || value === '1' || value === 'true';
  });

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

  // Matrix mode: what the picked cells hold. Single mode: the units of the picked records.
  protected readonly selectedUnits = computed(() => {
    const recordIds = this.selectedRecordIds();
    if (recordIds === null) return this.selectedSkus().reduce((sum, sku) => sum + quantityToIntegrate(sku), 0);
    return this.pendingPool()
      .filter(({ record }) => recordIds.includes(record.id))
      .reduce((sum, { record }) => sum + recordUnits(record), 0);
  });

  // Reloads the calculated time whenever either selection changes.
  protected readonly timeSelection = computed(() => this.selectedRecordIds() ?? this.selectedSkuIds());

  // Pending records of every selectable cell (ready / partial), in matrix order: what single mode picks from.
  private readonly pendingPool = computed(() =>
    (this.matrix()?.skuColors ?? [])
      .flatMap((row) => row.skus)
      .filter((sku) => this.isRealSku(sku) && this.isSelectable(sku))
      .flatMap((sku) => pendingRecords(sku).map((record) => ({ skuRowId: sku.skuRowId, record }))),
  );

  protected readonly poolUnits = computed(() =>
    this.pendingPool().reduce((sum, { record }) => sum + recordUnits(record), 0),
  );

  protected readonly mode = computed<IntegrationMode>(() => (this.selectedRecordIds() === null ? 'matrix' : 'single'));
  protected readonly modes: { value: IntegrationMode; label: string }[] = [
    { value: 'matrix', label: 'Matriz por talla' },
    { value: 'single', label: 'Cantidad única' },
  ];
  protected readonly menuOpen = signal(false);

  protected readonly quantityControl = new FormControl<string | null>('');
  // Why the typed quantity cannot be integrated (null while it is valid or still empty).
  protected readonly quantityError = signal<string | null>(null);

  // Trigger + menu wrapper: a click anywhere outside it closes the menu.
  private readonly modeMenu = viewChild<ElementRef<HTMLElement>>('modeMenu');

  constructor() {
    this.quantityControl.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((value) => this.applyQuantity(value));
  }

  // Coming back to an OP already in single mode (accordion re-expanded): show its picked quantity again.
  ngOnInit(): void {
    if (this.mode() === 'single' && this.selectedUnits() > 0) {
      this.quantityControl.setValue(String(this.selectedUnits()), { emitEvent: false });
    }
  }

  @HostListener('document:click', ['$event'])
  protected closeMenuOnOutsideClick(event: Event): void {
    if (this.menuOpen() && !this.modeMenu()?.nativeElement.contains(event.target as Node)) this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected closeMenuOnEscape(): void {
    this.menuOpen.set(false);
  }

  protected setMode(mode: IntegrationMode): void {
    this.menuOpen.set(false);
    if (mode === this.mode()) return;
    this.quantityError.set(null);
    if (mode === 'single') {
      // Start from what the matrix had picked, so nothing is lost.
      const picked = this.selectedSkuIds();
      const records = this.pendingPool().filter(({ skuRowId }) => picked.includes(skuRowId));
      const units = records.reduce((sum, { record }) => sum + recordUnits(record), 0);
      this.quantityControl.setValue(units > 0 ? String(units) : '', { emitEvent: false });
      this.selectedRecordIds.set(records.map(({ record }) => record.id));
      return;
    }
    // Back to the matrix: keep the SKUs whose pending records were all picked (matrix cells are all-or-nothing).
    const recordIds = this.selectedRecordIds() ?? [];
    const kept = this.selectedSkuIds().filter((id) => {
      const records = this.pendingPool().filter(({ skuRowId }) => skuRowId === id);
      return records.length > 0 && records.every(({ record }) => recordIds.includes(record.id));
    });
    this.selectedRecordIds.set(null);
    this.selectedSkuIds.set(kept);
  }

  // Validates the typed quantity and picks the records that add up to it. The selection stays empty while
  // it is invalid, so the OP is not integrated with a quantity that does not match whole records.
  private applyQuantity(raw: string | null): void {
    const text = String(raw ?? '').trim();
    const quantity = Number(text);
    const pool = this.pendingPool();
    let error: string | null = null;
    let pickedIds: number[] = [];

    if (text && !WHOLE_NUMBER.test(text)) error = 'Ingrese un número entero.';
    else if (text && quantity < 1) error = 'La cantidad debe ser mayor a 0.';
    else if (text && quantity > this.poolUnits()) error = `Máximo por integrar: ${this.poolUnits()}.`;
    else if (text) {
      const picked = pickRecordsForQuantity(pool.map(({ record }) => record), quantity);
      if (picked.exact) pickedIds = picked.ids;
      else {
        const options = [picked.below, picked.above].filter((value): value is number => !!value);
        error = `No coincide con registros completos. Pruebe ${options.join(' o ')}.`;
      }
    }

    this.quantityError.set(error);
    const skuIds = new Set(pool.filter(({ record }) => pickedIds.includes(record.id)).map(({ skuRowId }) => skuRowId));
    this.selectedRecordIds.set(pickedIds);
    this.selectedSkuIds.set([...skuIds]);
  }

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
