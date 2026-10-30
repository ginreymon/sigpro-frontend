import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkCenterDocument } from '../../../../models/integration/order-by-work-center';
import { OpSkuDetailService } from '../../../../services/integration/op-sku-detail-service';
import { DocumentIntegrationMatrix } from '../../../pages/integration/manual-integration/options/production/document-integration-matrix/document-integration-matrix';

// Color x size matrix of one Confección OP, display only. Loaded on init (inside a lazy accordion
// body) straight from the OP, so it also shows SKUs that were already integrated.
@Component({
  selector: 'app-op-sku-matrix-readonly',
  imports: [DocumentIntegrationMatrix],
  template: `
    @if (loading()) {
      <p class="text-xs text-slate-500">Cargando SKUs…</p>
    } @else if (failed()) {
      <p class="text-xs text-red-700">No se pudo cargar el detalle por SKU.</p>
    } @else if (document(); as doc) {
      <app-document-integration-matrix [document]="doc" [readOnly]="true"></app-document-integration-matrix>
    } @else {
      <p class="text-xs text-slate-500">Sin detalle por SKU</p>
    }
  `,
})
export class OpSkuMatrixReadonly implements OnInit {
  readonly opType = input.required<string>();
  readonly opNumber = input.required<number>();

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly document = signal<WorkCenterDocument | null>(null);

  private readonly service = inject(OpSkuDetailService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.service
      .get(this.opType(), this.opNumber())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          // The matrix only reads `detail.colorRows`; the rest of the document is not needed to display it.
          this.document.set(res.colorRows?.length ? ({ detail: { colorRows: res.colorRows } } as WorkCenterDocument) : null);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }
}
