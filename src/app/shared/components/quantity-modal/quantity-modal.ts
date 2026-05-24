import { Component, inject, Input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BoxLayout } from '../box-layout/box-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../elements/ui-large-input/ui-large-input';
import { QuantityModalService } from '../../../services/common/quantity-modal-service';
import { SkuDetail } from '../sku-detail/sku-detail';
import { SkuTaskDetail } from '../../../models/production/sku-task-detail';
import { SkuQuantitySummary } from '../sku-quantity-summary/sku-quantity-summary';

@Component({
  selector: 'app-quantity-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiFormField, UiLargeInput, ReactiveFormsModule, SkuDetail, SkuQuantitySummary],
  templateUrl: './quantity-modal.html',
})
export class QuantityModal {
  @Input() selectedSKU: SkuTaskDetail | null = null;

  private qms = inject(QuantityModalService);
  private fb = inject(FormBuilder);

  protected visible = this.qms.visible;
  protected isSubmitting = signal(false);

  recordForm: FormGroup = this.fb.group({
    completed_quantity: [null, [Validators.required, Validators.min(0)]],
    rejected_quantity: [null, [Validators.required, Validators.min(0)]],
    scrap_quantity: [null, [Validators.required, Validators.min(0)]],
  });

  cancel() {
    this.recordForm.reset({ completed_quantity: null, rejected_quantity: null, scrap_quantity: null });
    this.qms.close();
  }

  save() {
    if (this.recordForm.invalid || this.isSubmitting()) return;
    // connection point: wire backend call here
  }
}
