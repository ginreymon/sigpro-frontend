import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkShiftSummary } from '../work-shift-summary/work-shift-summary';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';
import { ModuleEfficiencyStatus } from '../../../../../models/production/module-efficiency-status';
import { StampingProductivityService } from '../../../../../services/stamping/stamping-productivity-service';
import { OPStampingService } from '../../../../../services/stamping/op-stamping-service';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { WorkSession } from '../../../../../models/production/work-session';

@Component({
  selector: 'app-stamping-shift-summary',
  imports: [UiIcon, UpperCasePipe],
  templateUrl: '../work-shift-summary/work-shift-summary.html',
  styleUrl: '../work-shift-summary/work-shift-summary.css',
})
export class StampingShiftSummary extends WorkShiftSummary {
  private stampingProductivityService = inject(StampingProductivityService);
  private opStampingService = inject(OPStampingService);
  private productionContextService = inject(ProductionContextService);

  private referenceSamsLoaded = false;
  private maxReferenceSam: number | undefined;
  private lastSession: WorkSession | null = null;

  protected override getModuleSummary(): Observable<ModuleEfficiencyStatus[]> {
    return this.stampingProductivityService.getModuleShiftSummary();
  }

  protected override buildCards(s: WorkSession): void {
    super.buildCards(s);
    this.cards.update(cards => cards
      .filter(c => c.title !== 'Bajas/Saldos')
      .map(c => c.title === 'Encomendados' ? { ...c, action: () => this.toggleEmployeesDropdown(s) } : c)
    );
    this.lastSession = s;
    this.loadReferenceSams();
  }

  private toggleEmployeesDropdown(s: WorkSession): void {
    if (this.employeesDropdownOpen()) {
      this.employeesDropdownOpen.set(false);
      return;
    }
    const rows = (s.employees_snapshot ?? []).map(e => ({
      id: e.id,
      name: `${e.first_name} ${e.last_name1}${e.last_name2 ? ' ' + e.last_name2 : ''}`,
      isApprentice: !!e.is_apprentice,
    }));
    this.employeesDropdownRows.set(rows);
    this.employeesDropdownOpen.set(true);
  }

  protected override getEffectiveSam(): number | undefined {
    return this.maxReferenceSam;
  }

  protected override calculateSamTarget(s: WorkSession, startUtc: string): number | string {
    return this.maxReferenceSam ? super.calculateSamTarget(s, startUtc) : '-';
  }

  protected override showSamAlert(): void {
    // Estampación: SAM sale de referenceSams por módulo, no de la orden. Sin referencia configurada, Meta muestra '-' sin alertar.
  }

  private loadReferenceSams(): void {
    if (this.referenceSamsLoaded || !this.ordenProduction) return;
    const order = this.ordenProduction;
    const machineTypeId = this.productionContextService.snapshot?.session?.current_module?.machine?.machine_type_id ?? null;

    this.opStampingService.getOrderDetail(order.documentType, order.documentNumber).subscribe({
      next: (detail) => {
        this.referenceSamsLoaded = true;
        const sams = (detail.referenceSams ?? [])
          .filter(r => r.machine_type == null || r.machine_type === machineTypeId)
          .map(r => Number(r.sam))
          .filter(v => !isNaN(v) && v > 0);
        this.maxReferenceSam = sams.length ? Math.max(...sams) : undefined;
        if (this.lastSession) this.loadProductivityCards(this.lastSession);
      },
      error: () => {
        this.referenceSamsLoaded = true;
      },
    });
  }
}
