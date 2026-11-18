import { Component, effect, ElementRef, HostListener, inject, Input, OnInit, signal, untracked } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { WorkShiftCard } from '../../../../../common/interfaces/work-shift-card';
import { shiftTimeToUtcIso } from '../../../../../common/functions/date-utils';
import { employeeWeight } from '../../../../../common/functions/employee-weight';
import { WorkSession, EmployeeSnapshot } from '../../../../../models/production/work-session';
import { EmployeesDropdown } from '../employees-dropdown/employees-dropdown';
import { ProductivityService } from '../../../../../services/production/productivity-service';
import { EfficiencyPeriod } from '../../../../../models/production/efficiency-period';
import { ModuleEfficiencyStatus } from '../../../../../models/production/module-efficiency-status';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { ProductionOrder } from '../../../../../models/production/production-order';
import { DialogService } from '../../../../../services/common/dialog-service';

@Component({
  selector: 'app-work-shift-summary',
  imports: [UiIcon, UpperCasePipe, EmployeesDropdown],
  templateUrl: './work-shift-summary.html',
  styleUrl: './work-shift-summary.css',
})
export class WorkShiftSummary implements OnInit {

  @Input() ordenProduction: ProductionOrder | null = null;

  protected productivityService = inject(ProductivityService);
  protected appConfig = inject(AppConfigService);
  private contextService = inject(ProductionContextService);
  private dialogService = inject(DialogService);
  private elementRef = inject(ElementRef<HTMLElement>);

  cards = signal<WorkShiftCard[]>([]);
  // Meta y Eficiencia dependen de getModuleShiftSummary() (HTTP); mientras
  // esa llamada está en vuelo se muestran con skeleton en vez del '-'
  // inicial de buildCards, para que se note que está cargando.
  protected summaryLoading = signal(true);
  protected pendingSession: WorkSession | null = null;
  private configLoaded = false;

