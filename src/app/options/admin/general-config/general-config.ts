import { Component, signal } from '@angular/core';
import { TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiBreadcrumb } from '../../../shared/elements/ui-breadcrumb/ui-breadcrumb';
import { Modules } from '../modules/modules';
import { WorkShifts } from '../work-shifts/work-shifts';
import { WorkBreaks } from '../work-breaks/work-breaks';
import { RestrictedWorkTime } from '../restricted-work-time/restricted-work-time';

const TABS: TabItem[] = [
  { key: 'modules', label: 'Módulos' },
  { key: 'work-shifts', label: 'Turnos' },
  { key: 'work-breaks', label: 'Pausas' },
  { key: 'restricted-work-time', label: 'Restricción de horario' },
];

@Component({
  selector: 'app-general-config',
  imports: [UiBreadcrumb, Modules, WorkShifts, WorkBreaks, RestrictedWorkTime],
  templateUrl: './general-config.html',
  styleUrl: './general-config.css',
})
export class GeneralConfig {
  protected tabs = TABS;
  protected activeTab = signal('modules');

  protected onTabChange(key: string): void {
    this.activeTab.set(key);
  }
}
