import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-panel-layout',
  imports: [],
  templateUrl: './panel-layout.html',
})
export class PanelLayout {
  @Input() padded = false;
}
