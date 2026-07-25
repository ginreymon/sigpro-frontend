import { Component, EventEmitter, Input, Output, signal, computed, input, effect, inject, untracked } from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiTabs, TabItem } from '../../../../elements/ui-tabs/ui-tabs';
import { ShiftCyclesActions } from '../shift-cycles-actions/shift-cycles-actions';
import { Searcher } from '../../../form-controls/searcher/searcher';
import { UiLabelButton } from '../../../../elements/ui-label-button/ui-label-button';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../elements/ui-large-input/ui-large-input';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { AdditionalStampingTimeCard } from '../../cards/additional-stamping-time-card/additional-stamping-time-card';
import { StampingReferenceCard } from '../../cards/stamping-reference-card/stamping-reference-card';
import { StampingQuantityCounter } from '../../cards/stamping-quantity-counter/stamping-quantity-counter';
import { AdditionalStampingTimeService } from '../../../../../services/stamping/additional-stamping-time-service';
import { OPStampingService } from '../../../../../services/stamping/op-stamping-service';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { AdditionalStampingTime } from '../../../../../models/stamping/additional-stamping-time';
import { StampingOrderDetail } from '../../../../../models/stamping/stamping-order-detail';
import { StampingReferenceSam } from '../../../../../models/stamping/stamping-reference-sam';
import { StampingRecord as StampingRecordPayload } from '../../../../../models/stamping/stamping-record';
import { SHIFT_CYCLES_CONFIG } from '../../../../../common/const/shift-cycles-config';
import { LoaderService } from '../../../../../services/common/loader-service';

@Component({
  selector: 'app-stamping-record',
  standalone: true,
  imports: [
    BoxLayout, UiButton, UiIcon, UiTabs, ShiftCyclesActions, Searcher,
    AdditionalStampingTimeCard, StampingReferenceCard, StampingQuantityCounter, UiLabelButton,
    ReactiveFormsModule, UiFormField, UiLargeInput, UiErrorMessage,
  ],
  templateUrl: './stamping-record.html',
})
export class StampingRecord {
  visible = input<boolean>(false);
  @Input() inWindow = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onFinalize = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<Partial<StampingRecordPayload>>();

  private additionalTimeService = inject(AdditionalStampingTimeService);
  private opStampingService = inject(OPStampingService);
  private productionContextService = inject(ProductionContextService);
  private loaderService = inject(LoaderService);
  private fb = inject(FormBuilder);

  protected stampingConfig = SHIFT_CYCLES_CONFIG['stamping'];

  protected tabs: TabItem[] = [
    { key: 'reference', label: 'Referencia' },
    { key: 'quantities', label: 'Cantidades' },
    { key: 'additionaltimes', label: 'Tiempos Adicionales' },
  ];

  protected activeTab = signal('reference');
  protected isLoadingModalData = signal(false);
  protected submitAttempted = signal(false);
  protected additionalTimes = signal<AdditionalStampingTime[]>([]);
  protected selectedAdditionalTimeIds = signal<number[]>([]);
  protected additionalTimeQuantities = signal<Record<number, number>>({});
  private additionalTimesSearchText = signal('');
  protected showOnlySelectedAdditionalTimes = signal(false);

  protected orderDetail = signal<StampingOrderDetail | null>(null);
  protected referenceSams = signal<StampingReferenceSam[]>([]);
  protected selectedReferenceSamId = signal<number | null>(null);
  private referencesSearchText = signal('');
  protected showOnlySelectedReference = signal(false);

  protected quantityForm: FormGroup = this.fb.group(
    { completed_quantity: [null, [Validators.required, Validators.min(1), this.integerValidator]] },
    { validators: [this.exceedsMaxValidator.bind(this)] },
  );

