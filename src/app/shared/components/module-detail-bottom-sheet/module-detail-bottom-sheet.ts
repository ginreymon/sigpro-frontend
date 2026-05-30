import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BottomSheetShell } from '../bottom-sheet-shell/bottom-sheet-shell';

export interface ModuleCard {
  number: number;
  name: string;
  status: 'Activo' | 'Inactivo' | 'Pausado';
  efficiency: number;
  trend: number;
  history: number[];
}

@Component({
  selector: 'app-module-detail-bottom-sheet',
  imports: [BottomSheetShell],
  templateUrl: './module-detail-bottom-sheet.html',
})
export class ModuleDetailBottomSheet {
  @Input() visible: boolean = false;
  @Input() module: ModuleCard | null = null;
  @Output() onClose = new EventEmitter<void>();

  close(): void {
    this.onClose.emit();
  }

  padNumber(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
