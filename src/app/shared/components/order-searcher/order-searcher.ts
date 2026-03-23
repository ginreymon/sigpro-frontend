import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiInput } from '../../elements/ui-input/ui-input';
import { UiSelect } from '../../elements/ui-select/ui-select';
import { DocType } from '../../../models/production/doc-type';
import { finalize } from 'rxjs';
import { ProductionOrderService } from '../../../services/production/production-order-service';
import { WorkSpaceLoaderService } from '../../../services/common/work-space-loader-service';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiIconStateDirective } from '../../../directives/ui-icon-state-directive';
import { UiButton } from '../../elements/ui-button/ui-button';
import { ProductionOrder } from '../../../models/production/production-order';

@Component({
  selector: 'app-order-searcher',
  imports: [
    ReactiveFormsModule,
    UiFormField,
    UiInput,
    UiSelect,
    UiIcon,
    UiIconStateDirective,
    UiButton,
  ],
  templateUrl: './order-searcher.html',
  styleUrl: './order-searcher.css',
})
export class OrderSearcher {
  orderForm: FormGroup;

  doctypes = signal<DocType[]>([]);
  poService = inject(ProductionOrderService);
  wslService = inject(WorkSpaceLoaderService);
  intent: any;

  constructor(private fb: FormBuilder) {
    this.getDocTypes();
    this.orderForm = fb.group({
      type: [null, Validators.required],
      number: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
    });
  }

  get type() {
    return this.orderForm.get('type');
  }

  get number() {
    return this.orderForm.get('number');
  }

  getDocTypes() {
    this.wslService.start();
    this.poService
      .getDocType()
      .pipe(finalize(() => this.wslService.end()))
      .subscribe({
        next: (docs) => {
          this.doctypes.set(
            docs.map((d) => {
              return { ...d, doc_type: d.doc_type.trim() };
            }),
          );
        },
      });
  }

  clear() {
    this.orderForm.reset();
  }

  search() {
    this.orderForm.markAllAsTouched();

    for (const key in this.orderForm.controls) {
      const control = this.orderForm.controls[key];
      if (control.invalid) return;
    }

    const payload: ProductionOrder = { ...this.orderForm.value };
    
    this.poService.getOrder(payload, true).subscribe({
      next(value) {
        console.log(value);
      },
    });
  }
}
