import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
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
import { LoaderService } from '../../../services/common/loader-service';
import { UiErrorMessage } from '../../elements/ui-error-message/ui-error-message';

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
    UiErrorMessage,
  ],
  templateUrl: './order-searcher.html',
  styleUrl: './order-searcher.css',
})
export class OrderSearcher implements OnInit {
  errorMessage = signal<string | null>(null);
  orderForm: FormGroup;

  doctypes = signal<DocType[]>([]);
  poService = inject(ProductionOrderService);
  wslService = inject(WorkSpaceLoaderService);
  loaderServive = inject(LoaderService);
  @Output() onFoundDoc = new EventEmitter<ProductionOrder | null>();
  @Input() preloadedDocTypes: DocType[] | null | undefined;

  constructor(private fb: FormBuilder) {
    this.orderForm = fb.group({
      documentType: [null, Validators.required],
      documentNumber: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
    });
  }

  ngOnInit(): void {
    if (this.preloadedDocTypes?.length) this.doctypes.set(this.preloadedDocTypes);
    else this.getDocTypes();
  }

  get documentType() {
    return this.orderForm.get('documentType');
  }

  get documentNumber() {
    return this.orderForm.get('documentNumber');
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

    this.loaderServive.showLoader();
    this.errorMessage.set(null);
    const payload: Partial<ProductionOrder> = { ...this.orderForm.value };
    this.poService
      .getOrder(payload, true)
      .pipe(finalize(() => this.loaderServive.hideLoader()))
      .subscribe({
        next: (op) => this.onFoundDoc.emit(op as ProductionOrder),
        error: (err) => this.errorMessage.set('No se encontraron resultados'),
      });
  }
}
