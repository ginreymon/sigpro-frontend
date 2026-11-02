import { Component, EventEmitter, Input, Output, signal, computed, input, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiMultiStepForm, MultiStepConfig } from '../../../../elements/ui-multi-step-form/ui-multi-step-form';
import { UiStep, UiSummary } from '../../../../elements/ui-multi-step-form/ui-step.directive';
import { WindowStatus } from '../../../widgets/window-status/window-status';
import { TimeProgressCircle } from '../../../widgets/time-progress-circle/time-progress-circle';
import { ReferenceTab } from './tabs/reference-tab/reference-tab';
import { QuantitiesTab } from './tabs/quantities-tab/quantities-tab';
import { AdditionalTimesTab } from './tabs/additionaltimes-tab/additionaltimes-tab';
import { StampingRecordDataService } from './stamping-record-data-service';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { StampingReferenceSam } from '../../../../../models/stamping/stamping-reference-sam';
import { StampingRecord as StampingRecordPayload } from '../../../../../models/stamping/stamping-record';
import { WorkBreakRecord } from '../../../../../models/production/work-break-record';
import { searchAdditionalTimes, searchReferenceSams } from '../../../../../common/functions/additional-time-filters';
import { AppConfigService } from '../../../../../services/core/app-config-service';

@Component({
  selector: 'app-stamping-record',
  standalone: true,
  imports: [
    BoxLayout, UiButton, UiIcon, UiMultiStepForm, UiStep, UiSummary, TimeProgressCircle, WindowStatus, ReactiveFormsModule,
    ReferenceTab, QuantitiesTab, AdditionalTimesTab,
  ],
  providers: [StampingRecordDataService],
  templateUrl: './stamping-record.html',
})
export class StampingRecord {
  visible = input<boolean>(false);
  @Input() inWindow = false;
  // Active work break of the session; while set, registering is blocked and a paused banner is shown.
  @Input() activeBreak: WorkBreakRecord | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<Partial<StampingRecordPayload>>();

  // Frozen reference for the paused clock: start of the hour the pause was seen in.
  protected pausedHourStart = new Date(new Date().setMinutes(0, 0, 0));
  protected pausedNow = new Date();

  protected dataService = inject(StampingRecordDataService);
  private productionContextService = inject(ProductionContextService);
  private appConfig = inject(AppConfigService);
  private fb = inject(FormBuilder);

  // StampingRecordManual always forces inWindow=true (it does not depend on
  // STAMPING_CAL_WINDOW), so the window notice does not apply there.
  protected showWindowStatus = true;
  protected saveButtonLabel = 'Guardar';

  protected submitAttempted = signal(false);
  protected selectedAdditionalTimeIds = signal<number[]>([]);
  protected additionalTimeQuantities = signal<Record<number, number>>({});
  private additionalTimesSearchText = signal('');
  protected showOnlySelectedAdditionalTimes = signal(false);

  protected selectedReferenceSamId = signal<number | null>(null);
  private referencesSearchText = signal('');

  // Completed only when ALL the SAMs of the order have nothing pending — each
  // SAM is an independent process, so a single one is not enough to close the order.
  // Declared before recordForm: its validator runs synchronously when the
  // FormGroup is built and already needs to read isOrderCompleted at that point.
  protected isOrderCompleted = computed(() => {
    const detail = this.dataService.orderDetail();
    const sams = detail?.referenceSams ?? [];
    if (!detail || Number(detail.orderedQty) <= 0 || sams.length === 0) return false;
    return sams.every((sam) => Number(sam.pending_qty) <= 0);
  });

  protected recordForm: FormGroup = this.fb.group(
    {
      stamping_reference_sam: [null, Validators.required],
      completed_quantity: [null, [Validators.required, Validators.min(1), this.integerValidator.bind(this)]],
      additional_times: [[] as number[]],
    },
    { validators: [this.exceedsMaxValidator.bind(this)] },
  );

  protected filteredAdditionalTimes = computed(() =>
    searchAdditionalTimes(this.dataService.additionalTimes(), this.additionalTimesSearchText()),
  );

  protected displayedAdditionalTimes = computed(() => {
    const list = this.filteredAdditionalTimes();
    if (!this.showOnlySelectedAdditionalTimes()) return list;
    const ids = this.selectedAdditionalTimeIds();
    return list.filter((item) => ids.includes(item.id));
  });

  // A completed SAM (nothing pending) cannot be registered any further —
  // it is removed from the selection list instead of being shown inactive.
  protected filteredReferences = computed(() =>
    searchReferenceSams(
      this.referenceSamsSnapshot().filter((item) => Number(item.pending_qty) > 0),
      this.referencesSearchText(),
    ),
  );

  protected get totalOrderedQuantity(): number {
    return Number(this.dataService.orderDetail()?.orderedQty) || 0;
  }

  // Extension point: StampingRecordManual overrides it to subtract the records
  // not yet persisted (ManualStampingRecordsStore), since that flow does not
  // save to the DB and the backend pending_qty/stamped_qty are therefore not
  // updated on their own when registering.
  protected referenceSamsSnapshot(): StampingReferenceSam[] {
    return this.dataService.referenceSams();
  }

