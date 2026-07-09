import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, computed, inject, signal } from '@angular/core';

@Component({
  selector: 'app-ui-metric-popover',
  templateUrl: './ui-metric-popover.html',
})
export class UiMetricPopover implements OnDestroy {
  @Input() value: number | string | null | undefined;
  @Input() emptyLabel = 'Sin valor';
  @Input() valueClass = 'font-semibold text-green-600 cursor-pointer select-none';
  @Input() emptyClass = 'text-slate-400 text-xs cursor-pointer select-none';

  @Output() emptyClick = new EventEmitter<void>();

  private elementRef = inject(ElementRef<HTMLElement>);

  open = signal(false);
  style = signal<Record<string, string>>({});

  numericValue = computed(() => {
    if (this.value === null || this.value === undefined || this.value === '') return null;
    const numeric = Number(this.value);
    return Number.isFinite(numeric) ? numeric : null;
  });

  private readonly scrollHandler = (): void => this.close();

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.scrollHandler, true);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  handleEmptyClick(event: MouseEvent): void {
    event.stopPropagation();
    this.emptyClick.emit();
  }

  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();

    if (this.open()) {
      this.close();
      return;
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const POPOVER_HEIGHT = 160;
    const OFFSET = 4;
    const style: Record<string, string> = {
      position: 'fixed',
      zIndex: '9999',
      width: '192px',
      left: `${rect.left}px`,
    };

    if (rect.bottom + OFFSET + POPOVER_HEIGHT <= window.innerHeight) {
      style['top'] = `${rect.bottom + OFFSET}px`;
    } else {
      style['bottom'] = `${window.innerHeight - rect.top + OFFSET}px`;
    }

    this.style.set(style);
    this.open.set(true);
    document.addEventListener('scroll', this.scrollHandler, true);
  }

  private close(): void {
    this.open.set(false);
    document.removeEventListener('scroll', this.scrollHandler, true);
  }
}
