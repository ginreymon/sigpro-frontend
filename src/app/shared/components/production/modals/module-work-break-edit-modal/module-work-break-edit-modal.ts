import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { BottomSheetShell } from '../../../layout/bottom-sheet-shell/bottom-sheet-shell';
import { UiTabs, TabItem } from '../../../../elements/ui-tabs/ui-tabs';
import { ModuleEfficiencyRow } from '../../../../../models/production/module-efficiency-row';
import { WorkBreakTiempoTab } from './tiempo-tab/work-break-tiempo-tab';

const TABS: TabItem[] = [
  { key: 'tiempo', label: 'Tiempo' },
];

@Component({
  selector: 'app-module-work-break-edit-modal',
  imports: [BottomSheetShell, UiTabs, WorkBreakTiempoTab],
  templateUrl: './module-work-break-edit-modal.html',
})
export class ModuleWorkBreakEditModal implements OnChanges {
  @Input() visible = false;
  @Input() row: ModuleEfficiencyRow | null = null;
  @Output() onClose = new EventEmitter<void>();

  readonly tabs = TABS;
  activeTab = signal('tiempo');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.activeTab.set('tiempo');
    }
  }

  title(): string {
    const row = this.row;
    return row
      ? `Editar jornada — Módulo ${row.module_number} · ${row.module_name}`.toUpperCase()
      : 'EDITAR JORNADA';
  }

  close(): void {
    this.onClose.emit();
  }
}
