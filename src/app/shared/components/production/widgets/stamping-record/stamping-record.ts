import { Component, EventEmitter, Input, Output, signal, computed, input, effect, inject, untracked } from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiTabs, TabItem } from '../../../../elements/ui-tabs/ui-tabs';
import { ShiftCyclesActions } from '../shift-cycles-actions/shift-cycles-actions';
import { Searcher } from '../../../form-controls/searcher/searcher';
import { UiLabelButton } from '../../../../elements/ui-label-button/ui-label-button';
import { AdditionalStampingTimeCard } from '../../cards/additional-stamping-time-card/additional-stamping-time-card';
import { StampingReferenceCard } from '../../cards/stamping-reference-card/stamping-reference-card';
import { AdditionalStampingTimeService } from '../../../../../services/stamping/additional-stamping-time-service';
import { StampingReferenceSamService } from '../../../../../services/stamping/stamping-reference-sam-service';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { AdditionalStampingTime } from '../../../../../models/stamping/additional-stamping-time';
import { StampingReferenceSam } from '../../../../../models/stamping/stamping-reference-sam';
import { SHIFT_CYCLES_CONFIG } from '../../../../../common/const/shift-cycles-config';
import { LoaderService } from '../../../../../services/common/loader-service';

@Component({
  selector: 'app-stamping-record',
  standalone: true,
  imports: [BoxLayout, UiButton, UiIcon, UiTabs, ShiftCyclesActions, Searcher, AdditionalStampingTimeCard, StampingReferenceCard, UiLabelButton],
  templateUrl: './stamping-record.html',
})
export class StampingRecord {
  visible = input<boolean>(false);
  @Input() inWindow = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onFinalize = new EventEmitter<void>();

  private additionalTimeService = inject(AdditionalStampingTimeService);
  private stampingReferenceSamService = inject(StampingReferenceSamService);
  private productionContextService = inject(ProductionContextService);
  private loaderService = inject(LoaderService);

  protected stampingConfig = SHIFT_CYCLES_CONFIG['stamping'];

  protected tabs: TabItem[] = [
    { key: 'produccion', label: 'Referencia' },
    { key: 'tiempos_adicionales', label: 'Tiempos Adicionales' },
  ];

  protected activeTab = signal('produccion');
  protected isLoadingModalData = signal(false);
  protected additionalTimes = signal<AdditionalStampingTime[]>([]);
  protected selectedAdditionalTimeIds = signal<number[]>([]);
  protected additionalTimeQuantities = signal<Record<number, number>>({});
  private additionalTimesSearchText = signal('');
  protected showOnlySelectedAdditionalTimes = signal(false);

  protected stampingReferences = signal<StampingReferenceSam[]>([]);
  protected selectedReferenceSamId = signal<number | null>(null);
  private referencesSearchText = signal('');
  protected showOnlySelectedReference = signal(false);

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
    const list = this.stampingReferences();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.identification.toLowerCase().includes(q) ||
        (item.machine_name ?? '').toLowerCase().includes(q),
    );
  });

  protected displayedReferences = computed(() => {
    const list = this.filteredReferences();
    if (!this.showOnlySelectedReference()) return list;
    const id = this.selectedReferenceSamId();
    return list.filter((item) => item.id === id);
  });

  constructor() {
    effect(() => {
      if (this.visible()) this.loadModalData();
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

  private loadModalData(): void {
    this.isLoadingModalData.set(true);
    this.loaderService.showLoader();

    const referenceRowId = this.productionContextService.snapshot?.order?.referenceRowId;
    const references$ = referenceRowId
      ? this.stampingReferenceSamService.all({ rowid_item: referenceRowId })
      : of<StampingReferenceSam[]>([]);

    forkJoin({
      additionalTimes: this.additionalTimeService.all(),
      references: references$,
    })
      .pipe(finalize(() => {
        this.isLoadingModalData.set(false);
        this.loaderService.hideLoader();
      }))
      .subscribe({
        next: ({ additionalTimes, references }) => {
          this.additionalTimes.set(additionalTimes);
          this.stampingReferences.set(references);
          this.selectedReferenceSamId.set(references.length === 1 ? references[0].id : null);
        },
      });
  }
}
