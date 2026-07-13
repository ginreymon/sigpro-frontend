import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, signal } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-drag-carousel',
  imports: [],
  templateUrl: './drag-carousel.html',
  styleUrl: './drag-carousel.css',
})
export class DragCarousel implements AfterViewInit, OnDestroy {
  @ViewChild('container') container!: ElementRef;
  @ViewChild('track') track!: ElementRef;

  @Input() leadingPadding: boolean = true;
  @Input() verticalPadding: boolean = true;

  currentOffset = 0;
  cardWidth = 200;
  isLargeScreen = signal(window.innerWidth >= 1024);

  dragDelta = 0;
  isDragging = false;
  private touchStartX = 0;
  private readonly SWIPE_THRESHOLD = 50;
  private readonly MOUSE_THRESHOLD = 80;

  private viewReady = false;
  private pendingIndex: number | null = null;

  @Input() set selectedIndex(index: number | null) {
    this.pendingIndex = index;
    this.scrollToSelected();
  }

  private resizeSub: Subscription;

  constructor() {
    this.resizeSub = fromEvent(window, 'resize').subscribe(() => {
      this.isLargeScreen.set(window.innerWidth >= 1024);
    });
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.scrollToSelected();
  }

  ngOnDestroy() {
    this.resizeSub.unsubscribe();
  }

  private scrollToSelected() {
    if (!this.viewReady || this.pendingIndex == null) return;

    const containerWidth = this.container.nativeElement.offsetWidth;
    const trackWidth = this.track.nativeElement.scrollWidth;
    const maxOffset = Math.max(0, trackWidth - containerWidth);

    this.currentOffset = Math.min(this.pendingIndex * this.cardWidth, maxOffset);
  }

  next() {
    const containerWidth = this.container.nativeElement.offsetWidth;
    const trackWidth = this.track.nativeElement.scrollWidth;

    const maxOffset = trackWidth - containerWidth;

    const nextOffset = this.currentOffset + this.cardWidth;

    this.currentOffset = Math.min(nextOffset, maxOffset);
  }

  prev() {
    const prevOffset = this.currentOffset - this.cardWidth;
    this.currentOffset = Math.max(0, prevOffset);
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
    this.isDragging = true;
    this.dragDelta = 0;
  }

  onTouchMove(e: TouchEvent) {
    this.dragDelta = e.touches[0].clientX - this.touchStartX;
  }

  onTouchEnd() {
    if (this.dragDelta < -this.SWIPE_THRESHOLD) this.next();
    else if (this.dragDelta > this.SWIPE_THRESHOLD) this.prev();
    this.dragDelta = 0;
    this.isDragging = false;
  }

  onMouseDown(e: MouseEvent) {
    this.touchStartX = e.clientX;
    this.isDragging = true;
    this.dragDelta = 0;
    e.preventDefault();
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    this.dragDelta = e.clientX - this.touchStartX;
  }

  onMouseUp() {
    if (!this.isDragging) return;
    if (this.dragDelta < -this.MOUSE_THRESHOLD) this.next();
    else if (this.dragDelta > this.MOUSE_THRESHOLD) this.prev();
    this.dragDelta = 0;
    this.isDragging = false;
  }
}
