import { Component, computed, effect, input, output, signal, untracked, ViewChild } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Employee } from '../../../models/production/employee';
import { Searcher } from '../searcher/searcher';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';
import { UiTooltip } from '../../elements/ui-tooltip/ui-tooltip';
import { UiLabelButton } from '../../elements/ui-label-button/ui-label-button';

@Component({
  selector: 'app-employee-picker',
  standalone: true,
  imports: [TitleCasePipe, Searcher, UiOptionCard, UiIcon, UiCloseButton, UiTooltip, UiLabelButton],
  templateUrl: './employee-picker.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class EmployeePicker {
  employees        = input<Employee[]>([]);
  selectedId       = input<number | null>(null);
  selectedIds      = input<number[]>([]);
  multiSelect      = input(false);
  selectable       = input(false);
  deletable        = input(false);
  showSelectionBar = input(false);
  emptyMessage     = input('Sin empleados disponibles');

  apprenticeIds       = input<number[]>([]);
  enableApprentice    = input(false);
  apprenticeEditable  = input(false);

  onSelect            = output<number>();
  onToggle            = output<number>();
  onDelete            = output<number>();
  onToggleApprentice  = output<number>();

  @ViewChild(Searcher) private searcher!: Searcher;

  private searchText     = signal('');
  protected showOnlySelected = signal(false);

  protected filtered = computed(() => {
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

  protected displayed = computed(() => {
    const list = this.filtered();
    if (!this.showOnlySelected()) return list;
    const ids = this.selectedIds();
    return list.filter((e) => ids.includes(e.id));
  });

  constructor() {
    effect(() => {
      if (this.showOnlySelected() && this.selectedIds().length === 0) {
        untracked(() => this.showOnlySelected.set(false));
      }
    });
  }

  search(text: string): void {
    this.searchText.set(text);
  }

  isSelected(id: number): boolean {
    return this.multiSelect()
      ? this.selectedIds().includes(id)
      : this.selectedId() === id;
  }

  toggle(id: number): void {
    if (!this.selectable()) {
      if (this.apprenticeEditable()) this.onToggleApprentice.emit(id);
      return;
    }
    if (this.multiSelect()) {
      this.onToggle.emit(id);
    } else {
      this.onSelect.emit(id);
    }
  }

  isApprentice(id: number): boolean {
    return this.apprenticeIds().includes(id);
  }

  toggleApprentice(event: Event, id: number): void {
    if (!this.isSelected(id)) return;
    event.stopPropagation();
    this.onToggleApprentice.emit(id);
  }

  remove(id: number): void {
    this.onDelete.emit(id);
  }

  clear(): void {
    this.searchText.set('');
    this.showOnlySelected.set(false);
    this.searcher?.clear();
  }
}
