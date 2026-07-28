import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkShiftSummary } from '../work-shift-summary/work-shift-summary';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';
import { ProductivityParams } from '../../../../../models/production/productivity-params';
import { EfficiencyPeriod } from '../../../../../models/production/efficiency-period';
import { StampingProductivityService } from '../../../../../services/stamping/stamping-productivity-service';

@Component({
  selector: 'app-stamping-shift-summary',
  imports: [UiIcon, UpperCasePipe],
  templateUrl: '../work-shift-summary/work-shift-summary.html',
  styleUrl: '../work-shift-summary/work-shift-summary.css',
})
export class StampingShiftSummary extends WorkShiftSummary {
  private stampingProductivityService = inject(StampingProductivityService);

  protected override getEfficiency(params: ProductivityParams): Observable<EfficiencyPeriod> {
    return this.stampingProductivityService.getEfficiencyPeriod(params);
  }
}
