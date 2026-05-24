import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BoxLayout } from '../box-layout/box-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../elements/ui-large-input/ui-large-input';
import { QuantityModalService } from '../../../services/common/quantity-modal-service';
import { SkuDetail } from '../sku-detail/sku-detail';
import { SkuTaskDetail } from '../../../models/production/sku-task-detail';
import { SkuQuantitySummary } from '../sku-quantity-summary/sku-quantity-summary';
import { UiErrorMessage } from '../../elements/ui-error-message/ui-error-message';
import { ProductionRecord } from '../../../models/production/production-record';

@Component({
  selector: 'app-quantity-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiFormField, UiLargeInput, ReactiveFormsModule, SkuDetail, SkuQuantitySummary, UiErrorMessage],
  templateUrl: './quantity-modal.html',
})
export class QuantityModal {
  @Input() selectedSKU: SkuTaskDetail | null = null;

  private qms = inject(QuantityModalService);
  private fb = inject(FormBuilder);

  @Output() onSave = new EventEmitter<Partial<ProductionRecord>>();

  protected visible = this.qms.visible;
  protected isSubmitting = signal(false);

  recordForm: FormGroup = this.fb.group(
    {
      completed_quantity: [null, [Validators.required, Validators.min(0), this.integerValidator]],
      rejected_quantity: [null, [Validators.required, Validators.min(0), this.integerValidator]],
      scrap_quantity: [null, [Validators.required, Validators.min(0), this.integerValidator]],
    },
    { validators: this.exceedsMaxValidator.bind(this) }
  );

  get exceedsMaxError(): { max: number; total: number } | null {
    return this.recordForm.errors?.['exceedsMax'] ?? null;
  }

  get maxAvailable(): number {
    if (!this.selectedSKU) return 0;
    const { orderedQty, completedQty, wasteQty, rejectedQty } = this.selectedSKU;
    return orderedQty - (completedQty + wasteQty + rejectedQty);
  }

  private integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return Number.isInteger(Number(value)) ? null : { notInteger: true };
  }

  private exceedsMaxValidator(group: AbstractControl): ValidationErrors | null {
    const completed = group.get('completed_quantity')?.value ?? 0;
    const rejected = group.get('rejected_quantity')?.value ?? 0;
    const scrap = group.get('scrap_quantity')?.value ?? 0;
    const total = (Number(completed) ?? 0) + (Number(rejected) ?? 0) + (Number(scrap) ?? 0);
    return total > this.maxAvailable ? { exceedsMax: { max: this.maxAvailable, total } } : null;
  }

  cancel() {
    this.recordForm.reset({ completed_quantity: null, rejected_quantity: null, scrap_quantity: null });
    this.qms.close();
  }

  save() {
    if (this.recordForm.invalid || this.isSubmitting()) return;

    const { completed_quantity, rejected_quantity, scrap_quantity } = this.recordForm.value;
    const sku = this.selectedSKU;

    const payload: Partial<ProductionRecord> = {
      ...(sku && {
        sku_rowid: sku.skuRowId,
        op_rowid: sku.opRowId,
        op_number: sku.opNumber,
        op_type: sku.opType,
        ordered_quantity: sku.orderedQty,
        planned_quantity: sku.plannedQty,
      }),
      completed_quantity: Number(completed_quantity),
      rejected_quantity: Number(rejected_quantity),
      scrap_quantity: Number(scrap_quantity),
    };

    this.onSave.emit(payload);
  }
}
