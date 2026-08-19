import { Component, EventEmitter, Input, Output, signal, computed, input, effect, inject, untracked } from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiTabs, TabItem } from '../../../../elements/ui-tabs/ui-tabs';
import { ShiftCyclesFab } from '../shift-cycles-fab/shift-cycles-fab';
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
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { filterByMachine, filterByMachineType } from '../../../../../common/functions/additional-time-filters';

@Component({
  selector: 'app-stamping-record',
  standalone: true,
  imports: [
    BoxLayout, UiButton, UiIcon, UiTabs, ShiftCyclesFab, Searcher,
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
  private appConfig = inject(AppConfigService);
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

  protected recordForm: FormGroup = this.fb.group(
    {
      stamping_reference_sam: [null, Validators.required],
      completed_quantity: [null, [Validators.required, Validators.min(1), this.integerValidator]],
      additional_times: [[] as number[]],
    },
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
    // Un SAM ya completo (sin pendiente) no se puede seguir registrando —
    // se quita de la lista de selección en vez de mostrarlo inactivo.
    const list = this.referenceSams().filter((item) => Number(item.pending_qty) > 0);
    if (!q) return list;
    return list.filter(
      (item) =>
        item.reference_code.toLowerCase().includes(q) ||
        (item.machine_type_name ?? '').toLowerCase().includes(q),
    );
  });

  protected get totalOrderedQuantity(): number {
    return Number(this.orderDetail()?.orderedQty) || 0;
  }

  // El pendiente/estampado se valida por SAM seleccionado, no por el total del OP:
  // cada SAM (según el módulo que estampó) es un proceso independiente sobre la
  // misma OP y no debe compartir avance con otro SAM.
  protected get selectedReferenceSam(): StampingReferenceSam | null {
    const id = this.selectedReferenceSamId();
    return this.referenceSams().find((sam) => sam.id === id) ?? null;
  }

  protected get hasSelectedReference(): boolean {
    return !!this.selectedReferenceSam;
  }

  protected get totalPendingQuantity(): number {
    return Number(this.selectedReferenceSam?.pending_qty) || 0;
  }

  protected get totalStampedQuantity(): number {
    return Number(this.selectedReferenceSam?.stamped_qty) || 0;
  }

  protected get newCompletedQty(): number {
    return Number(this.recordForm.get('completed_quantity')?.value) || 0;
  }

  protected get exceedsMaxError(): { max: number; total: number } | null {
    return this.recordForm.errors?.['exceedsMax'] ?? null;
  }

  // Completada solo si TODOS los SAM de la OP ya no tienen pendiente — cada
  // SAM es un proceso independiente, así que uno solo no basta para cerrar la OP.
  protected isOrderCompleted = computed(() => {
    const detail = this.orderDetail();
    const sams = detail?.referenceSams ?? [];
    if (!detail || Number(detail.orderedQty) <= 0 || sams.length === 0) return false;
    return sams.every((sam) => Number(sam.pending_qty) <= 0);
  });

  protected get orderLabel(): string {
    const order = this.productionContextService.snapshot?.order;
    return order ? `${order.documentType} ${order.documentNumber}` : '';
  }

  protected get windowRange(): { start: string; end: string } {
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const nextHour = new Date(hourStart.getTime() + 3600_000);
    const windowSeconds = this.appConfig.stampingCalibrationWindowSeconds;
    const start = new Date(nextHour.getTime() - windowSeconds * 1000);
    const end = new Date(nextHour.getTime() + windowSeconds * 1000);
    const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return { start: fmt(start), end: fmt(end) };
  }

  protected get tabsView(): TabItem[] {
    const tabs = this.isOrderCompleted()
      ? this.tabs.filter((tab) => tab.key === 'quantities')
      : this.tabs;
    return tabs.map((tab) => ({ ...tab, hasError: this.tabHasError(tab.key) }));
  }

  private tabHasError(key: string): boolean {
    if (!this.submitAttempted()) return false;
    if (key === 'reference') return this.recordForm.get('stamping_reference_sam')?.invalid ?? false;
    if (key === 'quantities') {
      return this.recordForm.get('completed_quantity')?.invalid || !!this.exceedsMaxError;
    }
    if (key === 'additionaltimes') return this.hasInvalidAdditionalTimeQuantity;
    return false;
  }

  private readonly tabControlNames: Record<string, string[]> = {
    reference: ['stamping_reference_sam'],
    quantities: ['completed_quantity'],
    additionaltimes: [],
  };

  protected get currentTabIndex(): number {
    return this.tabsView.findIndex((tab) => tab.key === this.activeTab());
  }

  protected get isLastTab(): boolean {
    return this.currentTabIndex === this.tabsView.length - 1;
  }

  protected get hasInvalidAdditionalTimeQuantity(): boolean {
    return this.selectedAdditionalTimeIds().some((id) => this.getQuantity(id) <= 0);
  }

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.loadModalData();
      } else {
        untracked(() => {
          this.recordForm.reset({
            stamping_reference_sam: null,
            completed_quantity: null,
            additional_times: [],
          });
          this.selectedReferenceSamId.set(null);
          this.selectedAdditionalTimeIds.set([]);
          this.additionalTimeQuantities.set({});
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
      if (this.isOrderCompleted()) {
        untracked(() => this.activeTab.set('quantities'));
      }
    });
  }

  protected onTabChange(key: string): void {
    this.activeTab.set(key);
    // Each tab renders its own app-searcher instance (@if/@else-if), so it
    // always mounts empty — reset the matching filter signal too, or the
    // list stays filtered by a stale query the visible input no longer shows.
    this.additionalTimesSearchText.set('');
    this.referencesSearchText.set('');
  }

  protected goToNextTab(): void {
    const key = this.activeTab();
    this.submitAttempted.set(true);
    this.markTabControlsTouched(key);
    if (this.tabHasError(key)) return;

    const next = this.tabsView[this.currentTabIndex + 1];
    if (next) this.onTabChange(next.key);
  }

  private markTabControlsTouched(key: string): void {
    (this.tabControlNames[key] ?? []).forEach((name) => {
      const control = this.recordForm.get(name);
      control?.markAsTouched();
      control?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
    });
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
    const willSelect = !this.selectedAdditionalTimeIds().includes(id);

    this.selectedAdditionalTimeIds.update((ids) => {
      const updated = willSelect ? [...ids, id] : ids.filter((x) => x !== id);
      this.recordForm.patchValue({ additional_times: updated });
      return updated;
    });

    // Selecting seeds a count of 1 (matches the backend default); deselecting
    // drops it so stale counts don't linger if the card is picked again.
    this.additionalTimeQuantities.update((quantities) => {
      if (willSelect) return quantities[id] ? quantities : { ...quantities, [id]: 1 };
      const { [id]: _removed, ...rest } = quantities;
      return rest;
    });
  }

  protected getQuantity(id: number): number {
    return this.additionalTimeQuantities()[id] ?? 1;
  }

  protected setQuantity(id: number, value: number): void {
    const safeValue = Number.isFinite(value) ? Math.floor(value) : 0;
    this.additionalTimeQuantities.update((quantities) => ({ ...quantities, [id]: safeValue }));
  }

  protected isReferenceSelected(id: number): boolean {
    return this.selectedReferenceSamId() === id;
  }

  protected selectReference(id: number): void {
    const newId = this.selectedReferenceSamId() === id ? null : id;
    this.selectedReferenceSamId.set(newId);
    this.recordForm.patchValue({ stamping_reference_sam: newId, completed_quantity: null });
  }

  protected close(): void {
    this.onClose.emit();
  }

  protected register(): void {
    if (!this.inWindow) return;

    this.submitAttempted.set(true);

    if (!this.validateRecordForm()) return;
    if (this.hasInvalidAdditionalTimeQuantity) return;

    const order = this.productionContextService.snapshot?.order;
    if (!order) return;

    const payload: Partial<StampingRecordPayload> = {
      op_rowid: order.rowId,
      op_number: order.documentNumber,
      op_type: order.documentType,
      stamping_reference_sam: this.recordForm.value.stamping_reference_sam,
      ordered_quantity: this.totalOrderedQuantity,
      completed_quantity: Number(this.recordForm.value.completed_quantity),
      additional_times: (this.recordForm.value.additional_times as number[]).map((id) => ({
        id,
        count: this.getQuantity(id),
      })),
    };

    this.onSave.emit(payload);
  }

  private validateRecordForm(): boolean {
    this.recordForm.markAllAsTouched();
    Object.keys(this.recordForm.controls).forEach((key) => {
      this.recordForm.get(key)?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
    });
    return this.recordForm.valid;
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
          const moduleMachineTypeId = this.moduleMachineTypeId();
          const moduleMachineId = this.moduleMachineId();
          this.additionalTimes.set(filterByMachine(filterByMachineType(additionalTimes, moduleMachineTypeId), moduleMachineId));
          this.orderDetail.set(orderDetail);
          const references = filterByMachineType(orderDetail?.referenceSams ?? [], moduleMachineTypeId);
          this.referenceSams.set(references);
        },
      });
  }

  private moduleMachineTypeId(): number | null {
    return this.productionContextService.snapshot?.session?.current_module?.machine?.machine_type_id ?? null;
  }

  private moduleMachineId(): number | null {
    return this.productionContextService.snapshot?.session?.current_module?.machine?.id ?? null;
  }
}
