import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../../../services/core/menu-service';
import { SystemMonitoringService } from '../../../../services/system-monitoring/system-monitoring-service';
import {
  MonitoringDiagnostics,
  MonitoringSummary,
  ServiceStatus,
  SiesaCheckResult,
} from '../../../../models/system-monitoring/system-monitoring';
import { BadgeIntent, UiBadge } from '../../../../shared/elements/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { UiIcon } from '../../../../shared/elements/ui-icon/ui-icon';

const POLL_MS = 60_000;
const DIAGNOSTICS_OPTION = 'admin/system-diagnostics';

const STATUS_VIEW: Record<ServiceStatus, { intent: BadgeIntent; label: string; headline: string; dot: string; soft: string }> = {
  ok: { intent: 'active', label: 'Operativo', headline: 'Sistema operativo', dot: 'bg-green-500', soft: 'bg-green-100' },
  warn: { intent: 'warning', label: 'Degradado', headline: 'Sistema degradado', dot: 'bg-amber-500', soft: 'bg-amber-100' },
  down: { intent: 'danger', label: 'Caído', headline: 'Sistema con fallas', dot: 'bg-red-500', soft: 'bg-red-100' },
  unknown: { intent: 'inactive', label: 'Sin datos', headline: 'Sin datos suficientes', dot: 'bg-gray-400', soft: 'bg-gray-100' },
};

interface QuickLink {
  label: string;
  option: string; // "module/option", shown only when the role has it
  iconName: string;
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Usuarios', option: 'admin/users', iconName: 'user' },
  { label: 'Roles', option: 'admin/roles', iconName: 'lock' },
  { label: 'Auditoría', option: 'stamping/auditory', iconName: 'fileLines' },
  { label: 'Variables globales', option: 'configuration/app-settings', iconName: 'gears' },
  { label: 'Configuración general', option: 'admin/general-config', iconName: 'gear' },
];

@Component({
  selector: 'app-home-system-monitoring',
  imports: [DatePipe, DecimalPipe, RouterLink, UiBadge, UiButton, UiIcon],
  templateUrl: './home-system-monitoring.html',
})
export class HomeSystemMonitoring implements OnInit {
  private monitoring = inject(SystemMonitoringService);
  private destroyRef = inject(DestroyRef);
  private summarySeq = 0;
  private menu = toSignal(inject(MenuService).menu$, { initialValue: null });

  readonly summary = signal<MonitoringSummary | null>(null);
  readonly diagnostics = signal<MonitoringDiagnostics | null>(null);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly updatedAt = signal<Date | null>(null);
  readonly siesaChecking = signal(false);
  readonly siesaCheck = signal<SiesaCheckResult | null>(null);

  private optionKeys = computed(
    () =>
      new Set(
        (this.menu() ?? []).flatMap((m) => (m.options ?? []).map((o) => `${m.url}/${o.url}`.toLowerCase())),
      ),
  );
  readonly canDiagnose = computed(() => this.optionKeys().has(DIAGNOSTICS_OPTION));
  readonly quickLinks = computed(() =>
    QUICK_LINKS.filter((l) => this.optionKeys().has(l.option)).map((l) => ({ ...l, route: `/${l.option}` })),
  );

  ngOnInit(): void {
    this.load();
    const timer = setInterval(() => !document.hidden && this.load(true), POLL_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  load(silent = false): void {
    if (!silent) this.loading.set(true);
    const seq = ++this.summarySeq;
    this.monitoring
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (s) => {
          if (seq !== this.summarySeq) return; // a newer request superseded this one
          this.summary.set(s);
          this.failed.set(false);
          this.updatedAt.set(new Date());
          this.loading.set(false);
        },
        error: () => {
          if (seq !== this.summarySeq) return;
          this.failed.set(true);
          this.loading.set(false);
        },
      });

    if (this.canDiagnose()) {
      this.monitoring
        .getDiagnostics()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (d) => this.diagnostics.set(d), error: () => this.diagnostics.set(null) });
    }
  }

  checkSiesa(): void {
    this.siesaChecking.set(true);
    this.monitoring
      .checkSiesa()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.siesaCheck.set(r);
          this.siesaChecking.set(false);
          this.load(true);
        },
        error: () => {
          this.siesaCheck.set({ status: 'unknown' }); // request failed: the probe did not run, SIESA state is not known
          this.siesaChecking.set(false);
        },
      });
  }

  view(status: ServiceStatus) {
    return STATUS_VIEW[status];
  }

  /** Backend sends epoch seconds; DatePipe needs milliseconds. */
  ms(seconds: number): number {
    return seconds * 1000;
  }

  uptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
  }

  meterClass(percent: number): string {
    return percent >= 90 ? 'bg-red-500' : percent >= 75 ? 'bg-amber-500' : 'bg-green-500';
  }
}
