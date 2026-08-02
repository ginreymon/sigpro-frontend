import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
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
}

export interface RecentRecordsService {
  getRecent(): Observable<RecentOpRecord[]>;
}

const SLOTS = [0, 1, 2] as const;

@Component({
  selector: 'app-recent-records-card',
  imports: [UiIcon, UiOptionCard],
  templateUrl: './recent-records-card.html',
})
export class RecentRecordsCard implements OnInit {
  @Input() set trigger(v: unknown) {
    if (v !== undefined && this._initialized) this.load();
  }
  @Input() service: RecentRecordsService | null = null;

  readonly slots = SLOTS;

  recentRecords        = signal<RecentOpRecord[]>([]);
  recentRecordsLoading = signal(true);

  private _initialized = false;
  private router = inject(Router);
  private productionRecordService = inject(ProductionRecordService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this._initialized = true;
    this.load();
  }

  private load(): void {
    const service = this.service ?? this.productionRecordService;

    this.recentRecordsLoading.set(true);
    this.recentRecords.set([]);
    service.getRecent()
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
