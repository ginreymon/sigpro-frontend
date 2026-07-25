import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';
import { TabItem } from '../ui-tabs/ui-tabs';

@Component({
  selector: 'app-ui-breadcrumb',
  imports: [UiIcon],
  templateUrl: './ui-breadcrumb.html',
})
export class UiBreadcrumb implements OnChanges {
  @Input() tabs: TabItem[] = [];
  @Input() initialTab?: string;
  @Output() tabChange = new EventEmitter<string>();

  activeTab = signal('');

  @Input() set activeKey(key: string) {
    if (key && key !== this.activeTab()) this.activeTab.set(key);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tabs'] && this.tabs.length && !this.activeTab()) {
      this.activeTab.set(this.initialTab ?? this.tabs[0].key);
    }
  }

  setTab(key: string) {
    if (this.tabs.find((tab) => tab.key === key)?.disabled) return;
    this.activeTab.set(key);
    this.tabChange.emit(key);
  }
}
