import { Component, signal } from '@angular/core';
import { TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiBreadcrumb } from '../../../shared/elements/ui-breadcrumb/ui-breadcrumb';
import { Machines } from '../machines/machines';
import { MachineTypes } from '../machine-types/machine-types';
import { Processes } from '../processes/processes';
import { AdditionalTimes } from '../additional-times/additional-times';

const TABS: TabItem[] = [
  { key: 'machines', label: 'Máquinas' },
  { key: 'machine-types', label: 'Tipos de Máquina' },
  { key: 'processes', label: 'Procesos' },
  { key: 'additional-times', label: 'Tiempos Adicionales' },
];

@Component({
  selector: 'app-machines-config',
  imports: [UiBreadcrumb, Machines, MachineTypes, Processes, AdditionalTimes],
  templateUrl: './machines-config.html',
  styleUrl: './machines-config.css',
})
export class MachinesConfig {
  protected tabs = TABS;
  protected activeTab = signal('machines');

  protected onTabChange(key: string): void {
    this.activeTab.set(key);
  }
}
