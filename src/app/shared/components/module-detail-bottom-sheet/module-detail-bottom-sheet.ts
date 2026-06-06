import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BottomSheetShell } from '../bottom-sheet-shell/bottom-sheet-shell';
import { ModuleEfficiencyStatus } from '../../../models/production/module-efficiency-status';

@Component({
  selector: 'app-module-detail-bottom-sheet',
  imports: [BottomSheetShell],
  templateUrl: './module-detail-bottom-sheet.html',
})
export class ModuleDetailBottomSheet {
  @Input() visible: boolean = false;
  @Input() module: ModuleEfficiencyStatus | null = null;
  @Output() onClose = new EventEmitter<void>();

  close(): void {
    this.onClose.emit();
  }

  padNumber(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
