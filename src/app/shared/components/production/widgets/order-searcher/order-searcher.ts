import { Component, computed, EventEmitter, inject, input, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../elements/ui-input/ui-input';
import { UiSelect } from '../../../../elements/ui-select/ui-select';
import { DocType } from '../../../../../models/production/doc-type';
import { finalize, Observable } from 'rxjs';
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
import { ProductionContextService } from '../../../../../services/production/production-context-service';

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
  contextService = inject(ProductionContextService);
  wslService = inject(WorkSpaceLoaderService);
  loaderServive = inject(LoaderService);
  @Output() onFoundDoc = new EventEmitter<ProductionOrder | null>();
  @Input() preloadedDocTypes: DocType[] | null | undefined;
  @Input() traceabilityMode = false;
  @Input() numberOnlySearch = false;
  // Default false conserva el comportamiento actual (todos los tipos de
  // documento); en true, el select de tipo solo muestra OP y OPT.
  restrictToOpAndOpt = input<boolean>(false);

  protected visibleDoctypes = computed(() =>
    this.restrictToOpAndOpt()
      ? this.doctypes().filter((d) => d.doc_type === 'OP' || d.doc_type === 'OPT')
      : this.doctypes(),
  );

  constructor(private fb: FormBuilder) {
    this.orderForm = fb.group({
      documentType: [null, Validators.required],
      documentNumber: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
    });
  }

  ngOnInit(): void {
    if (this.preloadedDocTypes?.length) {
      // El SP de tipos de documento devuelve códigos de ancho fijo con
      // espacios ('OP ', 'PS ') — normalizar acá igual que en getDocTypes(),
      // o el filtro de restrictToOpAndOpt (comparación exacta) los pierde.
      this.doctypes.set(this.preloadedDocTypes.map((d) => ({ ...d, doc_type: d.doc_type.trim() })));
    } else {
      this.getDocTypes();
    }

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

  // Módulos cuya máquina de estampación tiene uses_processes_search buscan la
  // OP vía /stamping/production-orders/processes/ en vez del endpoint
  // genérico — ver StampingModuleMachine.uses_processes_search.
  private fetchOrder(docType: string, docNumber: number): Observable<ProductionOrder> {
    const usesProcessesSearch = this.contextService.snapshot?.session?.current_module?.machine?.uses_processes_search;
    return usesProcessesSearch
      ? this.opStampingService.getProductionOrderProcesses(docType, docNumber)
      : (this.poService.getOrder({ documentType: docType, documentNumber: docNumber }, true) as Observable<ProductionOrder>);
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
            const activeOps = ops.filter((o) => o.status === 1 || o.status === 2);
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

    const { documentType, documentNumber } = this.orderForm.value;
    this.fetchOrder(documentType, documentNumber)
      .pipe(finalize(() => this.loaderServive.hideLoader()))
      .subscribe({
        next: (op) => this.onFoundDoc.emit(op),
        error: (err) => this.errorMessage.set('No se encontraron resultados'),
      });
  }

  selectResult(order: OrderTraceability) {
    this.results.set([]);
    this.errorMessage.set(null);
    this.loaderServive.showLoader();
    this.fetchOrder(order.documentType, order.documentNumber)
      .pipe(finalize(() => this.loaderServive.hideLoader()))
      .subscribe({
        next: (op) => this.onFoundDoc.emit(op),
        error: (err) => this.errorMessage.set('No se encontraron resultados'),
      });
  }
}
