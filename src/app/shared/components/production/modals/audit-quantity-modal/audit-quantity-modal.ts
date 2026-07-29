import { Component, computed, effect, EventEmitter, inject, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../elements/ui-large-input/ui-large-input';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { UiSuccessMessage } from '../../../../elements/ui-success-message/ui-success-message';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';
import { AuditQuantityModalService } from '../../../../../services/common/audit-quantity-modal-service';

export interface AuditedColorQuantity {
  color: string;
  quantity: number;
  orderedQty: number;
  skuRowIds: number[];
}

const PACKAGE_SIZE = 80;

@Component({
  selector: 'app-audit-quantity-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiFormField, UiLargeInput, ReactiveFormsModule, UiErrorMessage, UiSuccessMessage, ProgressBar],
  templateUrl: './audit-quantity-modal.html',
})
export class AuditQuantityModal {
  private aqms = inject(AuditQuantityModalService);
  private fb = inject(FormBuilder);

  @Output() onSave = new EventEmitter<AuditedColorQuantity[]>();

  protected visible = this.aqms.visible;
  protected productionOrder = this.aqms.productionOrder;

  protected colorRows = computed(() => {
    const order = this.productionOrder();
    if (!order) return [];
    return order.colors.map((color, index) => ({
      controlName: `qty_${index}`,
      color: color.color,
      total: Number(color.totals?.[0]?.orderedQty) || 0,
      skuRowIds: color.sizes.map((s) => s.skuRowId),
    }));
  });

  protected totalOrderedQty = computed(() =>
    this.colorRows().reduce((sum, row) => sum + row.total, 0),
  );

  protected quantityForm: FormGroup = this.fb.group({});

  constructor() {
    effect(() => {
      const rows = this.colorRows();
      const controls: Record<string, any> = {};
      rows.forEach((row) => {
        controls[row.controlName] = [null, [Validators.required, Validators.min(0), this.integerValidator, this.matchesTotal(row.total)]];
      });
      this.quantityForm = this.fb.group(controls);
    });
  }

  enteredTotal(): number {
    return this.colorRows().reduce((sum, row) => {
      const value = this.quantityForm.get(row.controlName)?.value;
      return sum + (Number(value) || 0);
    }, 0);
  }

  packagesFor(controlName: string): number {
    const value = Number(this.quantityForm.get(controlName)?.value) || 0;
    return Math.floor(value / PACKAGE_SIZE);
  }

  remainderFor(controlName: string): number {
    const value = Number(this.quantityForm.get(controlName)?.value) || 0;
    return value % PACKAGE_SIZE;
  }

  totalPackages(): number {
    return this.colorRows().reduce((sum, row) => sum + this.packagesFor(row.controlName), 0);
  }

  rowMatches(controlName: string, total: number): boolean {
    const value = this.quantityForm.get(controlName)?.value;
    if (value === null || value === undefined || value === '') return false;
    return Number(value) === total;
  }

  missingTotal(): number {
    return this.totalOrderedQty() - this.enteredTotal();
  }

  private integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return Number.isInteger(Number(value)) ? null : { notInteger: true };
  }

  private matchesTotal(total: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      return Number(value) === total ? null : { mismatch: { total, entered: Number(value) } };
    };
  }

  cancel(): void {
    this.aqms.close();
  }

  save(): void {
    if (this.quantityForm.invalid) return;
    const result: AuditedColorQuantity[] = this.colorRows().map((row) => ({
      color: row.color,
      quantity: Number(this.quantityForm.value[row.controlName]),
      orderedQty: row.total,
      skuRowIds: row.skuRowIds,
    }));
    this.onSave.emit(result);
    this.aqms.close();
  }
}
