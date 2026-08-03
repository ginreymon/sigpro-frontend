import { Component, Input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { EmployeeSnapshot } from '../../../../../models/production/work-session';

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
}
