import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { SkuDetail } from '../../../../../../../models/production/sku-detail';
import {
  integratedUnits,
  isRealSku,
  missingUnits,
  pendingRecords,
  pendingUnits,
  skuIntegrationState,
  SkuIntegrationState,
  STATE_BAR_CLASSES,
  STATE_CLASSES,
  STATE_LABELS,
} from '../integration-state';

interface PendingSku {
  size: string;
  units: number;
  recordIds: number[];
}

interface Progress {
  ordered: number;
  integrated: number;
  pending: number;
  missing: number;
  // Segment widths (% of the bar) and share of ordered units already integrated.
  integratedWidth: number;
  pendingWidth: number;
  missingWidth: number;
  integratedPercent: number;
}

interface ColorProgress extends Progress {
  color: string;
  state: SkuIntegrationState;
  pendingSkus: PendingSku[];
}

// Color state derived from its real SKUs: any pending SKU makes the color pending; integrated
// only when every SKU is integrated; unknown when the API sent no TEP data; otherwise no records.
export function colorIntegrationState(states: SkuIntegrationState[]): SkuIntegrationState {
  if (!states.length || states.every((state) => state === 'unknown')) return 'unknown';
  if (states.includes('pending')) return 'pending';
  if (states.every((state) => state === 'integrated')) return 'integrated';
  return 'none';
}

function progressOf(skus: SkuDetail[]): Progress {
  const sum = (fn: (sku: SkuDetail) => number) => skus.reduce((total, sku) => total + fn(sku), 0);
  const ordered = sum((sku) => Number(sku.orderedQty));
  const integrated = sum(integratedUnits);
  const pending = sum(pendingUnits);
  const missing = sum(missingUnits);
  // Over-production can exceed the ordered units: the bar scales to the larger of both.
  const base = Math.max(ordered, integrated + pending + missing);
  const width = (value: number) => (base > 0 ? (value / base) * 100 : 0);
  return {
    ordered,
    integrated,
    pending,
    missing,
    integratedWidth: width(integrated),
    pendingWidth: width(pending),
    missingWidth: width(missing),
    integratedPercent: ordered > 0 ? (integrated / ordered) * 100 : 0,
  };
}

// Confección view detail (origin_id = 1): progress per color of the OP, split into integrated,
// pending and missing units. Each color card expands to list its pending SKUs.
@Component({
  selector: 'app-document-integration-colors',
  imports: [DecimalPipe],
  templateUrl: './document-integration-colors.html',
})
export class DocumentIntegrationColors {
  readonly document = input.required<WorkCenterDocument>();

  protected readonly labels = STATE_LABELS;
  protected readonly chipClasses = STATE_CLASSES;
  protected readonly barClasses = STATE_BAR_CLASSES;

  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  private readonly realSkus = computed(() =>
    (this.document().detail?.colorRows ?? []).flatMap((row) => row.skus.filter(isRealSku)),
  );

  // True when the API sent no `tepProcessed` at all (stored function not deployed).
  protected readonly hasTepData = computed(() =>
    this.realSkus().some((sku) => sku.tepProcessed !== undefined),
  );

  protected readonly summary = computed(() => progressOf(this.realSkus()));

  protected readonly colors = computed<ColorProgress[]>(() =>
    [...(this.document().detail?.colorRows ?? [])]
      .sort((a, b) => a.color.localeCompare(b.color))
      .map((row) => {
        const skus = row.skus.filter(isRealSku);
        return {
          color: row.color,
          ...progressOf(skus),
          state: colorIntegrationState(skus.map(skuIntegrationState)),
          pendingSkus: skus
            .filter((sku) => skuIntegrationState(sku) === 'pending')
            .map((sku) => ({
              size: sku.size,
              units: pendingUnits(sku),
              recordIds: pendingRecords(sku).map((record) => record.id),
            })),
        };
      }),
  );

  protected isExpanded(color: string): boolean {
    return this.expanded().has(color);
  }

  protected toggle(color: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (!next.delete(color)) next.add(color);
      return next;
    });
  }
}
