import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { WorkShiftCard } from '../../../common/interfaces/work-shift-card';
import { WorkSession } from '../../../models/production/work-session';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ProductivityParams } from '../../../models/production/productivity-params';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';
import { UiTableButton } from '../../elements/ui-table-button/ui-table-button';
import { AppConfigService } from '../../../services/core/app-config-service';

@Component({
  selector: 'app-work-shift-summary',
  imports: [UiIcon, UpperCasePipe, UiTableButton],
  templateUrl: './work-shift-summary.html',
  styleUrl: './work-shift-summary.css',
})
export class WorkShiftSummary implements OnInit {

  @Output() employeesClick = new EventEmitter<void>();

  private productivityService = inject(ProductivityService);
  private appConfig = inject(AppConfigService);

  cards = signal<WorkShiftCard[]>([]);
  private pendingSession: WorkSession | null = null;

  ngOnInit(): void {
    this.appConfig.load().subscribe(() => {
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
    this.pendingSession = s;
    this.buildCards(s);
  }

  private buildCards(s: WorkSession): void {
    this.cards.set([
      { title: 'Módulo', iconName: 'screwdriverWrench', data: `${s.current_module?.number} ${s.current_module?.name}` },
      { title: 'Turno', iconName: 'alarmClock', data: `${s.work_shift.name} : ${s.work_shift.start_time.slice(0, 5)} - ${s.work_shift.end_time.slice(0, 5)}` },
      { title: 'Encomendados', iconName: 'user', data: s.employees_snapshot?.length ?? 0, action: () => this.employeesClick.emit() },
      { title: 'Acumuladas', data: '-', thresholds: { green: 0, red: 10000000 } },
      { title: 'Eficiencia', data: '-', thresholds: { green: this.appConfig.highEfficiencyLimit, red: this.appConfig.lowEfficiencyLimit } },
      { title: 'Meta', data: '-', thresholds: { green: 0, red: 1000000 } },
    ]);
    this.loadProductivityCards(s);
  }

  private loadProductivityCards(s: WorkSession): void { 
    const today = new Date().toISOString().slice(0, 10);
    const params: ProductivityParams = {
      startDate: `${today}T${s.work_shift.start_time}`,
      endDate: `${today}T${s.work_shift.end_time}`,
      moduleId: s.current_module?.id,
      shiftId: s.work_shift.id,
    };

    this.productivityService.getEfficiencyPeriod(params).subscribe({
      next: (data) => {
        const efficiency = data.unit_target  > 0
          ? Math.round(data.total_completed / data.unit_target  * 100 * 100) / 100
          : 0;
        this.cards.update(cards => cards.map((card) => {
          if (card.title === 'Acumuladas') return { ...card, data: data.total_completed };
          if (card.title === 'Eficiencia') return { ...card, data: efficiency };
          if (card.title === 'Meta') return { ...card, data: Math.round(data.unit_target) };
          return card;
        }));
      },
    });
  }

  getDataClasses(card: WorkShiftCard): string {
    if (card.thresholds && typeof card.data === 'number') {
      if (card.data >= card.thresholds.green) return 'text-sm font-semibold text-green-600';
      if (card.data <= card.thresholds.red) return 'text-sm font-semibold text-red-600';
      return 'text-sm font-semibold text-amber-500';
    }
    return 'text-sm font-semibold text-gray-700';
  }
}
