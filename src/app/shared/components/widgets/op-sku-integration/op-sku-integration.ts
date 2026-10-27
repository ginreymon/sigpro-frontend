import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkCenterDocument } from '../../../../models/integration/order-by-work-center';
import { OrdersByWorkCenterService } from '../../../../services/integration/orders-by-work-center-service';
import { DocumentIntegrationMatrix } from '../../../pages/integration/work-center-totals/options/production/document-integration-matrix/document-integration-matrix';

// Origin whose records carry a SKU (Confección). Other origins have no per-SKU detail.
const SKU_ORIGIN_ID = 1;

// Color x size grid of one OP showing which SKUs were already integrated. Loaded on
// init (inside a lazy accordion body) from by-work-center, filtered by op_rowid.
@Component({
  selector: 'app-op-sku-integration',
  imports: [DocumentIntegrationMatrix],
  template: `
    @if (originId() !== skuOriginId) {
      <p class="text-xs text-slate-500">Sin detalle por SKU</p>
    } @else if (loading()) {
      <p class="text-xs text-slate-500">Cargando SKUs…</p>
    } @else if (document(); as doc) {
      <app-document-integration-matrix [document]="doc"></app-document-integration-matrix>
    } @else {
      <p class="text-xs text-slate-500">Sin detalle por SKU</p>
    }
  `,
})
export class OpSkuIntegration implements OnInit {
  readonly opRowid = input.required<number>();
  readonly originId = input.required<number>();
  readonly workCenterCode = input.required<string>();

  protected readonly skuOriginId = SKU_ORIGIN_ID;
  protected readonly loading = signal(false);
  protected readonly document = signal<WorkCenterDocument | null>(null);

  private readonly service = inject(OrdersByWorkCenterService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.originId() !== SKU_ORIGIN_ID) return;
    this.loading.set(true);
    this.service
      .getAll({ op_rowid: this.opRowid() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const code = this.workCenterCode().trim();
          const workCenter = res.results.find((row) => row.code.trim() === code);
          this.document.set(
            workCenter?.documents.find((doc) => doc.op_rowid === this.opRowid()) ?? null,
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
