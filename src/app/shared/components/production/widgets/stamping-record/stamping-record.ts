import { Component, EventEmitter, Input, Output, signal, computed, input, effect, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiTabs, TabItem } from '../../../../elements/ui-tabs/ui-tabs';
import { ShiftCyclesActions } from '../shift-cycles-actions/shift-cycles-actions';
import { UiLoader } from '../../../../elements/ui-loader/ui-loader';
import { Searcher } from '../../../form-controls/searcher/searcher';
import { AdditionalStampingTimeCard } from '../../cards/additional-stamping-time-card/additional-stamping-time-card';
import { AdditionalStampingTimeService } from '../../../../../services/stamping/additional-stamping-time-service';
import { AdditionalStampingTime } from '../../../../../models/stamping/additional-stamping-time';
import { SHIFT_CYCLES_CONFIG } from '../../../../../common/const/shift-cycles-config';

@Component({
  selector: 'app-stamping-record',
  standalone: true,
  imports: [BoxLayout, UiButton, UiIcon, UiTabs, ShiftCyclesActions, UiLoader, Searcher, AdditionalStampingTimeCard],
  templateUrl: './stamping-record.html',
})
export class StampingRecord {
  visible = input<boolean>(false);
  @Input() inWindow = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onFinalize = new EventEmitter<void>();

  private additionalTimeService = inject(AdditionalStampingTimeService);

  protected stampingConfig = SHIFT_CYCLES_CONFIG['stamping'];

  protected tabs: TabItem[] = [
    { key: 'produccion', label: 'Producción' },
    { key: 'tiempos_adicionales', label: 'Tiempos Adicionales' },
  ];

  protected activeTab = signal('produccion');
  protected isLoadingAdditionalTimes = signal(false);
  protected additionalTimes = signal<AdditionalStampingTime[]>([]);
  protected selectedAdditionalTimeIds = signal<number[]>([]);
  protected additionalTimeQuantities = signal<Record<number, number>>({});
  private additionalTimesSearchText = signal('');

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

  constructor() {
    effect(() => {
      if (this.visible()) this.loadAdditionalTimes();
    });
  }

  protected onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  protected searchAdditionalTimes(text: string): void {
    this.additionalTimesSearchText.set(text);
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

  protected setQuantity(id: number, value: string): void {
    this.additionalTimeQuantities.update((quantities) => ({ ...quantities, [id]: Number(value) || 0 }));
  }

  protected close(): void {
    this.onClose.emit();
  }

  private loadAdditionalTimes(): void {
    this.isLoadingAdditionalTimes.set(true);
    this.additionalTimeService.all()
      .pipe(finalize(() => this.isLoadingAdditionalTimes.set(false)))
      .subscribe({
        next: (data) => this.additionalTimes.set(data),
      });
  }
}
