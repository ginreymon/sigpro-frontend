import { Component, Input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { EmployeeSnapshot } from '../../../../../models/production/work-session';
import { employeeWeight } from '../../../../../common/functions/employee-weight';

@Component({
  selector: 'app-employees-dropdown',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './employees-dropdown.html',
})
export class EmployeesDropdown {
  @Input() employees: EmployeeSnapshot[] = [];

  protected initials(e: EmployeeSnapshot): string {
    return `${e.first_name?.[0] ?? ''}${e.last_name1?.[0] ?? ''}`;
  }

  protected displayName(e: EmployeeSnapshot): string {
    return `${e.first_name} ${e.last_name1}`;
  }

  protected weight(e: EmployeeSnapshot): number {
    return employeeWeight(e);
  }

  // Aprendiz tiene prioridad visual sobre el warning de minutos reducidos.
  protected isWarning(e: EmployeeSnapshot): boolean {
    return !e.is_apprentice && e.worked_minutes_per_hour != null && e.worked_minutes_per_hour < 60;
  }

  protected badgeClass(e: EmployeeSnapshot): string {
    if (e.is_apprentice) return 'bg-red-100 text-red-600';
    if (this.isWarning(e)) return 'bg-yellow-100 text-yellow-600';
    return 'bg-green-100 text-green-600';
  }

  protected weightClass(e: EmployeeSnapshot): string {
    if (e.is_apprentice) return 'text-red-500';
    if (this.isWarning(e)) return 'text-yellow-600';
    return 'text-green-600';
  }
}
