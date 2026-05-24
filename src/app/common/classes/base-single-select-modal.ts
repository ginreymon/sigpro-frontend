import { Directive, EventEmitter, Input, Output, signal } from '@angular/core';
import { Searcher } from '../../shared/components/searcher/searcher';

@Directive()
export abstract class BaseSingleSelectModal<T extends { id: number }> {
  @Input() visible: boolean = false;
  @Input('selectedId') set setSelectedId(value: number | null) {
    this._selectedId.set(value);
  }
  @Output() onSelect = new EventEmitter<T>();
  @Output() onClose = new EventEmitter<void>();

  protected abstract searcher: Searcher | undefined;

  protected _items: T[] = [];
  filtered = signal<T[]>([]);
  attempted = signal(false);
  _selectedId = signal<number | null>(null);

  protected setItems(value: T[]): void {
    this._items = value;
    this.filtered.set(value);
  }

  isSelected(id: number): boolean {
    return this._selectedId() === id;
  }

  select(item: T): void {
    if (this._selectedId() === item.id) {
      this._selectedId.set(null);
      return;
    }
    this._selectedId.set(item.id);
  }

  abstract search(text: string): void;

  save(): void {
    if (!this._selectedId()) {
      this.attempted.set(true);
      return;
    }
    const item = this._items.find(i => i.id === this._selectedId());
    if (item) this.onSelect.emit(item);
    this.onClose.emit();
    this._reset();
  }

  cancel(): void {
    this.onClose.emit();
    this._reset();
  }

  protected _reset(): void {
    this.attempted.set(false);
    this.searcher?.clear();
  }
}
