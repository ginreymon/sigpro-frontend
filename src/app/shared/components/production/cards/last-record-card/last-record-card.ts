import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProductionRecord } from '../../../../../models/production/production-record';
import { ProductionRecordService } from '../../../../../services/production/production-record-service';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiOptionCard } from '../../../../elements/ui-option-card/ui-option-card';

@Component({
  selector: 'app-last-record-card',
  imports: [UiIcon, UiOptionCard],
  templateUrl: './last-record-card.html',
})
export class LastRecordCard implements OnInit {
  @Input() set trigger(v: unknown) {
    if (v !== undefined && this._initialized) this.load();
  }

  lastRecord        = signal<ProductionRecord | null>(null);
  lastRecordLoading = signal(true);

  private _initialized = false;
  private router = inject(Router);
  private productionRecordService = inject(ProductionRecordService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this._initialized = true;
    this.load();
  }

  private load(): void {
    this.lastRecordLoading.set(true);
    this.lastRecord.set(null);
    this.productionRecordService.getLast()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (record) => { this.lastRecord.set(record); this.lastRecordLoading.set(false); },
        error: ()       => this.lastRecordLoading.set(false),
      });
  }

  navigate(): void {
    const r = this.lastRecord();
    if (!r) return;
    this.router.navigate([], {
      queryParams:       { docType: r.op_type, docNumber: r.op_number },
      queryParamsHandling: 'merge',
    });
  }
}
