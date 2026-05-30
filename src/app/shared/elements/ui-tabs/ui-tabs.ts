import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';

export interface TabItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-ui-tabs',
  templateUrl: './ui-tabs.html',
})
export class UiTabs implements OnChanges {
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
    this.activeTab.set(key);
    this.tabChange.emit(key);
  }
}
