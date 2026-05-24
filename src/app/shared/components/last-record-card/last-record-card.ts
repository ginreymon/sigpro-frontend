import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProductionRecord } from '../../../models/production/production-record';
import { ProductionRecordService } from '../../../services/production/production-record-service';
import { UiIcon } from '../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-last-record-card',
  imports: [UiIcon],
  templateUrl: './last-record-card.html',
})
export class LastRecordCard implements OnInit {
  lastRecord = signal<ProductionRecord | null>(null);
  lastRecordLoading = signal(true);

  private router = inject(Router);
  private productionRecordService = inject(ProductionRecordService);

  ngOnInit(): void {
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
