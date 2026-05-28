import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-box-layout',
  imports: [TitleCasePipe, NgClass],
  templateUrl: './box-layout.html',
  styleUrl: './box-layout.css',
})
export class BoxLayout {
  @Input() message: string | null = null;
  @Input() title: string | null = null;
  @Input() transparent = false;
  @Input() zClass = 'z-50';
  @Output() onRestoreClick = new EventEmitter<void>();
}
