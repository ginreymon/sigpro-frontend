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
  inject,
  signal,
} from '@angular/core';
import { NgStyle } from '@angular/common';

const OFFSET = 4;
const PANEL_WIDTH = 220;
const VIEWPORT_MARGIN = 8;
const HEADER_HEIGHT = 40;
const MIN_LIST_HEIGHT = 120;
const DEFAULT_LIST_MAX_HEIGHT = 220;

@Component({
  selector: 'app-table-column-filter',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './table-column-filter.html',
})
export class TableColumnFilter implements AfterViewInit, OnDestroy {
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef<HTMLElement>);

  @ViewChild('panel') private panelRef!: ElementRef<HTMLElement>;

  @Input() values: any[] = [];
  @Input() isValueChecked: (value: any) => boolean = () => false;
  @Input() isActive = false;

  @Output() toggleValue = new EventEmitter<any>();
  @Output() clearFilter = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isOpen = signal(false);
  style = signal<Record<string, string>>({});
  listMaxHeight = signal(`${DEFAULT_LIST_MAX_HEIGHT}px`);

  private anchor: HTMLElement | null = null;

  private readonly onWindowResize = (): void => {
    if (this.anchor) this.reposition(this.anchor);
  };

  private readonly onDocumentScroll = (event: Event): void => {
    if (this.panelRef?.nativeElement.contains(event.target as Node)) return;
    this.close();
  };

  ngAfterViewInit(): void {
    this.renderer.appendChild(document.body, this.panelRef.nativeElement);
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onDocumentScroll, true);
    window.removeEventListener('resize', this.onWindowResize);
    this.panelRef?.nativeElement.remove();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node;
    if (this.panelRef.nativeElement.contains(target) || this.elementRef.nativeElement.contains(target)) return;
    this.close();
  }

  open(anchor: HTMLElement): void {
    this.anchor = anchor;
    this.reposition(anchor);
    this.isOpen.set(true);
    document.addEventListener('scroll', this.onDocumentScroll, true);
    window.addEventListener('resize', this.onWindowResize);
  }

  private reposition(anchor: HTMLElement): void {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);

    let left = rect.left;
    if (left + width > window.innerWidth - VIEWPORT_MARGIN) left = window.innerWidth - width - VIEWPORT_MARGIN;
    left = Math.max(VIEWPORT_MARGIN, left);

    const spaceBelow = window.innerHeight - rect.bottom - OFFSET - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - OFFSET - VIEWPORT_MARGIN;
    const openBelow = spaceBelow >= Math.min(spaceAbove, HEADER_HEIGHT + MIN_LIST_HEIGHT) || spaceBelow >= spaceAbove;

    const availableSpace = Math.max(MIN_LIST_HEIGHT, (openBelow ? spaceBelow : spaceAbove) - HEADER_HEIGHT);
    this.listMaxHeight.set(`${Math.min(DEFAULT_LIST_MAX_HEIGHT, availableSpace)}px`);

    const style: Record<string, string> = {
      position: 'fixed',
      left: `${left}px`,
      width: `${width}px`,
      zIndex: '9999',
    };

    if (openBelow) {
      style['top'] = `${rect.bottom + OFFSET}px`;
    } else {
      style['bottom'] = `${window.innerHeight - rect.top + OFFSET}px`;
    }

    this.style.set(style);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.anchor = null;
    document.removeEventListener('scroll', this.onDocumentScroll, true);
    window.removeEventListener('resize', this.onWindowResize);
    this.closed.emit();
  }
}
