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
import { SHIFT_CYCLES_CONFIG } from '../../../../../common/const/shift-cycles-config';

export type OrderSearcherArea = 'production' | 'stamping';
export type OrderSearcherTitleColor = 'default' | 'brand';

const TITLE_COLOR_CLASS: Record<OrderSearcherTitleColor, string> = {
  default: 'text-gray-900',
  brand: 'text-brand',
};

const CARD_CLASS = 'border border-slate-200 rounded-md p-4';

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
  // Area presets the search behavior (see SHIFT_CYCLES_CONFIG). The three flags
  // below are optional overrides: when left undefined, the area value applies.
  area = input<OrderSearcherArea>('production');
  @Input() traceabilityMode?: boolean;
  @Input() numberOnlySearch?: boolean;
  // Default false keeps the current behavior (all document types); when true,
  // the type select only shows OP and OPT.
  restrictToOpAndOpt = input<boolean>(false);
  // Stamping pages (shift-cycles, auditory) must stay inside the /stamping/
  // namespace — never fall back to the generic /production/production-orders/detail,
  // even if the module has no uses_processes_search. See fetchOrder().
  @Input() useStampingDetail?: boolean;

  // Header customization. Defaults reproduce the original header.
  title = input<string>('Buscar orden de producción');
  description = input<string>('Ingrese el tipo de documento (ej. OP) y el número para realizar la búsqueda.');
  titleColor = input<OrderSearcherTitleColor>('default');
  showHeader = input<boolean>(true);
  // Wraps the whole searcher in a bordered box (for when it fills its container).
  card = input<boolean>(false);

  protected titleClass = computed(() => TITLE_COLOR_CLASS[this.titleColor()]);
  protected formClass = computed(() => (this.card() ? `w-full ${CARD_CLASS}` : 'w-full'));

  private get areaConfig() {
    return SHIFT_CYCLES_CONFIG[this.area()];
  }

  protected get isTraceability(): boolean {
    return this.traceabilityMode ?? this.areaConfig.searchByNumberOnly;
  }

  protected get isNumberOnly(): boolean {
    return this.numberOnlySearch ?? this.areaConfig.searchByNumberOnly;
  }

  private get isStampingDetail(): boolean {
    return this.useStampingDetail ?? this.areaConfig.showStampingRecord;
  }

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
      // The doc-type SP returns fixed-width codes padded with spaces
      // ('OP ', 'PS ') — normalize here as in getDocTypes(), or the
      // restrictToOpAndOpt filter (exact comparison) drops them.
      this.doctypes.set(this.preloadedDocTypes.map((d) => ({ ...d, doc_type: d.doc_type.trim() })));
    } else {
      this.getDocTypes();
    }

    if (this.isNumberOnly) {
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

  // Modules whose stamping machine has uses_processes_search fetch the order
  // via /stamping/production-orders/processes/ instead of the generic endpoint
  // — see StampingModuleMachine.uses_processes_search. If that does not apply
  // but the searcher lives on a stamping page (stamping detail), the fallback
  // must not leave for /production/production-orders/detail either: it uses
  // /stamping/stamping-orders/detail (same data + orderedQty/referenceSams).
  private fetchOrder(docType: string, docNumber: number): Observable<ProductionOrder> {
    const usesProcessesSearch = this.contextService.snapshot?.session?.current_module?.machine?.uses_processes_search;
    if (usesProcessesSearch) return this.opStampingService.getProductionOrderProcesses(docType, docNumber);
    if (this.isStampingDetail) return this.opStampingService.getOrderDetail(docType, docNumber);
    return this.poService.getOrder({ documentType: docType, documentNumber: docNumber }, true) as Observable<ProductionOrder>;
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

    if (this.isTraceability) {
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
