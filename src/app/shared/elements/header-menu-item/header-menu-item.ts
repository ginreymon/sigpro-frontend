import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-header-menu-item',
  imports: [],
  templateUrl: './header-menu-item.html',
  styleUrl: './header-menu-item.css',
})
export class HeaderMenuItem {
  @Output() itemClick = new EventEmitter<void>();

  onClick() {
    this.itemClick.emit();
  }
}
