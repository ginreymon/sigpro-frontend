import { Component, computed, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProductionRecordService } from '../../../../../services/production/production-record-service';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiOptionCard } from '../../../../elements/ui-option-card/ui-option-card';

export interface RecentOpRecord {
  id: number;
  op_type: string;
  op_number: number;
  updated_at: string;
}

export interface RecentRecordsService {
  getRecent(limit?: number): Observable<RecentOpRecord[]>;
}

export interface RecentRecordSlotView {
  disabled: boolean;
  spinner: boolean;
  iconClass: string;
  line1: string;
  line1Class: string;
  line2: string;
  line2Class: string;
  record?: RecentOpRecord;
}

const DEFAULT_COUNT = 3;
const LABEL_LINE_CLASS = 'text-xs text-gray-400';
const VALUE_LINE_CLASS = 'text-sm text-gray-400';

@Component({
  selector: 'app-recent-records-card',
  imports: [UiIcon, UiOptionCard],
  providers: [DatePipe],
  templateUrl: './recent-records-card.html',
})
export class RecentRecordsCard implements OnInit {
  @Input() set trigger(v: unknown) {
    if (v !== undefined && this._initialized) this.load();
  }
  @Input() service: RecentRecordsService | null = null;
  @Input() count = DEFAULT_COUNT;

  get slots(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }

  recentRecords        = signal<RecentOpRecord[]>([]);
  recentRecordsLoading = signal(true);

  readonly slotViews = computed<(RecentRecordSlotView | null)[]>(() => this.buildSlotViews());

  private _initialized = false;
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private productionRecordService = inject(ProductionRecordService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this._initialized = true;
    this.load();
  }

  private buildSlotViews(): (RecentRecordSlotView | null)[] {
    const loading = this.recentRecordsLoading();
    const records = this.recentRecords();

    return this.slots.map((slot) => {
      if (loading) {
        return {
          disabled: true,
          spinner: true,
          iconClass: '',
          line1: slot === 0 ? 'Últimas OPs' : '',
          line1Class: LABEL_LINE_CLASS,
          line2: slot === 0 ? 'Cargando...' : '',
          line2Class: VALUE_LINE_CLASS,
        };
      }

      const record = records[slot];
      if (record) {
        return {
          disabled: false,
          spinner: false,
          iconClass: slot === 0 ? 'text-brand-500' : 'text-gray-400',
          line1: `${record.op_type} ${record.op_number}`,
          line1Class: `text-sm font-semibold truncate ${slot === 0 ? 'text-gray-700' : 'text-gray-400'}`,
          line2: this.datePipe.transform(record.updated_at, 'dd/MM/yyyy') ?? '',
          line2Class: LABEL_LINE_CLASS,
          record,
        };
      }

      if (slot === 0) {
        return {
          disabled: true,
          spinner: false,
          iconClass: 'text-gray-400',
          line1: 'Últimas OPs',
          line1Class: LABEL_LINE_CLASS,
          line2: 'Sin registros',
          line2Class: VALUE_LINE_CLASS,
        };
      }

      return null;
    });
  }

  private load(): void {
    const service = this.service ?? this.productionRecordService;

    this.recentRecordsLoading.set(true);
    this.recentRecords.set([]);
    service.getRecent(this.count)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (records) => { this.recentRecords.set(records); this.recentRecordsLoading.set(false); },
        error: ()        => this.recentRecordsLoading.set(false),
      });
  }

  navigate(r: RecentOpRecord): void {
    this.router.navigate([], {
      queryParams:       { docType: r.op_type, docNumber: r.op_number },
      queryParamsHandling: 'merge',
    });
  }
}
