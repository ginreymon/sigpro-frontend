import { Component, Input } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-box-layout',
  imports: [TitleCasePipe],
  templateUrl: './box-layout.html',
  styleUrl: './box-layout.css',
})
export class BoxLayout {
  @Input() message: string | null = null;
  @Input() title: string | null = null;
}
