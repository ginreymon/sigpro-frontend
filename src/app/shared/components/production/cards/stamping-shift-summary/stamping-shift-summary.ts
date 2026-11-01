import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkShiftSummary } from '../work-shift-summary/work-shift-summary';
import { EmployeesDropdown } from '../employees-dropdown/employees-dropdown';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';
import { ModuleEfficiencyStatus } from '../../../../../models/production/module-efficiency-status';
import { StampingProductivityService } from '../../../../../services/stamping/stamping-productivity-service';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { WorkSession } from '../../../../../models/production/work-session';

@Component({
  selector: 'app-stamping-shift-summary',
  imports: [UiIcon, UpperCasePipe, EmployeesDropdown],
  templateUrl: '../work-shift-summary/work-shift-summary.html',
  styleUrl: '../work-shift-summary/work-shift-summary.css',
})
export class StampingShiftSummary extends WorkShiftSummary {
  private stampingProductivityService = inject(StampingProductivityService);
  private productionContextService = inject(ProductionContextService);

  private referenceSamsLoaded = false;
  private maxReferenceSam: number | undefined;
  private lastSession: WorkSession | null = null;

  protected override getModuleSummary(moduleId?: number): Observable<ModuleEfficiencyStatus[]> {
    return this.stampingProductivityService.getModuleShiftSummary(undefined, moduleId);
  }

  protected override buildCards(s: WorkSession): void {
    super.buildCards(s);
    this.cards.update(cards => cards.filter(c => c.title !== 'Bajas y saldos '));
    this.lastSession = s;
    this.loadReferenceSams();
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

  // ordenProduction (StampingOrderDetail cuando showStampingRecord está
  // activo) ya trae referenceSams — evita otra llamada a
  // stamping-orders/detail redundante con la que ya hizo ShiftCycles.
  private loadReferenceSams(): void {
    if (this.referenceSamsLoaded || !this.ordenProduction) return;
    this.referenceSamsLoaded = true;
    const machineTypeId = this.productionContextService.snapshot?.session?.current_module?.machine?.machine_type_id ?? null;

    const sams = (this.ordenProduction.referenceSams ?? [])
      .filter(r => r.machine_type == null || r.machine_type === machineTypeId)
      .map(r => Number(r.sam))
      .filter(v => !isNaN(v) && v > 0);
    this.maxReferenceSam = sams.length ? Math.max(...sams) : undefined;
    // Recalcula la tarjeta "Meta" con el resumen ya pedido en super.buildCards
    // — no hace falta otra llamada a module-shift-summary solo porque ahora
    // se conoce el SAM.
    if (this.lastSession) this.refreshMetaCard(this.lastSession);
  }
}
