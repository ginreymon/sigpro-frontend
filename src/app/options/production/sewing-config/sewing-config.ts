import { Component, signal } from '@angular/core';
import { TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiBreadcrumb } from '../../../shared/elements/ui-breadcrumb/ui-breadcrumb';
import { SewingSAM } from '../../admin/sewing-sam/sewing-sam';

const TABS: TabItem[] = [  
  { key: 'sewing-sam', label: 'SAM Confección' },
];

@Component({
  selector: 'app-sewing-config',
  imports: [UiBreadcrumb, SewingSAM],
  templateUrl: './sewing-config.html',
})
export class SewingConfig {
  protected tabs = TABS;
  protected activeTab = signal('sewing-sam');

  protected onTabChange(key: string): void {
    this.activeTab.set(key);
  }
}
