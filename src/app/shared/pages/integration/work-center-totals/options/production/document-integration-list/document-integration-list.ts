import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { SkuDetail, SkuRecord } from '../../../../../../../models/production/sku-detail';
import {
  integratedUnits,
  isRealSku,
  missingUnits,
  pendingUnits,
  skuIntegrationState,
  SkuIntegrationState,
  STATE_CLASSES,
  STATE_LABELS,
} from '../integration-state';

type StateFilter = 'all' | 'pending' | 'integrated' | 'none';

interface SkuRow {
  key: string;
  color: string;
  size: string;
  ordered: number;
  integrated: number;
  pending: number;
  missing: number;
  state: SkuIntegrationState;
  records: SkuRecord[];
}

// Pending first (what needs action), then SKUs without records, then integrated ones.
const STATE_ORDER: Record<SkuIntegrationState, number> = {
  pending: 0,
  none: 1,
  integrated: 2,
  unknown: 3,
};

// Flat "one row per SKU" view of an OP of Confección. Click a row to see its production
// records and whether each one was already integrated.
@Component({
  selector: 'app-document-integration-list',
  imports: [DecimalPipe],
  templateUrl: './document-integration-list.html',
})
export class DocumentIntegrationList {
  readonly document = input.required<WorkCenterDocument>();

  protected readonly filter = signal<StateFilter>('all');
  private readonly expandedKeys = signal<ReadonlySet<string>>(new Set());

  protected readonly stateLabels = STATE_LABELS;
  protected readonly stateClasses = STATE_CLASSES;

  // One row per real SKU in color order; Array.sort is stable, so within the same state the
  // color / size order of the OP is kept.
  private readonly rows = computed<SkuRow[]>(() =>
    (this.document().detail?.colorRows ?? [])
      .flatMap((colorRow) =>
        (colorRow.skus ?? []).filter(isRealSku).map((sku) => this.toRow(colorRow.color, sku)),
      )
      .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]),
  );

  // False when the API did not send TEP data: the state can not be computed, so no filter.
  protected readonly hasTepData = computed(() =>
    (this.document().detail?.colorRows ?? []).some((colorRow) =>
      (colorRow.skus ?? []).some((sku) => isRealSku(sku) && sku.tepProcessed !== undefined),
    ),
  );

  protected readonly options = computed(() => {
    const rows = this.rows();
    const count = (state: SkuIntegrationState) => rows.filter((r) => r.state === state).length;
    return [
      { value: 'all' as StateFilter, label: 'Todos', count: rows.length },
      { value: 'pending' as StateFilter, label: 'Por integrar', count: count('pending') },
      { value: 'integrated' as StateFilter, label: 'Integrado', count: count('integrated') },
      { value: 'none' as StateFilter, label: 'Sin registros', count: count('none') },
    ];
  });

  protected readonly visibleRows = computed(() => {
    const filter = this.hasTepData() ? this.filter() : 'all';
    return filter === 'all' ? this.rows() : this.rows().filter((row) => row.state === filter);
  });

  protected isExpanded(row: SkuRow): boolean {
    return this.expandedKeys().has(row.key);
  }

  protected toggle(row: SkuRow): void {
    this.expandedKeys.update((keys) => {
      const next = new Set(keys);
      if (!next.delete(row.key)) next.add(row.key);
      return next;
    });
  }

  private toRow(color: string, sku: SkuDetail): SkuRow {
    return {
      key: `${color}|${sku.size}`,
      color,
      size: sku.size,
      ordered: Number(sku.orderedQty),
      integrated: integratedUnits(sku),
      pending: pendingUnits(sku),
      missing: missingUnits(sku),
      state: skuIntegrationState(sku),
      records: sku.records ?? [],
    };
  }
}
