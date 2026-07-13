import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-ui-header-menu-item',
  imports: [],
  templateUrl: './ui-header-menu-item.html',
  styleUrl: './ui-header-menu-item.css',
})
export class UiHeaderMenuItem {
  @Output() itemClick = new EventEmitter<void>();

  onClick() {
    this.itemClick.emit();
  }
}
