import { Component, Input, Output, EventEmitter, signal, effect, ElementRef, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';
import { TabItem } from '../ui-tabs/ui-tabs';

export type UiBreadcrumbAlign = 'left' | 'center' | 'right';

@Component({
  selector: 'app-ui-breadcrumb',
  imports: [UiIcon],
  templateUrl: './ui-breadcrumb.html',
  styleUrl: './ui-breadcrumb.css',
  host: { class: 'block' },
})
export class UiBreadcrumb implements OnChanges {
  @Input() tabs: TabItem[] = [];
  @Input() initialTab?: string;
  @Input() align: UiBreadcrumbAlign = 'left';
  @Output() tabChange = new EventEmitter<string>();

  @ViewChild('track') private track?: ElementRef<HTMLElement>;

  activeTab = signal('');

  constructor() {
    // Keep the active tab visible when the strip scrolls horizontally (small screens).
    effect(() => {
      const key = this.activeTab();
      queueMicrotask(() =>
        this.track?.nativeElement
          .querySelector<HTMLElement>(`[data-key="${key}"]`)
          ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }),
      );
    });
  }

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
