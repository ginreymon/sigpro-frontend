import { Component, EventEmitter, Input, Output, signal, computed, input, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiCheckbox } from '../../../../elements/ui-checkbox/ui-checkbox';
import { UiTabs, TabItem } from '../../../../elements/ui-tabs/ui-tabs';
import { ShiftCyclesActions } from '../shift-cycles-actions/shift-cycles-actions';
import { UiLoader } from '../../../../elements/ui-loader/ui-loader';
import { Searcher } from '../../../form-controls/searcher/searcher';
import { AdditionalStampingTimeService } from '../../../../../services/stamping/additional-stamping-time-service';
import { AdditionalStampingTime } from '../../../../../models/stamping/additional-stamping-time';

@Component({
  selector: 'app-stamping-record',
  standalone: true,
  imports: [BoxLayout, UiButton, UiIcon, UiCheckbox, UiTabs, ShiftCyclesActions, UiLoader, Searcher, FormsModule],
  templateUrl: './stamping-record.html',
})
export class StampingRecord {
  visible = input<boolean>(false);
  @Input() inWindow = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onFinalize = new EventEmitter<void>();

  private additionalTimeService = inject(AdditionalStampingTimeService);

  protected tabs: TabItem[] = [
    { key: 'produccion', label: 'Producción' },
    { key: 'tiempos_adicionales', label: 'Tiempos Adicionales' },
  ];

  protected activeTab = signal('produccion');
  protected isLoadingAdditionalTimes = signal(false);
  protected additionalTimes = signal<AdditionalStampingTime[]>([]);
  protected selectedAdditionalTimeIds = signal<number[]>([]);
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
