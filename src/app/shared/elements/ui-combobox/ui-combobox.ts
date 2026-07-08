import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
  computed,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';

const DROPDOWN_MAX_HEIGHT = 224; // px, matches max-h-56
const OFFSET = 4;

@Component({
  selector: 'app-ui-combobox',
  standalone: true,
  templateUrl: './ui-combobox.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCombobox),
      multi: true,
    },
  ],
})
export class UiCombobox extends BaseControlValueAccessor<any> implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  @ViewChild('dropdown') private dropdownRef!: ElementRef<HTMLUListElement>;

  protected _items: any[] = [];

  @Input() set items(arr: any[]) {
    this._items = arr ?? [];
  }

  @Input() key: string | null = null;
  @Input() keyValue: string | null = null;

  override value: string | number | null = null;

  @Output() onSelect = new EventEmitter<{ index: number; value: any }>();

  searchText = signal('');
  isOpen = signal(false);
  activeIndex = signal(0);
  style = signal<Record<string, string>>({});

  private readonly scrollHandler = (): void => this.close();

  private label(item: any): string {
    return this.key ? item[this.key] : item;
  }

  private itemValue(item: any): any {
    return this.keyValue ? item[this.keyValue] : item;
  }

  filteredItems = computed(() => {
    const text = this.searchText().trim().toLowerCase();
    if (!text) return this._items;
    return this._items.filter((item) => this.label(item).toString().toLowerCase().includes(text));
  });

  override writeValue(value: any): void {
    this.value = value;
    const item = this._items.find((i) => this.itemValue(i) == value);
    this.searchText.set(item ? this.label(item) : '');
  }

  ngAfterViewInit(): void {
    this.renderer.appendChild(document.body, this.dropdownRef.nativeElement);
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.scrollHandler, true);
    this.dropdownRef?.nativeElement.remove();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private open(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const style: Record<string, string> = {
      position: 'fixed',
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: '9999',
    };

    if (rect.bottom + OFFSET + DROPDOWN_MAX_HEIGHT <= window.innerHeight) {
      style['top'] = `${rect.bottom + OFFSET}px`;
    } else {
      style['bottom'] = `${window.innerHeight - rect.top + OFFSET}px`;
    }

    this.style.set(style);
    this.isOpen.set(true);
    document.addEventListener('scroll', this.scrollHandler, true);
  }

  onInputChange(text: string): void {
    this.searchText.set(text);
    this.activeIndex.set(0);
    this.open();
  }

  onFocus(): void {
    this.activeIndex.set(0);
    this.open();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.open();
        return;
      }
      const max = this.filteredItems().length - 1;
      this.activeIndex.set(Math.min(this.activeIndex() + 1, max < 0 ? 0 : max));
      this.scrollActiveIntoView();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
      this.scrollActiveIntoView();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.filteredItems()[this.activeIndex()];
      if (item) this.selectItem(item);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  selectItem(item: any): void {
    const value = this.itemValue(item);
    const index = this._items.indexOf(item);
    this.value = value;
    this.searchText.set(this.label(item));
    this.onChange(value);
    this.onSelect.emit({ index, value: item });
    this.close();
  }

  private scrollActiveIntoView(): void {
    queueMicrotask(() => {
      const el = this.dropdownRef?.nativeElement.querySelector(
        `[data-index="${this.activeIndex()}"]`,
      );
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  onBlur(): void {
    this.close();
  }

  private close(): void {
    this.isOpen.set(false);
    document.removeEventListener('scroll', this.scrollHandler, true);

    if (!this.searchText().trim()) {
      this.clear();
      this.onTouched();
      return;
    }

    const item = this._items.find((i) => this.itemValue(i) == this.value);
    this.searchText.set(item ? this.label(item) : '');
    this.onTouched();
  }

  private clear(): void {
    if (this.value == null) return;
    this.value = null;
    this.onChange(null);
    this.onSelect.emit({ index: -1, value: null });
  }
}
