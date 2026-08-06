import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../elements/ui-input/ui-input';
import { UiSelect } from '../../../../elements/ui-select/ui-select';
import { DocType } from '../../../../../models/production/doc-type';
import { finalize } from 'rxjs';
import { ProductionOrderService } from '../../../../../services/production/production-order-service';
import { WorkSpaceLoaderService } from '../../../../../services/common/work-space-loader-service';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiIconStateDirective } from '../../../../../directives/ui-icon-state-directive';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { ProductionOrder } from '../../../../../models/production/production-order';
import { LoaderService } from '../../../../../services/common/loader-service';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { UiBadge } from '../../../../elements/ui-badge/ui-badge';
import { UiOptionCard } from '../../../../elements/ui-option-card/ui-option-card';
import { OPStampingService } from '../../../../../services/stamping/op-stamping-service';
import { OrderTraceability } from '../../../../../models/stamping/order-traceability';

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
    UiBadge,
    UiOptionCard,
  ],
  templateUrl: './order-searcher.html',
  styleUrl: './order-searcher.css',
})
export class OrderSearcher implements OnInit {
  errorMessage = signal<string | null>(null);
  orderForm: FormGroup;

  doctypes = signal<DocType[]>([]);
  results = signal<OrderTraceability[]>([]);
  poService = inject(ProductionOrderService);
  opStampingService = inject(OPStampingService);
  wslService = inject(WorkSpaceLoaderService);
  loaderServive = inject(LoaderService);
  @Output() onFoundDoc = new EventEmitter<ProductionOrder | null>();
  @Input() preloadedDocTypes: DocType[] | null | undefined;
  @Input() traceabilityMode = false;
  @Input() numberOnlySearch = false;

  constructor(private fb: FormBuilder) {
    this.orderForm = fb.group({
      documentType: [null, Validators.required],
      documentNumber: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
    });
  }

  ngOnInit(): void {
    if (this.preloadedDocTypes?.length) this.doctypes.set(this.preloadedDocTypes);
    else this.getDocTypes();

    if (this.numberOnlySearch) {
      this.documentType?.setValidators([]);
      this.documentType?.updateValueAndValidity();
    }
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
    this.results.set([]);
  }

  search() {
    this.orderForm.markAllAsTouched();

    for (const key in this.orderForm.controls) {
      const control = this.orderForm.controls[key];
      if (control.invalid) return;
    }

    this.loaderServive.showLoader();
    this.errorMessage.set(null);

    if (this.traceabilityMode) {
      this.results.set([]);
      const { documentType, documentNumber } = this.orderForm.value;
      this.opStampingService
        .getTraceability(documentNumber, documentType)
        .subscribe({
          next: (ops) => {
            const activeOps = ops//ops.filter((o) => o.status === 1 || o.status === 2);
            if (!activeOps.length) {
              this.loaderServive.hideLoader();
              this.errorMessage.set('No se encontraron resultados');
            } else if (activeOps.length === 1) {
              this.selectResult(activeOps[0]);
            } else {
              this.loaderServive.hideLoader();
              this.results.set(activeOps);
            }
          },
          error: (err) => {
            this.loaderServive.hideLoader();
            this.errorMessage.set('No se encontraron resultados');
          },
        });
      return;
    }

    const payload: Partial<ProductionOrder> = { ...this.orderForm.value };
    this.poService
      .getOrder(payload, true)
      .pipe(finalize(() => this.loaderServive.hideLoader()))
      .subscribe({
        next: (op) => this.onFoundDoc.emit(op as ProductionOrder),
        error: (err) => this.errorMessage.set('No se encontraron resultados'),
      });
  }

  selectResult(order: OrderTraceability) {
    this.results.set([]);
    this.errorMessage.set(null);
    this.loaderServive.showLoader();
    this.poService
      .getOrder({ documentType: order.documentType, documentNumber: order.documentNumber }, true)
      .pipe(finalize(() => this.loaderServive.hideLoader()))
      .subscribe({
        next: (op) => this.onFoundDoc.emit(op as ProductionOrder),
        error: (err) => this.errorMessage.set('No se encontraron resultados'),
      });
  }
}