  protected filteredAdditionalTimes = computed(() => {
    const q = this.additionalTimesSearchText().toLowerCase().trim();
    const list = this.additionalTimes();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.process.toLowerCase().includes(q) ||
        item.code_number.toLowerCase().includes(q) ||
        item.engineering_code.toLowerCase().includes(q),
    );
  });

  protected displayedAdditionalTimes = computed(() => {
    const list = this.filteredAdditionalTimes();
    if (!this.showOnlySelectedAdditionalTimes()) return list;
    const ids = this.selectedAdditionalTimeIds();
    return list.filter((item) => ids.includes(item.id));
  });

  protected filteredReferences = computed(() => {
    const q = this.referencesSearchText().toLowerCase().trim();
    const list = this.referenceSams();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.identification.toLowerCase().includes(q) ||
        (item.machine_type_name ?? '').toLowerCase().includes(q),
    );
  });

  protected displayedReferences = computed(() => {
    const list = this.filteredReferences();
    if (!this.showOnlySelectedReference()) return list;
    const id = this.selectedReferenceSamId();
    return list.filter((item) => item.id === id);
  });

  protected get totalOrderedQuantity(): number {
    return Number(this.orderDetail()?.orderedQty) || 0;
  }

  protected get totalPendingQuantity(): number {
    return Number(this.orderDetail()?.pendingQty) || 0;
  }

  protected get totalStampedQuantity(): number {
    return Number(this.orderDetail()?.stampedQty) || 0;
  }

  protected get newCompletedQty(): number {
    return Number(this.quantityForm.get('completed_quantity')?.value) || 0;
  }

  protected get exceedsMaxError(): { max: number; total: number } | null {
    return this.quantityForm.errors?.['exceedsMax'] ?? null;
  }

  protected get canSubmit(): boolean {
    return this.selectedReferenceSamId() !== null && this.quantityForm.valid;
  }

  protected get tabsView(): TabItem[] {
    return this.tabs.map((tab) => ({ ...tab, hasError: this.tabHasError(tab.key) }));
  }

  private tabHasError(key: string): boolean {
    if (!this.submitAttempted()) return false;
    if (key === 'reference') return this.selectedReferenceSamId() === null;
    if (key === 'quantities') return this.quantityForm.invalid;
    return false;
  }

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.loadModalData();
      } else {
        untracked(() => {
          this.quantityForm.reset({ completed_quantity: null });
          this.selectedReferenceSamId.set(null);
          this.submitAttempted.set(false);
        });
      }
    });
    effect(() => {
      if (this.showOnlySelectedAdditionalTimes() && this.selectedAdditionalTimeIds().length === 0) {
        untracked(() => this.showOnlySelectedAdditionalTimes.set(false));
      }
    });
    effect(() => {
      if (this.showOnlySelectedReference() && this.selectedReferenceSamId() === null) {
        untracked(() => this.showOnlySelectedReference.set(false));
      }
    });
  }

  protected onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  protected searchAdditionalTimes(text: string): void {
    this.additionalTimesSearchText.set(text);
  }

  protected searchReferences(text: string): void {
    this.referencesSearchText.set(text);
  }

  protected isSelected(id: number): boolean {
    return this.selectedAdditionalTimeIds().includes(id);
  }

  protected toggleAdditionalTime(id: number): void {
    this.selectedAdditionalTimeIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  protected getQuantity(id: number): number {
    return this.additionalTimeQuantities()[id] ?? 0;
  }

  protected setQuantity(id: number, value: number): void {
    this.additionalTimeQuantities.update((quantities) => ({ ...quantities, [id]: value || 0 }));
  }

  protected isReferenceSelected(id: number): boolean {
    return this.selectedReferenceSamId() === id;
  }

  protected selectReference(id: number): void {
    this.selectedReferenceSamId.set(id);
  }

  protected close(): void {
    this.onClose.emit();
  }

  protected register(): void {
    this.submitAttempted.set(true);
    this.quantityForm.markAllAsTouched();

    if (!this.canSubmit) return;

    const order = this.productionContextService.snapshot?.order;
    if (!order) return;

    const payload: Partial<StampingRecordPayload> = {
      op_rowid: order.rowId,
      op_number: order.documentNumber,
      op_type: order.documentType,
      stamping_reference_sam: this.selectedReferenceSamId(),
      ordered_quantity: this.totalOrderedQuantity,
      completed_quantity: Number(this.quantityForm.value.completed_quantity),
    };

    this.onSave.emit(payload);
  }

  private integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return Number.isInteger(Number(value)) ? null : { notInteger: true };
  }

  private exceedsMaxValidator(group: AbstractControl): ValidationErrors | null {
    const completed = Number(group.get('completed_quantity')?.value) || 0;
    return completed > this.totalPendingQuantity
      ? { exceedsMax: { max: this.totalPendingQuantity, total: completed } }
      : null;
  }

  private loadModalData(): void {
    this.isLoadingModalData.set(true);
    this.loaderService.showLoader();

    const order = this.productionContextService.snapshot?.order;
    const orderDetail$ = order
      ? this.opStampingService.getOrderDetail(order.documentType, order.documentNumber)
      : of<StampingOrderDetail | null>(null);

    forkJoin({
      additionalTimes: this.additionalTimeService.all(),
      orderDetail: orderDetail$,
    })
      .pipe(finalize(() => {
        this.isLoadingModalData.set(false);
        this.loaderService.hideLoader();
      }))
      .subscribe({
        next: ({ additionalTimes, orderDetail }) => {
          this.additionalTimes.set(this.filterByMachineType(additionalTimes));
          this.orderDetail.set(orderDetail);
          const references = this.filterByMachineType(orderDetail?.referenceSams ?? []);
          this.referenceSams.set(references);
          this.selectedReferenceSamId.set(references.length === 1 ? references[0].id : null);
        },
      });
  }

  // Referencias SAM y tiempos adicionales se filtran por tipo de máquina del módulo activo,
  // no por unidad física específica.
  private filterByMachineType<T extends { machine_type?: number | null }>(items: T[]): T[] {
    const moduleMachineTypeId =
      this.productionContextService.snapshot?.session?.current_module?.machine?.machine_type_id ?? null;
    if (!moduleMachineTypeId) return items;
    return items.filter((item) => item.machine_type == null || item.machine_type === moduleMachineTypeId);
  }
}
