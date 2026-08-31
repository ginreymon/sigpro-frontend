import { Component, computed, effect, EventEmitter, inject, OnDestroy, Output, signal } from '@angular/core';
import { ManualProductionRecordsStore } from '../../../../../services/production/manual-production-records-store';
import { ProductionRecord } from '../../../../../models/production/production-record';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiButton } from '../../../../elements/ui-button/ui-button';

// Barra flotante que resume los registros manuales capturados en
// shift-cycles-manual (ManualProductionRecordsStore) — siempre montada,
// pero solo entra en pantalla mientras haya al menos un registro pendiente
// (ese flujo no persiste al guardar; ver quantity-duration-modal.ts /
// ShiftCyclesManual.saveSKU), animando su entrada/salida en vez de
// aparecer/desaparecer abruptamente (@if la desmontaría y no podría
// transicionar la salida). Mismo tratamiento z-index que app-shift-time-alert.
@Component({
  selector: 'app-pending-records-bar',
  standalone: true,
  imports: [UiIcon, UiButton],
  templateUrl: './pending-records-bar.html',
  styleUrl: './pending-records-bar.css',
})
export class PendingRecordsBar implements OnDestroy {
  private store = inject(ManualProductionRecordsStore);

  protected visible = computed(() => this.store.records().length > 0);
  protected pendingCount = computed(() => this.store.records().length);
  protected totalUnits = computed(() =>
    this.store.records().reduce(
      (sum, r) => sum + Number(r.completed_quantity ?? 0) + Number(r.scrap_quantity ?? 0) + Number(r.rejected_quantity ?? 0),
      0,
    )
  );

  @Output() onSave = new EventEmitter<Partial<ProductionRecord>[]>();

  protected shake = signal(false);
  private previousCount = 0;
  private shakeTimeout?: ReturnType<typeof setTimeout>;
  private shakeFrame?: ReturnType<typeof requestAnimationFrame>;

  constructor() {
    // Tiembla cada vez que se agrega un registro (al ingresar cantidades vía
    // quantity-duration-modal), no al vaciarse (Guardar/clear). set(false)
    // + rAF + set(true) fuerza el reflow para que la animación CSS se
    // reinicie aunque ya estuviera corriendo (guardados consecutivos).
    effect(() => {
      const count = this.pendingCount();
      if (count > this.previousCount) this.triggerShake();
      this.previousCount = count;
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.shakeTimeout);
    if (this.shakeFrame !== undefined) cancelAnimationFrame(this.shakeFrame);
  }

  private triggerShake(): void {
    clearTimeout(this.shakeTimeout);
    if (this.shakeFrame !== undefined) cancelAnimationFrame(this.shakeFrame);

    this.shake.set(false);
    this.shakeFrame = requestAnimationFrame(() => {
      this.shake.set(true);
      this.shakeTimeout = setTimeout(() => this.shake.set(false), 500);
    });
  }

  protected save(): void {
    this.onSave.emit(this.store.records());
  }

  // Descarta todo lo capturado: vacía el store (nadie más lo referencia,
  // así que la barra desaparece sola vía `visible`) y con eso
  // app-production-orders-table vuelve a mostrar solo lo cargado desde la
  // base de datos (pendingRecords queda vacío, ver applyPendingRecords).
  protected discard(): void {
    this.store.clear();
  }
}
