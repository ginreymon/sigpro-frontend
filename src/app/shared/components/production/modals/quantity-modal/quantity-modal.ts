import { Component, computed, effect, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../elements/ui-large-input/ui-large-input';
import { QuantityModalService } from '../../../../../services/common/quantity-modal-service';
import { SkuDetail } from '../../cards/sku-detail/sku-detail';
import { SkuTaskDetail } from '../../../../../models/production/sku-task-detail';
import { SkuQuantitySummary } from '../../cards/sku-quantity-summary/sku-quantity-summary';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { ProductionRecord } from '../../../../../models/production/production-record';
import { QuantityDetail } from "../../cards/quantity-detail/quantity-detail";
import { SkuQuantityCounter } from "../../cards/sku-quantity-counter/sku-quantity-counter";

@Component({
  selector: 'app-quantity-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiFormField, UiLargeInput, ReactiveFormsModule, SkuDetail, SkuQuantitySummary, UiErrorMessage, QuantityDetail, SkuQuantityCounter],
  templateUrl: './quantity-modal.html',
})
export class QuantityModal {
  @Input() selectedSKU: SkuTaskDetail | null = null;
  @Input() enable = true;

  // protected (no private): app-quantity-duration-modal extiende este componente
  // para agregar la pestaña de horario reusando el form/servicio de cantidades.
  protected qms = inject(QuantityModalService);
  protected fb = inject(FormBuilder);

  @Output() onSave = new EventEmitter<Partial<ProductionRecord>>();

  protected visible = this.qms.visible;
  protected isSubmitting = signal(false);
  protected editMode = computed(() => !!this.qms.editRecord());

  // app-quantity-duration-modal lo sobreescribe a 'Agregar': ese flujo no
  // persiste de una (acumula en ManualProductionRecordsStore), así que el
  // botón no debe decir "Guardar".
  protected get saveButtonLabel(): string {
    return 'Guardar';
  }
  
  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.recordForm.reset({ completed_quantity: null, rejected_quantity: 0, scrap_quantity: 0 });
        return;
      }
      const record = this.qms.editRecord();
      if (record) {
        this.recordForm.patchValue({
          completed_quantity: record.completed_quantity,
          rejected_quantity: record.rejected_quantity,
          scrap_quantity: record.scrap_quantity,
        });
      }
    });
  }

  recordForm: FormGroup = this.fb.group(
    {
      completed_quantity: [null, [Validators.required, Validators.min(0), this.integerValidator]],
      rejected_quantity: [0, [Validators.required, Validators.min(0), this.integerValidator]],
      scrap_quantity: [0, [Validators.required, Validators.min(0), this.integerValidator]],
    },
    { validators: [this.exceedsMaxValidator.bind(this), this.atLeastOnePositiveValidator.bind(this)] }
  );

  get completedQty(): number { return Number(this.recordForm.get('completed_quantity')?.value) || 0; }
  get rejectedQty(): number { return Number(this.recordForm.get('rejected_quantity')?.value) || 0; }
  get scrapQty(): number { return Number(this.recordForm.get('scrap_quantity')?.value) || 0; }

  get displayCompletedQty(): number {
    const base = Number(this.selectedSKU?.completedQty) || 0;
    const r = this.qms.editRecord();
    return r ? base - Number(r.completed_quantity) : base;
  }
  get displayRejectedQty(): number {
    const base = Number(this.selectedSKU?.rejectedQty) || 0;
    const r = this.qms.editRecord();
    return r ? base - Number(r.rejected_quantity) : base;
  }
  get displayScrapQty(): number {
    const base = Number(this.selectedSKU?.wasteQty) || 0;
    const r = this.qms.editRecord();
    return r ? base - Number(r.scrap_quantity) : base;
  }

  get exceedsMaxError(): { max: number; total: number } | null {
    return this.recordForm.errors?.['exceedsMax'] ?? null;
  }

  get allZeroError(): boolean {
    return !!this.recordForm.errors?.['allZero'];
  }

  get maxAvailable(): number {  
    if (!this.selectedSKU) return 0;
    const { orderedQty, completedQty, wasteQty, rejectedQty } = this.selectedSKU;
    const base = Number(orderedQty) - (Number(completedQty) + Number(wasteQty) + Number(rejectedQty));
    const record = this.qms.editRecord();
    if (record) {
      return base + Number(record.completed_quantity) + Number(record.scrap_quantity) + Number(record.rejected_quantity);
    }
    return base;
  }

  private integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return Number.isInteger(Number(value)) ? null : { notInteger: true };
  }

  private atLeastOnePositiveValidator(group: AbstractControl): ValidationErrors | null {
    if (this.editMode()) return null;
    const completed = Number(group.get('completed_quantity')?.value) || 0;
    const rejected = Number(group.get('rejected_quantity')?.value) || 0;
    const scrap = Number(group.get('scrap_quantity')?.value) || 0;
    return completed + rejected + scrap > 0 ? null : { allZero: true };
  }

  private exceedsMaxValidator(group: AbstractControl): ValidationErrors | null {
    const completed = group.get('completed_quantity')?.value ?? 0;
    const rejected = group.get('rejected_quantity')?.value ?? 0;
    const scrap = group.get('scrap_quantity')?.value ?? 0;
    const total = (Number(completed) ?? 0) + (Number(rejected) ?? 0) + (Number(scrap) ?? 0);
    return total > this.maxAvailable ? { exceedsMax: { max: this.maxAvailable, total } } : null;
  }

  cancel() {
    this.qms.close();
  }

  save() {
    if (this.recordForm.invalid || this.isSubmitting() || !this.enable) return;

    const payload = this.buildPayload();
    if (!payload) return;

    this.onSave.emit(payload);
  }

  // Hook de extensión (OCP): app-quantity-duration-modal lo sobreescribe para
  // sumar duration_seconds al payload base sin duplicar el resto de save().
  // Devolver null cancela el guardado (equivalente a un return temprano).
  protected buildPayload(): Partial<ProductionRecord> | null {
    const { completed_quantity, rejected_quantity, scrap_quantity } = this.recordForm.value;
    const editRecord = this.qms.editRecord();
    const sku = this.selectedSKU;

    return {
      ...(editRecord
        ? { id: editRecord.record_id }
        : sku && {
            sku_rowid: sku.skuRowId,
            op_rowid: sku.opRowId,
            op_number: sku.opNumber,
            op_type: sku.opType,
            ordered_quantity: sku.orderedQty,
            planned_quantity: sku.plannedQty,
          }
      ),
      completed_quantity: Number(completed_quantity),
      rejected_quantity: Number(rejected_quantity),
      scrap_quantity: Number(scrap_quantity),
    };
  }
}
