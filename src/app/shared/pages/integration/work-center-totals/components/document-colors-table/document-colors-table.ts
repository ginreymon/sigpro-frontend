import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { WorkCenterDocument } from '../../../../../../models/integration/order-by-work-center';
import { SkuDetail } from '../../../../../../models/production/sku-detail';
import { Totals } from '../../../../../../models/production/totals';
import { UiAccordionItem } from '../../../../../elements/ui-accordion-item/ui-accordion-item';
import { UiIcon } from '../../../../../elements/ui-icon/ui-icon';

// Confección integrate detail (origin_id = 1): one row per color with its totals;
// expanding a row shows the breakdown by size (SKU). Alternative to
// DocumentProductionTable (color x size matrix) fed by the same `detail.colorRows`.
@Component({
  selector: 'app-document-colors-table',
  imports: [DecimalPipe, UiAccordionItem, UiIcon],
  templateUrl: './document-colors-table.html',
})
export class DocumentColorsTable {
  readonly document = input.required<WorkCenterDocument>();

  protected readonly colorRows = computed(() => this.document().detail?.colorRows ?? []);
  protected readonly expandedColors = signal<Set<string>>(new Set());

  protected toggle(color: string): void {
    const expanded = new Set(this.expandedColors());
    if (!expanded.delete(color)) expanded.add(color);
    this.expandedColors.set(expanded);
  }

  // Recorded units of a color: completed + rejected + waste (shown over the ordered ones).
  protected producedQty(totals: Totals): number {
    return Number(totals.completedQty) + Number(totals.rejectedQty) + Number(totals.wasteQty);
  }

  // Whether the ordered quantity equals completed + rejected + waste.
  protected isBalanced(totals: Totals): boolean {
    return this.producedQty(totals) === Number(totals.orderedQty);
  }

  // (completed + rejected + waste) / ordered; null when nothing was ordered.
  protected completion(totals: Totals): number | null {
    const ordered = Number(totals.orderedQty);
    return ordered > 0 ? this.producedQty(totals) / ordered : null;
  }

  // Placeholder cells (emptySize) have no real SKU: skuRowId 0 and no itemId.
  protected realSkus(skus: SkuDetail[]): SkuDetail[] {
    return skus.filter((sku) => sku.skuRowId !== 0 || !!sku.itemId);
  }
}
