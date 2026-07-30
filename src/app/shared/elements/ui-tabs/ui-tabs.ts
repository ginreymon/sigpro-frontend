import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
  hasError?: boolean;
}

@Component({
  selector: 'app-ui-tabs',
  templateUrl: './ui-tabs.html',
})
export class UiTabs implements OnChanges {
  @Input() tabs: TabItem[] = [];
  @Input() initialTab?: string;
  // 'underline' — original look, active tab gets a bottom border only.
  // 'raised' — active tab gets a connected/raised card look (border + white bg).
  @Input() variant: 'underline' | 'raised' = 'underline';
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
