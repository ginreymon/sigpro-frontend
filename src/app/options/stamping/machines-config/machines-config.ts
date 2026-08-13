import { Component, signal } from '@angular/core';
import { TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiBreadcrumb } from '../../../shared/elements/ui-breadcrumb/ui-breadcrumb';
import { Machines } from '../machines/machines';
import { StampingSam } from '../../admin/stamping-sam/stamping-sam';
import { AdditionalTimes } from '../additional-times/additional-times';

const TABS: TabItem[] = [
  { key: 'stamping-sam', label: 'SAM Estampación' },
  { key: 'additional-times', label: 'Tiempos Adicionales' },
  { key: 'machines', label: 'Máquinas' },
];

@Component({
  selector: 'app-machines-config',
  imports: [UiBreadcrumb, Machines, StampingSam, AdditionalTimes],
  templateUrl: './machines-config.html',
  styleUrl: './machines-config.css',
})
export class MachinesConfig {
  protected tabs = TABS;
  protected activeTab = signal('stamping-sam');

  protected onTabChange(key: string): void {
    this.activeTab.set(key);
  }
}
