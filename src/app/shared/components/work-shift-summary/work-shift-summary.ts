import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { WorkShiftCard } from '../../../common/interfaces/work-shift-card';
import { shiftTimeToUtcIso } from '../../../common/functions/date-utils';
import { WorkSession } from '../../../models/production/work-session';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ProductivityParams } from '../../../models/production/productivity-params';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';
import { AppConfigService } from '../../../services/core/app-config-service';
import { ProductionContextService } from '../../../services/production/production-context-service';

@Component({
  selector: 'app-work-shift-summary',
  imports: [UiIcon, UpperCasePipe],
  templateUrl: './work-shift-summary.html',
  styleUrl: './work-shift-summary.css',
})
export class WorkShiftSummary implements OnInit {

  @Output() employeesClick = new EventEmitter<void>();

  @Input() employeesEditable = false;

  protected productivityService = inject(ProductivityService);
  protected appConfig = inject(AppConfigService);
  private contextService = inject(ProductionContextService);

  cards = signal<WorkShiftCard[]>([]);
  protected pendingSession: WorkSession | null = null;
  private configLoaded = false;

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
      { title: 'Módulo', iconName: 'screwdriverWrench', data: `${s.current_module?.number} ${s.current_module?.name}` },
      { title: 'Turno', iconName: 'alarmClock', data: `${s.work_shift.name} : ${s.work_shift.start_time.slice(0, 8)} - ${s.work_shift.end_time.slice(0, 8)}` },
      { title: 'Encomendados', iconName: 'user', data: s.employees_snapshot?.length ?? 0, action: () => this.employeesEditable ? this.employeesClick.emit() : null },
      { title: 'Meta', data: '-', thresholds: { green: 0, red: Infinity } },
      { title: 'Acumuladas', data: '-', thresholds: { green: 0, red: Infinity } },
      { title: 'Bajas/Saldos', data: '-', thresholds: { green: Infinity, red: Infinity } },
      { title: 'Eficiencia', data: '-', thresholds: { green: this.appConfig.highEfficiencyLimit, red: this.appConfig.lowEfficiencyLimit } },
    ]);
    this.loadProductivityCards(s);
  }

  protected loadProductivityCards(s: WorkSession): void {
    const startUtc = shiftTimeToUtcIso(s.work_shift.start_time);
    const endUtc   = shiftTimeToUtcIso(s.work_shift.end_time, this.appConfig.balanceEndExtraHours);

    const params: ProductivityParams = {
      startDate: startUtc,
      endDate:   endUtc,
      moduleId:  s.current_module?.id,
      shiftId:   s.work_shift.id,
    };

    this.productivityService.getEfficiencyPeriod(params).subscribe({
      next: (data) => {
        this.contextService.setEfficiency(data);
        this.cards.update(cards => cards.map((card) => {
          if (card.title === 'Acumuladas') return { ...card, data: data.total_completed };
          if (card.title === 'Bajas/Saldos') return { ...card, data: (data.total_rejected + data.total_scrap) };
          if (card.title === 'Eficiencia') return { ...card, data: Math.round(data.efficiency * 100) / 100 };
          if (card.title === 'Meta') return { ...card, data: Math.round(data.unit_target) };
          return card;
        }));
      },
    });
  }

  getActionClasses(card: WorkShiftCard): string {
    const base = 'inline-flex flex-row gap-1 items-center mt-0.5 rounded transition-colors';
    const hoverable = card.title === 'Encomendados' && this.employeesEditable;
    return hoverable ? `${base} cursor-pointer hover:text-gray-700 hover:bg-gray-100` : base;
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
