import { Component, EventEmitter, Output, computed, effect, input, signal } from '@angular/core';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiButton } from '../../../../elements/ui-button/ui-button';

// Shape mínimo para sumar "unidades" — cubre tanto ProductionRecord
// (completed/rejected/scrap) como StampingRecord (solo completed).
export interface PendingRecordUnits {
  completed_quantity?: number;
  rejected_quantity?: number;
  scrap_quantity?: number;
}

// Barra flotante que resume registros manuales aún no persistidos (ver
// ShiftCyclesManual.saveSKU/saveStamping) — puramente presentacional: no
// conoce el store de quien la usa, solo recibe los registros a resumir y
// emite la intención de guardar/descartar. El llamador decide a qué store
// pertenecen (ManualProductionRecordsStore o ManualStampingRecordsStore).
@Component({
  selector: 'app-pending-records-bar',
  standalone: true,
  imports: [UiIcon, UiButton],
  templateUrl: './pending-records-bar.html',
  styleUrl: './pending-records-bar.css',
})
export class PendingRecordsBar {
  records = input<PendingRecordUnits[]>([]);
  forceHidden = input(false);

  protected hasRecords = computed(() => this.records().length > 0);
  protected pendingCount = computed(() => this.records().length);
  protected totalUnits = computed(() =>
    this.records().reduce(
      (sum, r) => sum + Number(r.completed_quantity ?? 0) + Number(r.scrap_quantity ?? 0) + Number(r.rejected_quantity ?? 0),
      0,
    )
  );

  @Output() onSave = new EventEmitter<void>();
  @Output() onDiscard = new EventEmitter<void>();

  protected shake = signal(false);
  private previousCount = 0;
  private shakeTimeout?: ReturnType<typeof setTimeout>;
  private shakeFrame?: ReturnType<typeof requestAnimationFrame>;

  constructor() {
    // Tiembla cada vez que se agrega un registro (al ingresar cantidades vía
    // quantity-duration-modal / stamping-record-manual), no al vaciarse
    // (Guardar/Eliminar). 0 -> N (primera aparición) no tiembla: la barra ya
    // está animando su entrada (hasRecords) y el shake simultáneo se veía
    // como doble temblor.
    effect(() => {
      const count = this.pendingCount();
      if (this.previousCount > 0 && count > this.previousCount) this.triggerShake();
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
    this.onSave.emit();
  }

  protected discard(): void {
    this.onDiscard.emit();
  }
}
