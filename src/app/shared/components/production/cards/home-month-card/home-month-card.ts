import { Component, EventEmitter, Input, Output, OnChanges, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { ModuleProductivityService } from '../../../../../common/interfaces/module-productivity-service';
import { currentMonthLabel, currentMonthRange } from '../../../../../common/functions/date-utils';
import { aggregateMonthlyEfficiency } from '../../../../../common/functions/module-efficiency-aggregate';
import { efficiencyTextColor } from '../../../../../common/functions/efficiency-color';

/**
 * Month summary for the process homes. Independent from the active session: with a module it shows
 * that module, without one it shows every module. Absence of today's activity never hides it.
 */
@Component({
  selector: 'app-home-month-card',
  imports: [UiIcon],
  host: { class: 'block' },
  templateUrl: './home-month-card.html',
})
export class HomeMonthCard implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) service!: ModuleProductivityService;
  /** Module of the active session; null/undefined = all modules. */
  @Input() moduleId: number | null | undefined = null;
  /** Parent finished resolving the session (so moduleId is final). */
  @Input() ready = false;
  /** Module location (name + description) read from the same response; no extra request. */
  @Output() location = new EventEmitter<{ name: string; description: string | null } | null>();

  private appConfig = inject(AppConfigService);
  private loadedKey: number | null = null;
  private request?: Subscription;

  readonly monthLabel = currentMonthLabel();
  readonly loading = signal(true);
  readonly error = signal(false);
  private readonly configLoaded = signal(false);
  readonly efficiency = signal(0);
  readonly completed = signal(0);
  readonly daysWithData = signal(0);

  readonly hasData = computed(() => this.daysWithData() > 0);
  // Plain getter: moduleId is a plain @Input, so a computed() would cache a stale value.
  get scopeText(): string {
    return this.moduleId ? 'Promedio de su módulo en el mes.' : 'Promedio de todos los módulos en el mes.';
  }
  readonly efficiencyClass = computed(() => {
    if (!this.configLoaded() || !this.hasData()) return 'text-slate-500';
    return efficiencyTextColor(this.efficiency(), this.appConfig.highEfficiencyLimit, this.appConfig.lowEfficiencyLimit);
  });

  ngOnInit(): void {
    this.appConfig.load().subscribe(() => this.configLoaded.set(true));
  }

  ngOnChanges(): void {
    const key = this.moduleId ?? 0;
    if (!this.ready || this.loadedKey === key) return;
    this.loadedKey = key;
    this.loading.set(true);
    this.error.set(false);

    const { startDate, endDate } = currentMonthRange();
    this.request?.unsubscribe(); // drop a late response for a previous module
    this.request = this.service.getModuleEfficiency(startDate, endDate, this.moduleId ?? undefined).subscribe({
      next: (rows) => {
        const { efficiency, completed } = aggregateMonthlyEfficiency(rows ?? []);
        this.efficiency.set(efficiency);
        this.completed.set(completed);
        this.daysWithData.set((rows ?? []).filter(r => (r.efficiency ?? 0) > 0).length);
        this.loading.set(false);
        // null = no location available (all-modules mode, no rows, or error): the parent keeps its fallback.
        const first = this.moduleId ? (rows ?? []).find(r => r.module_location) : undefined;
        this.location.emit(first
          ? { name: first.module_location, description: first.location_description?.trim() || null }
          : null);
      },
      error: () => {
        this.location.emit(null);
        this.efficiency.set(0);
        this.completed.set(0);
        this.daysWithData.set(0);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
  }
}
