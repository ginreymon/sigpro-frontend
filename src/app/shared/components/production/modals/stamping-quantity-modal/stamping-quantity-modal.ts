import { Component, EventEmitter, Input, Output, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../elements/ui-large-input/ui-large-input';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { Searcher } from '../../../form-controls/searcher/searcher';
import { UiLabelButton } from '../../../../elements/ui-label-button/ui-label-button';
import { AdditionalStampingTimeCard } from '../../cards/additional-stamping-time-card/additional-stamping-time-card';
import { StampingQuantityCounter } from '../../cards/stamping-quantity-counter/stamping-quantity-counter';
import { AdditionalStampingTimeService } from '../../../../../services/stamping/additional-stamping-time-service';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { AdditionalStampingTime } from '../../../../../models/stamping/additional-stamping-time';
import { StampingRecordContext } from '../../../../../models/stamping/stamping-record-context';
import { moduleMachineParams } from '../../../../../common/functions/additional-time-filters';
import { TabItem, UiTabs } from "../../../../elements/ui-tabs/ui-tabs";

export interface StampingQuantityModalSave {
  completed_quantity: number;
  additional_times: { id: number; count: number }[];
}

// Edición de un registro de estampación ya guardado — a diferencia de
// app-quantity-modal (producción, crea o edita), este modal solo edita:
// crear un registro nuevo sigue siendo flujo exclusivo de app-stamping-record.
// Además de completed_quantity (estampación no tiene rejected/scrap_quantity),
// permite reasignar los tiempos adicionales del registro.
@Component({
  selector: 'app-stamping-quantity-modal',
  standalone: true,
  imports: [
    BoxLayout, UiButton, UiFormField, UiLargeInput, ReactiveFormsModule, UiErrorMessage,  StampingQuantityCounter, UiTabs
  ],
  templateUrl: './stamping-quantity-modal.html',
})
export class StampingQuantityModal {
  visible = input<boolean>(false);
  @Input() editRecord: StampingRecordContext | null = null;
  @Input() initialAdditionalTimes: { id: number; count: number }[] = [];
  @Input() maxAvailable = 0;
  // Para la barra de progreso: avance de la referencia SAM sin contar el
  // aporte propio de este registro (se suma en vivo vía newCompletedQty).
  @Input() orderedQtyForSam = 0;
  @Input() stampedQtyBaseForSam = 0;
  @Input() enable = true;

  @Output() onSave = new EventEmitter<StampingQuantityModalSave>();
  @Output() onClose = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private additionalTimeService = inject(AdditionalStampingTimeService);
  private productionContextService = inject(ProductionContextService);

  protected tabs: TabItem[] = [    
    { key: 'quantities', label: 'Cantidades' },
    { key: 'additionaltimes', label: 'Tiempos Adicionales' },
  ];

  protected activeTab = signal('quantities');
  protected isSubmitting = signal(false);
  protected additionalTimes = signal<AdditionalStampingTime[]>([]);
  protected selectedAdditionalTimeIds = signal<number[]>([]);
  protected additionalTimeQuantities = signal<Record<number, number>>({});
  private additionalTimesSearchText = signal('');
  protected showOnlySelectedAdditionalTimes = signal(false);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.loadAdditionalTimes();
        const ids = this.initialAdditionalTimes.map((t) => t.id);
        const quantities = Object.fromEntries(this.initialAdditionalTimes.map((t) => [t.id, t.count]));
        untracked(() => {
          this.selectedAdditionalTimeIds.set(ids);
          this.additionalTimeQuantities.set(quantities);
          if (this.editRecord) {
            this.recordForm.patchValue({ completed_quantity: this.editRecord.completed_quantity });
          }
        });
      } else {
        untracked(() => {
          this.recordForm.reset({ completed_quantity: null });
          this.selectedAdditionalTimeIds.set([]);
          this.additionalTimeQuantities.set({});
          this.additionalTimesSearchText.set('');
          this.showOnlySelectedAdditionalTimes.set(false);
        });
      }
    });
  }

  protected onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  protected get tabsView(): TabItem[] {
    const tabs = this.tabs;
    return tabs;
  }

  recordForm: FormGroup = this.fb.group(
    {
      completed_quantity: [null, [Validators.required, Validators.min(0), this.integerValidator]],
    },
    { validators: [this.exceedsMaxValidator.bind(this)] },
  );

  protected get newCompletedQty(): number {
    return Number(this.recordForm.get('completed_quantity')?.value) || 0;
  }

  get exceedsMaxError(): { max: number; total: number } | null {
    return this.recordForm.errors?.['exceedsMax'] ?? null;
  }

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

  protected searchAdditionalTimes(text: string): void {
    this.additionalTimesSearchText.set(text);
  }

  protected isSelected(id: number): boolean {
    return this.selectedAdditionalTimeIds().includes(id);
  }

  protected toggleAdditionalTime(id: number): void {
    const willSelect = !this.selectedAdditionalTimeIds().includes(id);

    this.selectedAdditionalTimeIds.update((ids) =>
      willSelect ? [...ids, id] : ids.filter((x) => x !== id),
    );

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
    const safeValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
    this.additionalTimeQuantities.update((quantities) => ({ ...quantities, [id]: safeValue }));
  }

  private loadAdditionalTimes(): void {
    const machine = this.productionContextService.snapshot?.session?.current_module?.machine;
    this.additionalTimeService.all(moduleMachineParams(machine)).subscribe((items) => this.additionalTimes.set(items));
  }

  private integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return Number.isInteger(Number(value)) ? null : { notInteger: true };
  }

  private exceedsMaxValidator(group: AbstractControl): ValidationErrors | null {
    const completed = Number(group.get('completed_quantity')?.value) || 0;
    return completed > this.maxAvailable ? { exceedsMax: { max: this.maxAvailable, total: completed } } : null;
  }

  cancel(): void {
    this.onClose.emit();
  }

  save(): void {
    if (this.recordForm.invalid || this.isSubmitting() || !this.enable) return;
    const additional_times = this.selectedAdditionalTimeIds().map((id) => ({ id, count: this.getQuantity(id) }));
    this.onSave.emit({
      completed_quantity: Number(this.recordForm.value.completed_quantity),
      additional_times,
    });
  }
}
