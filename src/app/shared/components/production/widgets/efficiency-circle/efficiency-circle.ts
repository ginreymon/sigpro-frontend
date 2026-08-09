import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { ModuleProductivityService } from '../../../../../common/interfaces/module-productivity-service';
import { efficiencyStrokeColor, efficiencyTextColor } from '../../../../../common/functions/efficiency-color';
import { currentMonthLabel, currentMonthRange } from '../../../../../common/functions/date-utils';
import { aggregateMonthlyEfficiency } from '../../../../../common/functions/module-efficiency-aggregate';

export type EfficiencyCircleSize = 'sm' | 'md' | 'lg' | 'xl';

const DIAMETER_PX: Record<EfficiencyCircleSize, number> = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 160,
};

const STROKE_WIDTH_PX: Record<EfficiencyCircleSize, number> = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
};

const TEXT_SIZE_CLASS: Record<EfficiencyCircleSize, string> = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl',
};

@Component({
  selector: 'app-efficiency-circle',
  standalone: true,
  templateUrl: './efficiency-circle.html',
})
export class EfficiencyCircle {
  private appConfig = inject(AppConfigService);
  private destroyRef = inject(DestroyRef);

  productivityService = input.required<ModuleProductivityService>();
  label = input('Eficiencia');
  size = input<EfficiencyCircleSize>('md');

  protected monthLabel = computed(() => currentMonthLabel());

  private efficiency = signal(0);
  protected status = computed(() => (this.efficiency() > 0 ? 'ACTIVE' : 'INACTIVE'));

  protected diameter = computed(() => DIAMETER_PX[this.size()]);
  protected strokeWidth = computed(() => STROKE_WIDTH_PX[this.size()]);
  protected textSizeClass = computed(() => TEXT_SIZE_CLASS[this.size()]);
  protected radius = computed(() => (this.diameter() - this.strokeWidth()) / 2);
  protected circumference = computed(() => 2 * Math.PI * this.radius());

  protected progressRatio = computed(() => Math.min(Math.max(this.efficiency(), 0), 100) / 100);
  protected dashOffset = computed(() => this.circumference() * (1 - this.progressRatio()));

  protected percentageLabel = computed(() => this.efficiency().toFixed(2));

  protected ringColor = computed(() =>
    efficiencyStrokeColor(
      this.efficiency(),
      this.appConfig.highEfficiencyLimit,
      this.appConfig.lowEfficiencyLimit,
      this.status() === 'ACTIVE',
    ),
  );

  protected textColor = computed(() =>
    efficiencyTextColor(
      this.efficiency(),
      this.appConfig.highEfficiencyLimit,
      this.appConfig.lowEfficiencyLimit,
      this.status() === 'ACTIVE',
    ),
  );

  constructor() {
    this.appConfig.load().subscribe(() => this.loadMonthlyEfficiency());
  }

  private loadMonthlyEfficiency(): void {
    const { startDate, endDate } = currentMonthRange();

    this.productivityService()
      .getModuleEfficiency(startDate, endDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rows) => {
        const { efficiency } = aggregateMonthlyEfficiency(rows);
        this.efficiency.set(efficiency);
      });
  }
}
