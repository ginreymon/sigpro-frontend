import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-unplanned-shift-message',
  imports: [],
  templateUrl: './unplanned-shift-message.html',
})
export class UnplannedShiftMessage {
  @Input() title: string | null = null;
  @Input() description: string | null = null;
}
