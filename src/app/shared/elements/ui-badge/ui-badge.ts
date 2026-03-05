import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-badge',
  imports: [],
  templateUrl: './ui-badge.html',
  styleUrl: './ui-badge.css',
})
export class UiBadge {
  @Input() active: boolean = false;
  @Input() activeText: string = 'Activo';
  @Input() inactiveText: string = 'Inactivo';
}
