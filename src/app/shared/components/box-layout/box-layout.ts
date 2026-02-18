import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-box-layout',
  imports: [],
  templateUrl: './box-layout.html',
  styleUrl: './box-layout.css',
})
export class BoxLayout {
  @Input() message: string | null = null;
  @Input() title: string | null = null;
}