  // Dropdown de lista de empleados (solo lectura), abierto/cerrado al hacer click en Encomendados.
  protected employeesDropdownOpen = signal(false);
  protected employeesDropdownRows = signal<EmployeeSnapshot[]>([]);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.employeesDropdownOpen()) return;
    if (this.elementRef.nativeElement.contains(event.target as Node)) return;
    this.employeesDropdownOpen.set(false);
  }

  private activeSession: WorkSession | null = null;
  private refreshRequested = false;

  constructor() {
    // Refresh the numbers in place after a record is saved (the first run is the initial value).
    let first = true;
    effect(() => {
      this.contextService.summaryRefresh();
      if (first) {
        first = false;
        return;
      }
      const s = this.activeSession;
      if (s && this.configLoaded) {
        this.refreshRequested = true;
        untracked(() => this.loadProductivityCards(s));
      } else {
        this.contextService.notifySummaryRefreshed();
      }
    });
  }

  ngOnInit(): void {
    this.appConfig.load().subscribe(() => {
      this.configLoaded = true;
      if (this.pendingSession) {
        this.buildCards(this.pendingSession);
        this.pendingSession = null;
      }
    });
  }

  @Input()
  set session(s: WorkSession | null) {
    this.activeSession = s;
    if (!s) {
      this.cards.set([]);
      return;
    }
    if (this.configLoaded) {
      this.buildCards(s);
    } else {
      this.pendingSession = s;
    }
  }

  protected buildCards(s: WorkSession): void {
    this.cards.set([
      { title: 'Módulo', iconName: 'screwdriverWrench', data: `${s.current_module?.name}` },
      { title: 'Turno', iconName: 'alarmClock', data: `${s.work_shift.start_time.slice(0, 5)} - ${s.work_shift.end_time.slice(0, 5)}` },
      { title: 'Encomendados', iconName: 'user', data: this.formatHeadcount(s), action: () => this.toggleEmployeesDropdown(s) },
      { title: 'Meta', data: '-', thresholds: { green: 0, red: Infinity } },
      { title: 'Acumuladas', data: '-', thresholds: { green: 0, red: Infinity } },
      { title: 'Bajas y saldos ', data: '-', thresholds: { green: Infinity, red: Infinity } },
      { title: 'Eficiencia', data: '-', thresholds: { green: this.appConfig.highEfficiencyLimit, red: this.appConfig.lowEfficiencyLimit } },
    ]);
    this.summaryLoading.set(true);
    this.loadProductivityCards(s);
  }

  // Cachea el último resumen recibido del backend para poder recalcular la
  // tarjeta "Meta" (ej. cuando el SAM efectivo se conoce después, ver
  // StampingShiftSummary.refreshMetaCard) sin repetir la llamada HTTP.
  private lastSummary: EfficiencyPeriod | null = null;

  protected loadProductivityCards(s: WorkSession): void {
    const moduleId = s.current_module?.id;

    this.getModuleSummary().pipe(finalize(() => {
      this.summaryLoading.set(false);
      // Tell the page that a requested refresh has finished (the cards are already updated).
      if (this.refreshRequested) {
        this.refreshRequested = false;
        this.contextService.notifySummaryRefreshed();
      }
    })).subscribe({
      next: (rows) => {
        const row = rows.find(r => r.module_id === moduleId);
        const summary: EfficiencyPeriod = {
          period_start:    row?.period_start ?? '',
          period_end:      row?.period_end ?? '',
          module_id:       row?.module_id ?? moduleId ?? 0,
          shift_id:        row?.shift_id ?? s.work_shift.id,
          total_ordered:   row?.total_ordered ?? 0,
          total_planned:   row?.total_planned ?? 0,
          total_completed: row?.total_completed ?? 0,
          total_scrap:     row?.total_scrap ?? 0,
          total_rejected:  row?.total_rejected ?? 0,
          total_produced:  row?.total_produced ?? 0,
          unit_target:     row?.unit_target ?? 0,
          efficiency:      row?.efficiency ?? 0,
        };

        this.lastSummary = summary;
        this.contextService.setEfficiency(summary);
        this.applySummaryToCards(s, summary);
      },
    });
  }

  // Reaplica la tarjeta "Meta" con el resumen ya obtenido (sin volver a
  // pedirlo al backend) — usado cuando el SAM efectivo se resuelve después
  // de la carga inicial de tarjetas.
  protected refreshMetaCard(s: WorkSession): void {
    if (!this.lastSummary) return;
    this.applySummaryToCards(s, this.lastSummary);
  }

  private applySummaryToCards(s: WorkSession, summary: EfficiencyPeriod): void {
    const noBackendData = !summary.unit_target && !summary.efficiency;
    if (noBackendData && this.ordenProduction && !this.getEffectiveSam()) {
      this.showSamAlert(this.ordenProduction);
    }
    // Estimado en vivo mientras no hay meta real del backend (sesion/jornada
    // recien iniciada, aun sin fila en getModuleShiftSummary): se calcula
    // siempre desde el horario nominal del turno, sin depender de la fila.
    const samTarget = noBackendData
      ? this.calculateSamTarget(s, shiftTimeToUtcIso(s.work_shift.start_time))
      : null;
    this.cards.update(cards => cards.map((card) => {
      if (card.title === 'Meta') return { ...card, data: samTarget !== null ? samTarget : Math.round(summary.unit_target ?? 0) };
      if (card.title === 'Acumuladas') return { ...card, data: summary.total_completed ?? 0 };
      if (card.title === 'Bajas y saldos ') return { ...card, data: (summary.total_rejected ?? 0) + (summary.total_scrap ?? 0) };
      if (card.title === 'Eficiencia') return { ...card, data: Math.round((summary.efficiency ?? 0) * 100) / 100 };
      return card;
    }));
  }

  protected getModuleSummary(): Observable<ModuleEfficiencyStatus[]> {
    return this.productivityService.getModuleShiftSummary();
  }

  protected getEffectiveSam(): number | undefined {
    return this.ordenProduction?.sam;
  }

  protected calculateSamTarget(s: WorkSession, startUtc: string): number | string {
    const sam = this.getEffectiveSam();
    if (!sam) return 0;
    const weighted = s.employees_snapshot?.reduce((sum, e) => sum + employeeWeight(e), 0) ?? 0;
    const elapsedMinutes = (Date.now() - new Date(startUtc).getTime()) / 60000;
    return Math.round((elapsedMinutes * weighted) / sam);
  }

  protected showSamAlert(po: ProductionOrder) {
    this.dialogService.openToast(
      'Configuración incompleta',
      `No se puede calcular la meta porque la referencia "${po.reference}" no tiene un valor SAM registrado.`,
      'fail',
      10000
    );
  }

  private toggleEmployeesDropdown(s: WorkSession): void {
    if (this.employeesDropdownOpen()) {
      this.employeesDropdownOpen.set(false);
      return;
    }
    this.employeesDropdownRows.set(s.employees_snapshot ?? []);
    this.employeesDropdownOpen.set(true);
  }

  private formatHeadcount(s: WorkSession): string {
    const head = s.employees_snapshot?.length ?? 0;
    const weighted = s.employees_snapshot?.reduce((sum, e) => sum + employeeWeight(e), 0) ?? 0;
    return weighted !== head ? `${head} (${weighted})` : `${head}`;
  }

  getActionClasses(card: WorkShiftCard): string {
    const base = 'inline-block rounded transition-colors';
    const hoverable = card.title === 'Encomendados';
    return hoverable ? `${base} cursor-pointer hover:text-gray-700 hover:bg-gray-100` : base;
  }

  private static readonly summaryLoadingTitles = ['Meta', 'Acumuladas', 'Bajas y saldos ', 'Eficiencia'];

  isSummaryLoadingCard(card: WorkShiftCard): boolean {
    return this.summaryLoading() && WorkShiftSummary.summaryLoadingTitles.includes(card.title);
  }

  getDataClasses(card: WorkShiftCard, size: string = 'text-sm'): string {
    if (card.thresholds && typeof card.data === 'number') {
      if (card.data >= card.thresholds.green) return `${size} font-semibold text-green-600`;
      if (card.data <= card.thresholds.red) return `${size} font-semibold text-red-600`;
      return `${size} font-semibold text-amber-500`;
    }
    return `${size} font-semibold text-gray-700`;
  }

}
