import { Component, computed, effect, EventEmitter, inject, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../elements/ui-large-input/ui-large-input';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { UiSuccessMessage } from '../../../../elements/ui-success-message/ui-success-message';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';
import { AuditQuantityModalService } from '../../../../../services/common/audit-quantity-modal-service';
import { getQuantityUnit } from '../../../../../common/functions/processes-machine-type';

export interface AuditedColorQuantity {
  color: string;
  quantity: number;
  orderedQty: number;
  skuRowIds: number[];
}

const PACKAGE_SIZE = 80;
const QUANTITY_CONTROL = 'quantity';

@Component({
  selector: 'app-audit-quantity-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiFormField, UiLargeInput, ReactiveFormsModule, UiErrorMessage, UiSuccessMessage, ProgressBar],
  templateUrl: './audit-quantity-modal.html',
})
export class AuditQuantityModal {
  private aqms = inject(AuditQuantityModalService);
  private fb = inject(FormBuilder);

  @Output() onSave = new EventEmitter<AuditedColorQuantity>();

  protected readonly quantityControlName = QUANTITY_CONTROL;

  protected visible = this.aqms.visible;
  protected productionOrder = this.aqms.productionOrder;
  protected isEditMode = computed(() => this.aqms.existingQuantity() !== null);
  // Processes orders (CALANDRA) are audited in kg; the package split only applies to units.
  protected isKg = computed(() => getQuantityUnit(this.productionOrder()?.referenceSams) === 'kg');

  // The single color being audited — never the full order color set.
  protected colorData = computed(() => {
    const order = this.productionOrder();
    const color = this.aqms.color();
    if (!order || !color) return null;
    const match = order.colorRows.find((c) => c.color === color);
    if (!match) return null;
    return {
      color: match.color,
      total: Number(match.totals?.orderedQty) || 0,
      skuRowIds: match.skus.map((s) => s.skuRowId),
    };
  });

  protected quantityForm: FormGroup = this.fb.group({
    [QUANTITY_CONTROL]: [null, [Validators.required, Validators.min(0), this.integerValidator]],
  });

  constructor() {
    // Prefills with the color's already-saved audited_quantity when editing
    // one that was audited before — existingQuantity is null when there's
    // nothing saved yet (fresh entry), matching isEditMode().
    effect(() => {
      if (this.aqms.visible()) {
        this.quantityForm.reset({ [QUANTITY_CONTROL]: this.aqms.existingQuantity() });
      }
    });
  }

  enteredQty(): number {
    return Number(this.quantityForm.get(QUANTITY_CONTROL)?.value) || 0;
  }

  packages(): number {
    return Math.floor(this.enteredQty() / PACKAGE_SIZE);
  }

  remainder(): number {
    return this.enteredQty() % PACKAGE_SIZE;
  }

  matches(): boolean {
    return this.enteredQty() === (this.colorData()?.total ?? 0);
  }

  missing(): number {
    return (this.colorData()?.total ?? 0) - this.enteredQty();
  }

  private integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return Number.isInteger(Number(value)) ? null : { notInteger: true };
  }

  cancel(): void {
    this.aqms.close();
  }

  save(): void {
    if (this.quantityForm.invalid) return;
    const data = this.colorData();
    if (!data) return;
    this.onSave.emit({
      color: data.color,
      quantity: Number(this.quantityForm.value[QUANTITY_CONTROL]),
      orderedQty: data.total,
      skuRowIds: data.skuRowIds,
    });
    this.aqms.close();
  }
}
