import { Component, computed, input, output, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Employee } from '../../../models/production/employee';
import { Searcher } from '../searcher/searcher';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';
import { UiTooltip } from '../../elements/ui-tooltip/ui-tooltip';

@Component({
  selector: 'app-employee-picker',
  standalone: true,
  imports: [TitleCasePipe, Searcher, UiOptionCard, UiIcon, UiCloseButton, UiTooltip],
  templateUrl: './employee-picker.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class EmployeePicker {
  employees    = input<Employee[]>([]);
  selectedId   = input<number | null>(null);
  selectable   = input(false);
  deletable    = input(false);
  emptyMessage = input('Sin empleados disponibles');

  onSelect = output<number>();
  onDelete = output<number>();

  private searchText = signal('');

  filtered = computed(() => {
    const q    = this.searchText().toLowerCase().trim();
    const list = this.employees();
    if (!q) return list;
    return list.filter(
      (e) =>
        e.first_name.toLowerCase().includes(q) ||
        e.last_name1.toLowerCase().includes(q) ||
        (e.last_name2?.toLowerCase() ?? '').includes(q) ||
        e.id_number.includes(q),
    );
  });

  search(text: string): void {
    this.searchText.set(text);
  }

  isSelected(id: number): boolean {
    return this.selectedId() === id;
  }

  toggle(id: number): void {
    if (this.selectable()) this.onSelect.emit(id);
  }

  remove(id: number): void {
    this.onDelete.emit(id);
  }
}
