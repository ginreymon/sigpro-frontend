import { Component, inject, Input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProductionRecord } from '../../../models/production/production-record';
import { ProductionRecordService } from '../../../services/production/production-record-service';
import { UiIcon } from '../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-last-record-card',
  imports: [UiIcon],
  templateUrl: './last-record-card.html',
})
export class LastRecordCard {
  @Input() set trigger(v: unknown) { if (v !== undefined) this.load(); }
  lastRecord = signal<ProductionRecord | null>(null);
  lastRecordLoading = signal(true);

  private router = inject(Router);
  private productionRecordService = inject(ProductionRecordService);

  private load(): void {
    this.lastRecordLoading.set(true);
    this.lastRecord.set(null);
    this.productionRecordService.getLast().subscribe({
      next: (record) => {
        this.lastRecord.set(record);
        this.lastRecordLoading.set(false);
      },
      error: () => this.lastRecordLoading.set(false),
    });
  }

  navigate(): void {
    const r = this.lastRecord();
    if (!r) return;
    this.router.navigate([], {
      queryParams: { docType: r.op_type, docNumber: r.op_number },
      queryParamsHandling: 'merge',
    });
  }
}