  // Pending/stamped is validated per selected SAM, not against the order total:
  // each SAM (depending on the module that stamped) is an independent process on
  // the same order and must not share progress with another SAM.
  protected get selectedReferenceSam(): StampingReferenceSam | null {
    const id = this.selectedReferenceSamId();
    return this.referenceSamsSnapshot().find((sam) => sam.id === id) ?? null;
  }

  protected get hasSelectedReference(): boolean {
    return !!this.selectedReferenceSam;
  }

  protected get totalPendingQuantity(): number {
    if (this.isOrderCompleted()) return 0;
    return Number(this.selectedReferenceSam?.pending_qty) || 0;
  }

  // Once the order is completed no SAM is selectable (all have nothing pending),
  // so the counter must add up what every SAM has stamped instead of relying on
  // a selection that no longer exists.
  protected get totalStampedQuantity(): number {
    if (this.isOrderCompleted()) {
      return this.referenceSamsSnapshot().reduce((sum, sam) => sum + (Number(sam.stamped_qty) || 0), 0);
    }
    return Number(this.selectedReferenceSam?.stamped_qty) || 0;
  }

  protected get newCompletedQty(): number {
    return Number(this.recordForm.get('completed_quantity')?.value) || 0;
  }

  protected get exceedsMaxError(): { max: number; total: number } | null {
    return this.recordForm.errors?.['exceedsMax'] ?? null;
  }

  protected get completedQuantityControl(): FormControl {
    return this.recordForm.get('completed_quantity') as FormControl;
  }

  // Calender-type machines (uses_processes_search=true) measure in fractional
  // units; all other machines only produce whole pieces.
  protected get usesProcessesSearch(): boolean {
    return !!this.productionContextService.snapshot?.session?.current_module?.machine?.uses_processes_search;
  }

  // Additional times only apply to an already defined, valid quantity (not above
  // what is pending) — if it becomes invalid, the tab closes by itself.
  protected get hasValidQuantity(): boolean {
    if (this.isOrderCompleted()) return true;
    return !!this.recordForm.get('completed_quantity')?.valid && !this.exceedsMaxError;
  }

  protected get orderLabel(): string {
    const order = this.productionContextService.snapshot?.order;
    return order ? `${order.documentType} ${order.documentNumber}` : '';
  }

  protected get windowSeconds(): number {
    return this.appConfig.stampingCalibrationWindowSeconds;
  }

  // Same rule as app-shift-hourly-record's "Registrar": enabled only inside the
  // process window; empty string means enabled, otherwise it is the tooltip text.
  protected get saveDisabledReason(): string {
    if (this.activeBreak) return 'Jornada pausada';
    return this.inWindow ? '' : 'Disponible dentro de la ventana de registro';
  }

  // Re-evaluates the step validity whenever the shared form changes (form state is not a signal).
  private formState = toSignal(this.recordForm.valueChanges.pipe(startWith(null)));

  protected selectedAdditionalTimes = computed(() => {
    const ids = this.selectedAdditionalTimeIds();
    return this.dataService.additionalTimes().filter((item) => ids.includes(item.id));
  });

  // The three former tabs, now steps of one form. Validity gates "Siguiente":
  // a step is blocked until the previous ones are valid (the quantity needs a SAM,
  // additional times need a valid quantity). Completed orders only show quantities.
  protected stepsView = computed<MultiStepConfig[]>(() => {
    this.formState();
    if (this.isOrderCompleted()) return [{ key: 'quantities', label: 'Cantidades' }];
    return [
      { key: 'reference', label: 'Referencia', valid: this.hasSelectedReference },
      { key: 'quantities', label: 'Cantidades', valid: this.hasValidQuantity },
      { key: 'additionaltimes', label: 'Tiempos adicionales', valid: !this.hasInvalidAdditionalTimeQuantity },
    ];
  });

  protected get hasInvalidAdditionalTimeQuantity(): boolean {
    return this.selectedAdditionalTimeIds().some((id) => this.getQuantity(id) <= 0);
  }

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.dataService.loadModalData();
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
          this.referencesSearchText.set('');
          this.additionalTimesSearchText.set('');
        });
      }
    });
    effect(() => {
      if (this.showOnlySelectedAdditionalTimes() && this.selectedAdditionalTimeIds().length === 0) {
        untracked(() => this.showOnlySelectedAdditionalTimes.set(false));
      }
    });
  }

  protected searchAdditionalTimes(text: string): void {
    this.additionalTimesSearchText.set(text);
  }

  protected searchReferences(text: string): void {
    this.referencesSearchText.set(text);
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

  protected selectReference(id: number): void {
    const newId = this.selectedReferenceSamId() === id ? null : id;
    this.selectedReferenceSamId.set(newId);
    this.recordForm.patchValue({ stamping_reference_sam: newId, completed_quantity: null });
  }

  protected close(): void {
    this.onClose.emit();
  }

  protected register(): void {
    if (!this.inWindow || this.activeBreak) return;

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

  // Only applies to non-calender machines: calender ones do allow fractional
  // quantities (see usesProcessesSearch).
  private integerValidator(control: AbstractControl): ValidationErrors | null {
    if (this.usesProcessesSearch) return null;
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
}
