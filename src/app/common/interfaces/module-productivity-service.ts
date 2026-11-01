import { Observable } from 'rxjs';
import { ModuleEfficiencyStatus } from '../../models/production/module-efficiency-status';
import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';

export interface ModuleProductivityService {
  getModuleShiftSummary(coreModuleId?: number, moduleId?: number): Observable<ModuleEfficiencyStatus[]>;
  getModuleEfficiency(startDate: string, endDate: string, moduleId?: number): Observable<ModuleEfficiencyRow[]>;
}
